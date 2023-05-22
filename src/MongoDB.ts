import { Db, MongoClient } from 'mongodb';

/**
 * MongoDB客户端实例
 */
export class MongoDB {
  // 缓存所有的客户端连接实例
  private static clients: Record<string, MongoClient> = {};

  /**
   * 创建一个新的mongodb客户端并连接
   * 格式：mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[defaultauthdb][?options]]
   * @param uri 默认 mongodb://127.0.0.1:27017
   */
  public static async create(uri = 'mongodb://127.0.0.1:27017') {
    let client = MongoDB.clients[uri];
    if (client && client instanceof MongoClient) {
      return client;
    }

    client = new MongoClient(uri, {
      keepAlive: true,
      noDelay: true,
    });
    client.once('serverClosed', () => {
      delete MongoDB.clients[uri];
    });
    await client.connect();

    MongoDB.clients[uri] = client;
    return client;
  }

  /**
   * 取数据库
   * @param name
   * @returns
   */
  public db(name: string): Db {
    return this.db(name);
  }
}
