import path from 'path';
import SQLiteConstructor, { type Database } from 'better-sqlite3';
import { Table } from './table';
import type { Idb } from './types';
import { log } from './utils';

export interface CachedDbs {
  [dbpath: string]: SQLite;
}

export interface CachedTables {
  [tableName: string]: Table;
}

export class SQLite implements Idb {
  // 已缓存的表
  private tables: CachedTables = {};
  private static dbs: CachedDbs = {};
  private db: Database;

  // 上次插入数据库的ID
  public lastInsertId?: number;

  // 上次执行的SQL语句
  public lastSQL?: any[];

  private constructor(private dbpath: string) {
    this.db = new SQLiteConstructor(path.normalize(this.dbpath), {
      verbose(...args: any[]) {
        log(...args);
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
    let tableInstance = new Table(tableName, this);
    this.tables[tableName] = tableInstance;
    return tableInstance;
  }

  /**
   * 执行更新、添加、删除操作
   * @param sql
   * @param holders
   * @returns
   */
  public exec(sql: string, holders: Array<string | number>): boolean {
    try {
      const stat = this.db.prepare(sql);
      const result = stat.run(...holders);
      if (result.lastInsertRowid && result.lastInsertRowid > 0) {
        this.lastInsertId = Number(result.lastInsertRowid);
      }
      return result.changes > 0;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  /**
   * 执行查询操作
   * @param sql
   * @param holders
   * @returns
   */
  public query<T = any>(
    sql: string,
    holders: Array<string | number>
  ): Array<T> {
    try {
      const stat = this.db.prepare(sql);
      const result = stat.all(...holders);
      return result as Array<T>;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}
