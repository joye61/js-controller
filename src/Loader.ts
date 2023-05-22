import path from 'path';

/**
 * 一个类加载器，只能用来加载类
 * 如果非默认导出，则约定一个文件只有一个类
 */
export class Loader {
  /**
   * 加载器加载文件的基础路径，可以是多个目录
   * 已第一个找到的为准，请自己确保唯一性
   */
  private basePath: string[] = [];

  /**
   * 构造函数
   * @param basePath
   */
  constructor(basePath?: string | string[]) {
    if (typeof basePath === 'string') {
      this.basePath.push(basePath);
    } else if (Array.isArray(basePath)) {
      this.basePath.push(...basePath);
    }
  }

  /**
   * 根据路径解析一个类
   * @param classPath 用户输入的无需拼接构造函数的类名
   * @param params 类参数
   * @returns
   */
  public resolve<T>(classPath: string, ...params: any[]): T | undefined {
    const Class = require(classPath);
    // 导出函数，则是默认导出，导出一个类
    if (typeof Class === 'function') {
      return new Class(...params) as T;
    }
    // 非默认导出，则导出一个对象
    if (typeof Class === 'object') {
      const keys = Object.keys(Class);
      for (let key of keys) {
        if (typeof Class[key] === 'function') {
          return new Class[key](...params) as T;
        }
      }
    }
  }

  /**
   * 类加载器
   * @param classPath
   * @param params
   */
  public load<T>(classPath: string, ...params: any[]): T {
    const fullPaths = this.basePath.map((base) => {
      return path.resolve(base, classPath);
    });

    // 查找对应的类，第一个找到的即返回
    for (let fullPath of fullPaths) {
      const result = this.resolve<T>(fullPath, ...params);
      if (result) {
        return result;
      }
    }

    // 如果没有找到对应的类，抛出异常
    throw new Error(
      `The loader cannot find the corresponding class：${classPath}`
    );
  }
}
