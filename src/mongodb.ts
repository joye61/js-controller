import {
  Db,
  MongoClient,
  Collection,
  Document,
  Filter,
  MatchKeysAndValues,
  ObjectId,
  FindOptions,
  Sort,
} from 'mongodb';

/**
 * MongoDB客户端实例
 */
export class MClient {
  // 缓存所有的客户端连接实例
  private static clients: Record<string, MongoClient> = {};

  /**
   * 创建一个新的mongodb客户端并连接
   * 格式：mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/[defaultauthdb][?options]]
   * @param uri 默认 mongodb://127.0.0.1:27017
   */
  public static async create(uri = 'mongodb://127.0.0.1:27017') {
    let client = MClient.clients[uri];
    if (client && client instanceof MongoClient) {
      return client;
    }

    client = new MongoClient(uri, {
      keepAlive: true,
      noDelay: true,
    });
    client.once('serverClosed', () => {
      delete MClient.clients[uri];
    });
    await client.connect();

    MClient.clients[uri] = client;
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

/**
 * Col实例类用于简单的操作集合
 */
export class MCol {
  // 原始的Collection实例
  public instance: Collection;

  // 上次插入的ID
  public lastInsertedId?: ObjectId;
  // 上次批量插入的ID
  public lastInsertedIds?: { [key: number]: ObjectId };

  /**
   * 构造方法
   * @param name
   * @param db
   */
  constructor(public name: string, public db: Db) {
    this.instance = this.db.collection(name);
  }

  /**
   * 删除记录
   * @param filter
   * @returns boolean
   */
  async remove(filter: Filter<Document>): Promise<boolean> {
    const result = await this.instance.deleteMany(filter);
    return result.acknowledged;
  }

  /**
   * 更新记录
   * @param filter
   * @param data
   * @returns
   */
  async update(
    filter: Filter<Document> = {},
    data: MatchKeysAndValues<Document> = {}
  ): Promise<boolean> {
    const result = await this.instance.updateMany(filter, { $set: data });
    return result.acknowledged && result.modifiedCount > 0;
  }

  /**
   * 获取记录的总条数
   * @param {*} filter
   * @param {*} option
   * @returns
   */
  async count(
    filter: Filter<Document> = {},
    option: FindOptions<Document> = {}
  ): Promise<number> {
    return this.instance.countDocuments(filter, option);
  }

  /**
   * 更新一条数据，如果不存在就插入
   * @param {*} data
   * @param {*} filter
   */
  async upsert(
    filter: Filter<Document> = {},
    data: MatchKeysAndValues<Document> = {}
  ): Promise<boolean> {
    const result = await this.instance.updateOne(
      filter,
      { $set: data },
      {
        upsert: true,
      }
    );
    return (
      result.acknowledged &&
      (result.modifiedCount === 1 || result.upsertedCount === 1)
    );
  }

  /**
   * 添加一条数据
   * @param {*} data
   * @returns 成功则返回上次添加的_id
   */
  async add(data: Document): Promise<boolean> {
    const result = await this.instance.insertOne(data);
    if (result.acknowledged) {
      this.lastInsertedId = result.insertedId;
      return true;
    }
    return false;
  }

  /**
   * 添加多条数据
   * @param {*} data
   * @returns 成功则返回上次添加的_id列表
   */
  async adds(data: Document[]): Promise<boolean> {
    if (!Array.isArray(data)) {
      data = [data];
    }
    const result = await this.instance.insertMany(data);
    if (result.acknowledged && result.insertedCount > 0) {
      this.lastInsertedIds = result.insertedIds;
      return true;
    }
    return false;
  }

  /**
   * 查找多条记录
   * @param {*} filter
   * @param {*} option
   * @returns
   */
  async find(
    filter: Filter<Document> = {},
    option: FindOptions<Document> = {}
  ) {
    const cursor = await this.instance.find(filter, option);
    return cursor.toArray();
  }

  /**
   * 查找一条记录
   * @param {*} filter
   * @param {*} option
   */
  async get(filter: Filter<Document> = {}, sort: Sort = {}) {
    return await this.instance.findOne(filter, { sort });
  }

  /**
   * 查找多条记录
   * @param filter
   * @param sort
   * @param offset
   * @param limit
   * @returns
   */
  async gets(
    filter: Filter<Document> = {},
    sort: Sort = {},
    offset: number = 0,
    limit: number = 0
  ) {
    const option: FindOptions<Document> = {
      sort,
      skip: offset,
    };
    if (limit > 0) {
      option.limit = limit;
    }
    const cursor = await this.instance.find(filter, option);
    return cursor.toArray();
  }
}
