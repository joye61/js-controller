import { Table } from './Table';
import { Pool, createPool } from 'mysql2/promise';

export interface PoolOption {
  // 连接池数量限制
  limit: number;
  // 连接主机
  host: string;
  // 连接端口
  port: number;
  // 用户名
  user: string;
  // 密码
  password: string;
  // 默认连接字符集
  charset: string;
  // 连接数据库
  database: string;
  // 是否开启调试，会打印SQL语句
  debug: boolean;
}

export class MySQL {
  // 缓存所有的连接池
  private static instances: Record<string, MySQL> = {};

  /**
   * 构造函数，私有单例，只能通过getInstance创建
   * @param pool 
   * @param debug 
   */
  private constructor(public pool: Pool, public debug: boolean = false) {}

  /**
   * 获取一个连接池实例
   * @param option
   * @returns
   */
  public static getInstance(option?: Partial<PoolOption>): MySQL {
    let config: Partial<PoolOption> = {
      limit: 10,
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      charset: 'utf8mb4',
      debug: false,
    };
    if (option && typeof option === 'object') {
      config = {
        ...config,
        ...option,
      };
    }
    const cacheKey = JSON.stringify(config);
    if (cacheKey in MySQL.instances) {
      return MySQL.instances[cacheKey];
    }

    const pool = createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      charset: config.charset,
      database: config.database,
      connectionLimit: config.limit,
      waitForConnections: true,
    });

    const instance = new MySQL(pool, config.debug);
    MySQL.instances[cacheKey] = instance;

    return instance;
  }

  /**
   * 创建一个新的表实例
   * @param name
   * @returns
   */
  public table(name: string) {
    return new Table(name, this);
  }
}
