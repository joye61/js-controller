import { MongodbConnectOption } from "./db";
import path from "path";

export interface ConfigOption {
  // If or not debugging is enabled, this mode will output errors and other information
  debug: boolean;
  // Listen to the local address
  httpHost?: string;
  // The port to listen on
  httpPort?: number | string;
  // POST request body limit (bytes)
  postBodyLimit?: number;
  // Controller root directory
  controllerRootDir: string;
  // name of the hook that is triggered before the action is called
  onBeforeActionHook?: string;
  // The name of the hook that fires after the action is invoked
  onAfterActionHook?: string;
  // mongodb database linking option
  mongodbConnectOption?: MongodbConnectOption;
}

// An object that holds configuration data and contains the default configuration
export let configData: Partial<ConfigOption> = {
  httpHost: "127.0.0.1",
  httpPort: 9000,
  debug: false,
  postBodyLimit: 1024 * 1024 * 8,
  onBeforeActionHook: "onBeforeActionCall",
  onAfterActionHook: "onAfterActionCall",
};

/**
 * Load configuration data, execute only once
 * @param config
 */
export async function loadConfig(configRootDir?: string) {
  // If the root directory of the configuration file is not specified, 
  // the default is the config directory in the current execution directory
  if (!configRootDir) {
    configRootDir = path.resolve(process.cwd(), "./config");
  }

  // Load main configuration
  const mainConfigFile = path.resolve(configRootDir, "./main.js");
  const mainConfig: Partial<ConfigOption> = (await import(mainConfigFile))
    .default;

  // First merge the master configuration into the configuration
  configData = { ...configData, ...mainConfig };

  // If environment-related configuration exists, 
  // merge the configuration into the configuration
  if (process.env.NODE_ENV) {
    const envConfigFile = path.resolve(
      configRootDir,
      `./${process.env.NODE_ENV}.js`
    );
    try {
      const envConfig = (await import(envConfigFile)).default;
      configData = { ...configData, ...envConfig };
    } catch (error) {}
  }

  // The controller root directory must be specified
  if (!configData.controllerRootDir) {
    throw new Error(`The controller root directory must be developed`);
  }
}

/**
 * Get configuration values based on keys
 * @param key
 * @param value
 */
export function getConfig<T = undefined>(
  key: keyof ConfigOption,
  value?: T
): T | undefined {
  if (!key || typeof key !== "string" || configData[key] === undefined) {
    return value;
  }
  return configData[key] as any;
}

/**
 * Set configuration items
 * @param key
 * @param value
 */
export function setConfig<T>(key: string, value: T) {
  (configData as any)[key] = value;
}
