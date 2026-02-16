import * as $FC from '@alicloud/fc20230330';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Config } from '../../../utils/config';
import { checkDockerAvailable, dockerBuild, dockerLogin, dockerPush } from '../../../utils/docker';
import { generateDockerfile, detectProjectType } from '../../../utils/dockerfile';
import { ensureAcrReady, getDockerLoginCredentials, buildImageUri, formatTimestampTag } from '../../cr';
import type { RuntimeHandler, ResolvedRuntimeConfig } from '../runtime-handler';

const CUSTOM_CONTAINER_RUNTIME = 'custom-container';
const DEFAULT_PORT = 9000;

export const dockerHandler: RuntimeHandler = {
  name: 'docker',
  defaultEntry: '',
  unsupportedMessage: '当前地域暂不支持 custom-container 运行时。请确认目标地域支持自定义容器镜像后重试。',

  async prepareBootFile(entryFile: string, _outdir: string) {
    const projectRoot = process.cwd();

    checkDockerAvailable();

    if (!existsSync(join(projectRoot, 'Dockerfile'))) {
      const detector = detectProjectType(projectRoot);
      if (!detector) {
        throw new Error(
          '未找到 Dockerfile，且无法自动探测项目类型。\n' +
          '请在项目根目录创建 Dockerfile，或确保存在 package.json / requirements.txt'
        );
      }
      const content = generateDockerfile(projectRoot, entryFile || undefined);
      writeFileSync(join(projectRoot, 'Dockerfile'), content);
    }

    const auth = Config.requireAuth();
    const project = Config.getProject();
    const appName = project.appName;
    if (!appName) throw new Error('appName 未设置，请检查项目配置');

    const acrInfo = await ensureAcrReady(appName, auth.region, auth);
    const tag = formatTimestampTag();
    const pushUri = buildImageUri(acrInfo, tag, false);

    dockerBuild(pushUri, projectRoot);

    const creds = await getDockerLoginCredentials(acrInfo, auth);
    dockerLogin(creds.endpoint, creds.userName, creds.password);
    dockerPush(pushUri);

    const vpcUri = buildImageUri(acrInfo, tag, true);
    return vpcUri;
  },

  async resolveConfig(_outdir: string, bootFile: string): Promise<ResolvedRuntimeConfig> {
    return {
      runtime: CUSTOM_CONTAINER_RUNTIME,
      handler: 'not-used',
      customContainerConfig: new $FC.CustomContainerConfig({
        image: bootFile,
        port: DEFAULT_PORT
      }),
      skipCodePackaging: true
    };
  }
};
