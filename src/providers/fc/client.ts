import { type AuthConfig } from '../../utils/config';
import { createSharedFcClient } from '../../utils/sdk';

export function createFcClient(auth?: AuthConfig) {
  return createSharedFcClient(auth);
}
