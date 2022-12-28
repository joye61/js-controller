import { SQLite } from './sqlite';

export class Model {
  protected table(tableName: string, dbName = 'main.db') {
    return SQLite.create(dbName).table(tableName);
  }

  /**
   * 标准化页码信息
   * @param page
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
