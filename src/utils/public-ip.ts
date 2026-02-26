import { text, isCancel } from '@clack/prompts';
import { isInteractiveTTY } from './cli-shared';

const IP_SERVICES = [
  'https://ifconfig.me/ip',
  'https://api.ipify.org',
  'https://checkip.amazonaws.com'
];

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

async function fetchPublicIp(): Promise<string | null> {
  for (const url of IP_SERVICES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const ip = (await res.text()).trim();
      if (IPV4_RE.test(ip)) return ip;
    } catch { /* try next */ }
  }
  return null;
}

export async function resolvePublicIp(): Promise<string> {
  const ip = await fetchPublicIp();
  if (ip) return ip;

  if (!isInteractiveTTY()) {
    throw new Error('无法自动获取公网 IP，请通过 --ip 参数手动指定');
  }

  const input = await text({
    message: '无法自动获取公网 IP，请手动输入你的公网 IP 地址:',
    placeholder: '例如: 1.2.3.4',
    validate: (value) => {
      if (!IPV4_RE.test(value.trim())) return '请输入有效的 IPv4 地址';
    }
  });
  if (isCancel(input)) process.exit(0);
  return String(input).trim();
}
