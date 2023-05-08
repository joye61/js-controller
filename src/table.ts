import { Pool, ResultSetHeader } from 'mysql2/promise';
import { SQLParser } from './SQLParser';

export type ValueHolders = {
  prepare: string;
  holders: Array<string | number>;
};

export interface DBWithPool {
  pool: Pool;
}

export class Table extends SQLParser {
  /**
   * 记录上次插入的记录ID
   */
  public lastInsertedId?: number = undefined;

  /**
   * 构造函数
   * @param name
   * @param db
   */
  constructor(public name: string, public db: DBWithPool) {
    super();
  }

  /**
   * 查询单个元素
   * @param where
   * @param order
   * @param field
   * @returns
   */
  public async get<T = any>(
    where?: Record<string, any> | null,
    order?: Record<string, Uppercase<'ASC' | 'DESC'>> | null,
    field = '*'
  ): Promise<T | null> {
    let result = await this.gets<T>(where, order, 0, 1, field);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 查找多个元素
   * @param where
   * @param order
   * @param offset
   * @param limit
   * @param field
   * @returns
   */
  public async gets<T = any>(
    where?: Record<string, any> | null,
    order?: Record<string, any> | null,
    offset = 0,
    limit = 0,
    field = '*'
  ): Promise<Array<T>> {
    let sql = `SELECT ${field} FROM \`${this.name}\``;
    let whereResult = this.createWhere(where);
    if (whereResult.prepare) {
      sql += ` WHERE ${whereResult.prepare}`;
    }
    let orderStat = this.createOrder(order);
    if (orderStat) {
      sql += ` ORDER BY ${orderStat}`;
    }
    if (limit > 0) {
      sql += ` LIMIT ${offset}, ${limit}`;
    }

    const result = await this.db.pool.query(sql, whereResult.holders);
    return result[0] as Array<T>;
  }

  /**
   * 新增一条数据
   * @param data
   * @returns
   */
  public async add(data: Record<string, any>): Promise<boolean> {
    let fields: string[] = [];
    let places: string[] = [];
    let holders: Array<string | number> = [];
    for (let key in data) {
      fields.push(`\`${key}\``);
      places.push('?');
      holders.push(data[key]);
    }

    let sql = `INSERT INTO \`${this.name}\` (${fields.join(
      ', '
    )}) VALUES (${places.join(', ')})`;
    const result = await this.db.pool.execute(sql, holders);
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows !== 1) {
      return false;
    }
    if (header.insertId > 0) {
      this.lastInsertedId = header.insertId;
    }

    return true;
  }

  /**
   * 如果条件存在则更新，如果不存在则添加
   * @param data
   * @param where
   */
  public async upsert(
    data: Record<string, any>,
    where?: Record<string, any> | null
  ): Promise<boolean> {
    if (!where) {
      return this.add(data);
    }
    const result = await this.get(where);
    if (!result) {
      return this.add(data);
    }
    return this.update(data, where);
  }

  /**
   * 删除记录
   * @param where
   * @param order
   * @param limit
   * @returns
   */
  public async remove(
    where?: Record<string, any> | null,
    order?: Record<string, any> | null,
    limit = 0
  ): Promise<boolean> {
    let sql = `DELETE FROM \`${this.name}\``;
    let whereResult = this.createWhere(where);
    if (whereResult.prepare) {
      sql += ` WHERE ${whereResult.prepare}`;
    }
    let orderStat = this.createOrder(order);
    if (orderStat) {
      sql += ` ORDER BY ${orderStat}`;
    }
    if (limit > 0) {
      sql += ` LIMIT ${limit}`;
    }

    const result = await this.db.pool.execute(sql, whereResult.holders);
    const header = result[0] as ResultSetHeader;
    return header.affectedRows > 0;
  }

  /**
   * 获取符合条件的记录总数
   * @param where
   * @returns
   */
  public async count(where?: Record<string, any>): Promise<number> {
    let sql = `SELECT COUNT(*) as \`total_num\` FROM \`${this.name}\``;
    let whereResult = this.createWhere(where);
    if (whereResult.prepare) {
      sql += ` WHERE ${whereResult.prepare}`;
    }
    let result = await this.db.pool.query(sql, whereResult.holders);
    const list = <Array<any>>result[0];
    return list.length === 0 ? 0 : list[0].total_num;
  }

  /**
   * 更新数据
   * @param data
   * @param where
   * @param order
   * @param limit
   * @returns
   */
  public async update(
    data: Record<string, any>,
    where?: Record<string, any> | null,
    order?: Record<string, any> | null,
    limit = 0
  ): Promise<boolean> {
    let parts: string[] = [];
    let holders: Array<string | number> = [];
    for (let key in data) {
      let result = this.createDataFilter(key, data[key]);
      if (!result.prepare) {
        continue;
      }
      parts.push(result.prepare);
      holders.push(...result.holders);
    }
    let sql = `UPDATE \`${this.name}\` SET`;
    if (parts.length === 0) {
      return false;
    }
    sql += ` ${parts.join(', ')}`;

    let whereResult = this.createWhere(where);
    if (whereResult.prepare) {
      sql += ` WHERE ${whereResult.prepare}`;
      holders.push(...whereResult.holders);
    }

    let orderStat = this.createOrder(order);
    if (orderStat) {
      sql += ` ORDER BY ${orderStat}`;
    }
    if (limit > 0) {
      sql += ` LIMIT ${limit}`;
    }

    const result = await this.db.pool.execute(sql, holders);
    const header = result[0] as ResultSetHeader;
    return header.affectedRows > 0;
  }
}
