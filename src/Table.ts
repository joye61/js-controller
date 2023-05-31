import { Pool, ResultSetHeader } from 'mysql2/promise';
import { SQLParser } from './SQLParser';

export interface DB {
  pool: Pool;
  debug: boolean;
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
  constructor(public name: string, public db: DB) {
    super();
  }

  /**
   * 打印调试信息
   * @param params
   */
  #debug(...params: any[]) {
    if (this.db.debug) {
      console.log(`[MySQL DEBUG]:`, ...params);
    }
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

    try {
      this.#debug(this.db.pool.format(sql, whereResult.holders));
      const result = await this.db.pool.query(sql, whereResult.holders);
      return result[0] as Array<T>;
    } catch (error) {
      console.error(error);
      return [];
    }
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

    try {
      this.#debug(this.db.pool.format(sql, holders));
      const result = await this.db.pool.execute(sql, holders);
      const header = result[0] as ResultSetHeader;
      if (header.affectedRows !== 1) {
        return false;
      }
      if (header.insertId > 0) {
        this.lastInsertedId = header.insertId;
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
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

    try {
      // 对于删除逻辑，只要不报错，都认为成功
      this.#debug(this.db.pool.format(sql, whereResult.holders));
      await this.db.pool.execute(sql, whereResult.holders);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
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

    try {
      this.#debug(this.db.pool.format(sql, whereResult.holders));
      let result = await this.db.pool.query(sql, whereResult.holders);
      const list = <Array<any>>result[0];
      return list.length === 0 ? 0 : list[0].total_num;
    } catch (error) {
      console.error(error);
      // 取数量，如果报错，返回0
      return 0;
    }
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

    try {
      // 对于更新逻辑，只要不报错，都认为成功
      this.#debug(this.db.pool.format(sql, holders));
      await this.db.pool.execute(sql, holders);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
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
}
