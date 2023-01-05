import { SQLite } from './sqlite';

export class Model {
  /**
   * 创建一个SQLite库
   * @param tableName
   * @param dbPath
   * @returns
   */
  protected sqliteTable(tableName: string, dbPath: string) {
    return SQLite.create(dbPath).table(tableName);
  }

  /**
   * 标准化页码信息
   * @param page 页码约定从1开始
   * @param pageSize
   */
  protected normalizePageInfo(page: number = 1, pageSize: number = 10) {
    page = Number(page) || 1;
    pageSize = Number(pageSize) || 10;
    let offset = (page - 1) * pageSize;
    if (offset < 0) {
      offset = 0;
    }
    return { page: offset / pageSize + 1, pageSize, offset, limit: pageSize };
  }
}
