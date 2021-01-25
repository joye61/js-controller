import { getConfig, loadConfig } from "./config";
import { connectMongodb, disconnectMongodb } from "./db";

/**
 * cli环境执行脚本逻辑
 * @param config 配置
 * @param fn 脚本逻辑在此
 */
export async function runWithinCli(
  fn?: () => Promise<void>,
  configRootDir?: string
): Promise<void> {
  // 加载配置，初始化执行一次
  await loadConfig(configRootDir);

  // 如果存在mongodb连接信息，则尝试连接数据库
  const mongodbUriInfo = getConfig("mongodbConnectOption");
  if (mongodbUriInfo) {
    await connectMongodb(mongodbUriInfo);
  }

  // 执行脚本逻辑
  await fn?.();

  // 关闭连接
  if (mongodbUriInfo) {
    await disconnectMongodb();
  }

  // 关闭进程
  process.exit();
}
