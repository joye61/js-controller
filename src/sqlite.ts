import path from 'path';
import SQLiteConstructor, { type Database } from 'better-sqlite3';
import { Table } from './table';
import { App } from './app';

export interface CachedDbs {
  [dbpath: string]: SQLite;
}

export interface CachedTables {
  [tableName: string]: Table;
}

export class SQLite {
  // 已缓存的表
  private tables: CachedTables = {};
  private static dbs: CachedDbs = {};
  private db: Database;
  private constructor(private dbpath: string) {
    this.db = new SQLiteConstructor(path.normalize(this.dbpath), {
      verbose(...args: any[]) {
        App.env() === 'development' && console.log(...args);
      },
    });
  }

  /**
   * 创建一个SQLite数据库实例
   * @param dbpath string
   * @returns
   */
  public static create(dbpath: string) {
    if (SQLite.dbs[dbpath] instanceof SQLiteConstructor) {
      return SQLite.dbs[dbpath];
    }
    return (SQLite.dbs[dbpath] = new SQLite(dbpath));
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
