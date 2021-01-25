import { MongodbConnectOption } from "./db";
import path from "path";

export interface ConfigOption {
  // 应用程序名字
  appName: string;
  // 应用程序版本
  appVersion: string;
  // 打印错误
  printError: boolean;
  // 监听本地地址
  httpHost: string;
  // 监听的端口
  httpPort: number | string;
  // POST请求的请求体限制（字节）
  postBodyLimit: number;
  // 控制器根目录
  controllerRootDir: string;
  // 调用动作之前触发的钩子名字
  onBeforeActionHook: string;
  // 调用动作之后触发的钩子名字
  onAfterActionHook: string;
  // mongodb数据库链接选项
  mongodbConnectOption?: MongodbConnectOption;
}

// 配置数据
export let configData: Partial<ConfigOption> = {
  httpHost: "127.0.0.1",
  httpPort: 9000,
  printError: false,
  postBodyLimit: 1024 * 1024 * 8,
  onBeforeActionHook: "onBeforeActionCall",
  onAfterActionHook: "onAfterActionCall",
};

/**
 * 加载配置数据
 * @param config
 */
export async function loadConfig(configRootDir?: string) {
  // 如果配置文件根目录没有指定，则默认为当前执行目录下的config目录
  if (!configRootDir) {
    configRootDir = path.resolve(process.cwd(), "./config");
  }

  // 加载主配置
  const mainConfigFile = path.resolve(configRootDir, "./main.js");
  const mainConfig: Partial<ConfigOption> = (await import(mainConfigFile))
    .default;

  // 先将主配置合并到配置中
  configData = { ...configData, ...mainConfig };

  // 如果存在环境相关的配置，则将配置合并到配置中
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

  // 必须制定控制器根目录
  if (!configData.controllerRootDir) {
    throw new Error(`The controller root directory must be developed`);
  }
}

/**
 * 根据键获取配置值
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
 * 设置配置项
 * @param key
 * @param value
 */
export function setConfig<T>(key: string, value: T) {
  (configData as any)[key] = value;
}
