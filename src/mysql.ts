import mysql, { Pool, PoolConnection, PoolOptions } from 'mysql2/promise';

// mysql的值类型
type MySQLValue = number | string;
type OrderValue = {
  [name: string]: 1 | -1;
};

export class MySQL {
  // 数据库连接池
  public pool: Pool;

  constructor(option: PoolOptions) {
    const config: PoolOptions = {
      charset: 'utf8mb4',
      ...option,
    };
    this.pool = mysql.createPool(config);
  }

  table(name: string) {
    // const conn = await this.pool.getConnection();
    return new Table(name, this);
  }

  /**
   * 关闭数据库连接池
   */
  async close() {
    await this.pool.end();
  }
}

class Table {
  constructor(public name: string, public db: MySQL) {}

  /**
   * 对值添加引号
   * @param value
   * @returns
   */
  public quoteValue(value: MySQLValue): MySQLValue {
    return typeof value === 'string' ? `"${value}"` : value;
  }

  /**
   * 创建AND逻辑操作
   * @param where
   * @returns
   */
  public createAndWhere(
    where?: Record<string, MySQLValue | Array<MySQLValue>>
  ): string {
    // 不合法的条件直接退出
    if (!where || typeof where != 'object') {
      return '';
    }

    // 判断操作符的正则
    const regexp =
      /(.*?)\s*(<[=>]?|>=?|!=|\s+LIKE|\s+RLIKE|\s+IN|\s+NOT\s+?IN|\s+BETWEEN)?\s*$/i;
    const outarr: Array<string> = [];
    for (let key in where) {
      const matchRes = key.match(regexp);
      if (!matchRes) continue;

      let segment = `\`${matchRes[1]}\``;
      const value = where[key];
      // = 逻辑
      if (!matchRes[2]) {
        segment += ` = ${this.quoteValue(value as MySQLValue)}`;
        outarr.push(segment);
        continue;
      }

      const operator = matchRes[2].toUpperCase().trim().replace(/\s*/g, ' ');

      // IN | NOT IN 逻辑
      if (
        (operator === 'IN' || operator === 'NOT IN') &&
        Array.isArray(value)
      ) {
        segment += ` ${operator} (${value
          .map((el) => this.quoteValue(el))
          .join(', ')})`;
        outarr.push(segment);
        continue;
      }

      // BETWEEN 逻辑
      if (operator === 'BETWEEN') {
        if (!Array.isArray(value) || value.length < 2) {
          continue;
        }
        segment += ` ${operator} ${this.quoteValue(
          value[0]
        )} AND ${this.quoteValue(value[2])}`;
        outarr.push(segment);
        continue;
      }

      // < | <= | > | >= | <> | != | LIKE | RLIKE 逻辑
      segment += ` ${operator} ${this.quoteValue(value as MySQLValue)}`;
      outarr.push(segment);
    }

    // 以AND操作符合并
    return outarr.join(' AND ');
  }

  /**
   * 创建Order条件
   * @param order
   */
  public createOrder(order?: OrderValue): string {
    if (!order || typeof order !== 'object') {
      return '';
    }
    let outarr: string[] = [];
    for (let key in order) {
      if (order[key] === 1) {
        outarr.push(`\`${key}\` ASC`);
      } else if (order[key] === -1) {
        outarr.push(`\`${key}\` DESC`);
      }
    }
    return outarr.join(', ');
  }

  public async query(sql: string) {}

  /**
   * 取一条数据
   * @param where
   * @param order
   * @param field
   * @returns
   */
  public async get(
    where?: Record<string, MySQLValue | Array<MySQLValue>>,
    order?: OrderValue,
    field = '*'
  ) {
    return this.gets(where, order, 0, 1, field);
  }

  /**
   * 取多条数据
   * @param where
   * @param order
   * @param page
   * @param limit
   * @param field
   */
  public async gets<V>(
    where?: Record<string, MySQLValue | Array<MySQLValue>>,
    order?: OrderValue,
    page?: number,
    limit?: number,
    field = '*'
  ): Promise<Array<V>> {
    let sql = `SELECT ${field} FROM \`${this.name}\``;
    const wherePart = this.createAndWhere(where);
    if (wherePart) {
      sql += ` WHERE ${wherePart}`;
    }
    const orderPart = this.createOrder(order);
    if (order) {
      sql += ` ORDER BY ${orderPart}`;
    }
    if (limit && limit > 0) {
      if (!page) page = 0;
      sql += `LIMIT ${page}, ${limit}`;
    }
    const conn = await this.db.pool.getConnection();
    const result = await conn.query(sql);
    conn.release();

    // TODO
  }

  /**
   * 更新表
   * @param data 
   * @param where 
   */
  public async update(
    data: Record<string, MySQLValue>,
    where?: Record<string, MySQLValue | Array<MySQLValue>>
  ) {
    let sql = `UPDATE \`${this.name}\` SET`;
    const pairs: string[] = [];
    for (let key in data) {
      pairs.push(`\`${key}\` = ${this.quoteValue(data[key])}`);
    }
    sql += ` ${pairs.join(', ')}`;
    const wherePart = this.createAndWhere(where);
    if (wherePart) {
      sql += ` WHERE ${wherePart}`;
    }

    const conn = await this.db.pool.getConnection();
    const result = await conn.query(sql);
    conn.release();

    // TODO
  }

  public async add() {}

  /**
   * 根据条件删除记录
   * @param where 
   */
  public async remove(where?: Record<string, MySQLValue | Array<MySQLValue>>) {}

  /**
   * 取出数据库中当前符合条件的记录总数
   * @param where 
   */
  public async count(where?: Record<string, MySQLValue | Array<MySQLValue>>){
    let sql = `SELECT count(*) AS \`total_rows\` FROM ${this.name}`;
    const wherePart = this.createAndWhere(where);
    if (wherePart) {
      sql += ` WHERE ${wherePart}`;
    }

    const conn = await this.db.pool.getConnection();
    const result = await conn.query(sql);
    conn.release();

    // TODO
  }
}
