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
  // 默认控制器文件路径
  defaultControllerPath: string;
  // 默认动作名
  defaultActionName: string;
  // mongodb数据库链接选项
  mongodbConnectOption?: MongodbConnectOption;
}
