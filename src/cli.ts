import { ConfigOption, getConfig, loadConfig } from "./config";
import { connectMongodb, disconnectMongodb } from "./db";

/**
 * cli环境执行脚本逻辑
 * @param config 配置
 * @param fn 脚本逻辑在此
 */
export async function runWithinCli(
  config: Partial<ConfigOption>,
  fn: () => Promise<void>
): Promise<void> {
  // 环境变量初始化，确保环境变量存在
  const env = process.env.NODE_ENV;
  const lastArg = process.argv[process.argv.length - 1];
  const envArr: Array<string | undefined> = ["development", "production"];
  if (!env && !envArr.includes(env)) {
    process.env.NODE_ENV = "development";
  }
  if (lastArg === "--dev") {
    process.env.NODE_ENV = "development";
  } else if (lastArg === "--prod") {
    process.env.NODE_ENV = "production";
  }

  // 加载配置
  loadConfig(config);

  // 如果存在mongodb连接信息，则尝试连接数据库
  const mongodbUriInfo = getConfig("mongodbConnectOption");
  if (mongodbUriInfo) {
    await connectMongodb(mongodbUriInfo);
  }

  // 执行脚本逻辑
  await fn();

  // 关闭连接
  if (mongodbUriInfo) {
    await disconnectMongodb();
  }

  // 关闭进程
  process.exit();
}
