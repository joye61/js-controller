import { Pool, ResultSetHeader } from "mysql2/promise";

export type ValueHolders = {
  prepare: string;
  holders: Array<string | number>;
};

export interface DBWithPool {
  pool: Pool;
}

export class Table {
  /**
   * 记录上次插入的记录ID
   */
  public lastInsertedId?: number = undefined;

  /**
   * 构造函数
   * @param name
   * @param db
   */
  constructor(public name: string, public db: DBWithPool) {}

  /**
   * 创建排序字段
   * @param order
   * @returns
   */
  public createOrder(
    order?: Record<string, Uppercase<"ASC" | "DESC">> | null
  ): string {
    if (!order) {
      return "";
    }
    let parts: Array<string> = [];
    for (let key in order) {
      let type = order[key].toUpperCase();
      if (["ASC", "DESC"].includes(type)) {
        parts.push(`\`${key}\` ${type}`);
      }
    }
    return parts.join(", ");
  }

  /**
   * 生成where段的条件
   * @param key
   * @param value
   * @returns
   */
  public createFilter(key: string, value: any): ValueHolders {
    const pattern =
      /^\s*(.*?)\s*(\<[=\>]?|\>=?|(NOT\s+)?(BETWEEN|LIKE|IN|RLIKE))?\s*$/i;
    const found = key.match(pattern);

    // 定义返回值
    let prepare = "";
    let holders: Array<string | number> = [];

    // 如果结果不匹配，直接返回
    if (!found) {
      return { prepare, holders };
    }
    const field = found[1].trim();
    let op = found[2];

    // 如果没有操作符，认为是相等逻辑
    if (!op) {
      prepare = `\`${field}\` = ?`;
      holders.push(value as any);
      return { prepare, holders };
    }
    // 操作符存在，转换维大写
    op = op.trim().replace(/\s+/, " ").toUpperCase();

    // IN | NOT IN
    if (op === "IN" || op === "NOT IN") {
      prepare = `\`${field}\` ${op} `;
      let createInPair = (list: Array<string | number>) => {
        let places: string[] = [];
        let holders: Array<string | number> = [];
        for (let item of list) {
          places.push("?");
          holders.push(item);
        }
        return {
          prepare: places.join(", "),
          holders,
        };
      };
      let list: Array<string | number> | undefined = undefined;
      if (typeof value === "string") {
        value = value.replace(/\s*\,\s*/g, ",");
        list = value.split(",");
      } else if (Array.isArray(value)) {
        list = value;
      }

      if (list) {
        let result = createInPair(list);
        prepare += `(${result.prepare})`;
        holders.push(...result.holders);
      } else {
        prepare = "";
      }

      return { prepare, holders };
    }

    // BETWEEN | NOT BETWEEN
    if (op === "BETWEEN" || op === "NOT BETWEEN") {
      if (Array.isArray(value) && value.length === 2) {
        prepare = `\`${field}\` ${op} ? AND ?`;
        holders = value;
      }
      return { prepare, holders };
    }

    // < | <= | > | >= | <> | != | LIKE | RLIKE
    prepare = `\`${field}\` ${op} ?`;
    holders.push(value as any);
    return { prepare, holders };
  }

  /**
   * 创建数据过滤，用于update逻辑
   * @param key
   * @param value
   * @returns
   */
  public createDataFilter(key: string, value: any): ValueHolders {
    // 定义返回值
    let prepare = "";
    let holders: Array<any> = [];
    const found = key.match(/^\s*(.+?)\s*([\+\-\*\/]=)?\s*$/);
    if (!found) {
      return { prepare, holders };
    }
    let field = found[1].trim();
    if (!found[2]) {
      prepare = `\`${field}\` = ?`;
      holders.push(value as any);
      return { prepare, holders };
    }

    // 带运算操作
    let op = found[2].trim()[0];
    prepare = `\`${field}\` = \`${field}\` ${op} ?`;
    holders.push(value as any);
    return { prepare, holders };
  }

  /**
   * 创建where条件段
   * @param where
   * @returns
   */
  public createWhere(where?: Record<string, any> | null): ValueHolders {
    // 定义返回值
    let prepares: Array<string> = [];
    let holders: Array<string | number> = [];
    if (!where) {
      return { prepare: "", holders };
    }

    for (let key in where) {
      let value = where[key];
      let tmpHolders = this.createFilter(key, value);
      if (tmpHolders.prepare === "") {
        continue;
      }
      prepares.push(tmpHolders.prepare);
      holders.push(...tmpHolders.holders);
    }
    return {
      prepare: prepares.join(" AND "),
      holders,
    };
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
    order?: Record<string, Uppercase<"ASC" | "DESC">> | null,
    field = "*"
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
    field = "*"
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
      places.push("?");
      holders.push(data[key]);
    }

    let sql = `INSERT INTO \`${this.name}\` (${fields.join(
      ", "
    )}) VALUES (${places.join(", ")})`;
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
    sql += ` ${parts.join(", ")}`;

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
