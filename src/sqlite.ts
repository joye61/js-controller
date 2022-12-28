import path from 'path';
import { serverConfig } from '../config';
import SQLiteConstructor, { type Database } from 'better-sqlite3';
import { Table } from './table';
import { log } from './utils';

export interface CachedDbs {
  [dbname: string]: SQLite;
}

export interface CachedTables {
  [tableName: string]: Table;
}

export class SQLite {
  // 已缓存的表
  private tables: CachedTables = {};
  private static dbs: CachedDbs = {};
  private db: Database;
  private constructor(private dbname: string) {
    let fullPath = path.resolve(serverConfig.dbDir, this.dbname);
    this.db = new SQLiteConstructor(fullPath, { verbose: log });
  }

  /**
   * 创建一个SQLite数据库实例
   * @param dbname
   * @returns
   */
  public static create(dbname: string = 'main.db') {
    if (SQLite.dbs[dbname] instanceof SQLiteConstructor) {
      return SQLite.dbs[dbname];
    }
    return (SQLite.dbs[dbname] = new SQLite(dbname));
  }

  /**
   * 获取一个SQLite表实例
   * @param tableName
   */
  public table(tableName: string): Table {
    if (this.tables[tableName] instanceof Table) {
      return this.tables[tableName];
    }
    let tableInstance = new Table(tableName, this.db);
    this.tables[tableName] = tableInstance;
    return tableInstance;
  }
}
