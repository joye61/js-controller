import { MongodbConnectOption } from "./db";

export interface ConfigOption {
  // 应用程序名字
  appName: string;
  // 应用程序版本
  appVersion: string;
  // 监听本地地址
  httpHost: string;
  // 监听的端口
  httpPort: number | string;
  // 控制器根目录
  controllerRootDir: string;
  // mongodb数据库链接选项
  mongodbConnectOption?: MongodbConnectOption;
}

// 配置数据
export let configData: Partial<ConfigOption> = {};

/**
 * 加载配置数据
 * @param config
 */
export function loadConfig(config: Partial<ConfigOption>) {
  configData = { ...configData, ...config };
}

/**
 * 根据键获取配置值
 * @param key
 * @param value
 */
export function getConfig<T>(key: keyof ConfigOption, value?: T) {
  if (!key || typeof key !== "string" || configData[key] === undefined) {
    return value;
  }
  return configData[key];
}

/**
 * 设置配置项
 * @param key 
 * @param value 
 */
export function setConfig<T>(key: string, value: T) {
  (configData as any)[key] = value;
}
