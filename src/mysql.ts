import mysql, { Pool, PoolConnection, PoolOptions } from 'mysql2/promise';

export class MySQL {
  // 数据库连接池
  private pool: Pool;


  constructor(option: PoolOptions) {
    const config: PoolOptions = {
      charset: 'utf8mb4',
      ...option,
    };
    this.pool = mysql.createPool(config);
  }

  async table(name: string) {
    const conn = await this.pool.getConnection();
    return new Table(name, conn);
  }

  /**
   * 关闭数据库连接池
   */
  async close() {
    await this.pool.end();
  }
}

class Table {
  constructor(public name: string, public conn: PoolConnection) {}

  public async query(sql: string) {

  }
  public async get() {}
  public async gets() {}
  public async update() {}
  public async add() {}
  public async remove() {}
}
