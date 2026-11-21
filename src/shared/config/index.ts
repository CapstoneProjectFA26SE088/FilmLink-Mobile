import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { parseEnv, resolveRuntimeApiUrl } from './env';

const parsedEnv = parseEnv({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

const devHostUri =
  Constants.expoConfig?.hostUri ??
  (Constants.expoGoConfig as { readonly debuggerHost?: string } | null)?.debuggerHost ??
  null;

export const env = {
  ...parsedEnv,
  EXPO_PUBLIC_API_URL: resolveRuntimeApiUrl(parsedEnv.EXPO_PUBLIC_API_URL, {
    platform: Platform.OS,
    hostUri: devHostUri,
  }),
};

export {
  type Env,
  EnvError,
  parseEnv,
  type RuntimeApiUrlOptions,
  resolveRuntimeApiUrl,
} from './env';
