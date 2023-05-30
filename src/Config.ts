import path from 'path';

/**
 * 一个简单的配置类，用于根据不同环境读取配置
 * 默认要求配置文件中的配置必须默认导出
 */
export class Config {
  // 所有配置
  public all: Record<string, any>;

  /**
   * 构造函数
   * @param basePath 配置文件的存储路径
   * @param defaultFile 默认配置文件
   */
  constructor(private basePath: string, private defaultFile = 'default') {
    const defaultPath = path.resolve(this.basePath, this.defaultFile);
    let envPath: string | undefined;
    if (process.env.NODE_ENV) {
      envPath = path.resolve(this.basePath, process.env.NODE_ENV);
    }

    this.all = require(defaultPath);
    // 如果跟环境相关的配置文件存在，则合并所有配置
    if (envPath) {
      const envConfig: Record<string, any> = require(envPath);
      this.all = {
        ...this.all,
        ...envConfig,
      };
    }
  }

  /**
   * 获取配置项
   * @param key 配置项
   * @param name 配置文件的名字
   */
  item<T = any>(key: string): T | undefined {
    return this.all[key] as T | undefined;
  }
}
