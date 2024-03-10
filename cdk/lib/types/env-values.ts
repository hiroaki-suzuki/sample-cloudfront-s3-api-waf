export interface EnvValues {
  readonly env: Env;
  readonly enableIpRule: boolean;
  readonly allowedIpV4: string[];
}

export type Env = 'dev';
