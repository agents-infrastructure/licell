import { registerRuntime } from '../runtime-handler';
import { nodejs20Handler } from './nodejs20';
import { nodejs22Handler } from './nodejs22';
import { python312Handler } from './python312';
import { python313Handler } from './python313';
import { dockerHandler } from './docker';

registerRuntime(nodejs20Handler);
registerRuntime(nodejs22Handler);
registerRuntime(python312Handler);
registerRuntime(python313Handler);
registerRuntime(dockerHandler);
