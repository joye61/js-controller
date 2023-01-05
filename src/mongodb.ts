import {
  Collection,
  Db,
  Document,
  Filter,
  FindOptions,
  MatchKeysAndValues,
  MongoClient,
  ObjectId,
} from 'mongodb';

export interface MdbConfig {
  name: string;
  user?: string;
  password?: string;
  hosts: Array<{
    host: string;
    port?: string;
  }>;
}

/**
 * 步骤：
 * 1、先调用connect创建客户端连接缓存
 * 2、调用getClient，getDatabse，getCollection获取需要操作的对象
 */
export class MClient {
  static clients: Record<string, MongoClient> = {};

  /**
   * 根据名字获取连接实例
   * @param name
   * @returns
   */
  static getClient(clientName: string): MongoClient {
    const client = MClient.clients[clientName];
    if (!client) {
      throw new Error(`Database connection [${clientName}] does not exist`);
    }
    return client;
  }

  /**
   * 获取数据库
   * @param dbName
   * @param clientName
   * @returns
   */
  static getDatabse(dbName: string, clientName: string): Db {
    let client = MClient.getClient(clientName);
    return client.db(dbName);
  }

  /**
   * 获取集合
   * @param colName
   * @param dbName
   * @param clientName
   * @returns
   */
  static getCollection(
    colName: string,
    dbName: string,
    clientName: string
  ): Collection {
    const db = MClient.getDatabse(dbName, clientName);
    return db.collection(colName);
  }

  /**
   * 初始化连接数据库，可以连接多个
   * @param option
   */
  static async connect(option: MdbConfig | MdbConfig[]) {
    if (!Array.isArray(option)) {
      option = [option];
    }
    for (let config of option) {
      // 如果连接存在，不重复连接
      if (MClient.clients[config.name]) {
        continue;
      }

      // 拼接数据库链接URI
      let uri = `mongodb://`;
      if (config.user && config.password) {
        uri += `${config.user}:${config.password}@`;
      }
      const pairs: string[] = [];
      config.hosts.forEach((item) => {
        pairs.push(`${item.host}:${item.port}`);
      });
      uri += `${pairs.join(',')}`;

      // 创建连接
      const client = new MongoClient(uri, {
        keepAlive: true,
        noDelay: true,
      });

      // 一旦服务器链接关闭，清理当前客户端缓存
      client.once('serverClosed', () => {
        delete MClient.clients[config.name];
      });

      // 连接客户端，出错直接抛出异常
      await client.connect();
      MClient.clients[config.name] = client;
    }
  }
}

/**
 * 快速创建collection操作实例
 * @param col 集合名
 * @param db 表名
 * @param client 连接名
 * @returns MCol
 */
export function col(col: string, db: string, client: string) {
  const instance = MClient.getCollection(col, db, client);
  return new MCol(instance);
}

export class MCol {
  constructor(public instance: Collection) {}

  /**
   * 转换为对象id
   * @param id
   * @returns
   */
  static toObjectId(id: string | ObjectId) {
    if (id instanceof ObjectId) {
      return id;
    }
    return new ObjectId(id);
  }

  /**
   * 转换为字符串id
   * @param id
   * @returns
   */
  static toStringId(id: string | ObjectId) {
    if (id instanceof ObjectId) {
      return id.toHexString();
    }
    return id;
  }

  /**
   * 删除一条数据
   * @param {*} filter
   */
  async remove(filter: Filter<Document>) {
    const result = await this.instance.deleteOne(filter);
    if (result.acknowledged && result.deletedCount === 1) {
      return true;
    }
    return false;
  }

  /**
   * 删除多条数据
   * @param {*} filter
   */
  async removes(filter: Filter<Document>) {
    const result = await this.instance.deleteMany(filter);
    if (result.acknowledged) {
      return true;
    }
    return false;
  }

  /**
   * 更新一条数据，如果不存在就插入
   * @param {*} data
   * @param {*} filter
   */
  async upsert(filter: Filter<Document>, data: MatchKeysAndValues<Document>) {
    const result = await this.instance.updateOne(
      filter,
      { $set: data },
      {
        upsert: true,
      }
    );
    if (
      result.acknowledged &&
      (result.modifiedCount === 1 || result.upsertedCount === 1)
    ) {
      return true;
    }
    return false;
  }

  /**
   * 更新一条记录
   * @param {*} filter
   * @param {*} data
   */
  async update(filter: Filter<Document>, data: MatchKeysAndValues<Document>) {
    const result = await this.instance.updateOne(filter, {
      $set: data,
    });
    if (result.acknowledged && result.modifiedCount === 1) {
      return true;
    }
    return false;
  }

  /**
   * 更新多条记录
   * @param {*} filter
   * @param {*} data
   */
  async updates(filter: Filter<Document>, data: MatchKeysAndValues<Document>) {
    const result = await this.instance.updateMany(filter, { $set: data });
    if (result.acknowledged && result.modifiedCount > 0) {
      return true;
    }
    return false;
  }

  /**
   * 添加一条数据
   * @param {*} data
   * @returns 成功则返回上次添加的_id
   */
  async add(data: Document) {
    const result = await this.instance.insertOne(data);
    if (result.acknowledged) {
      return result.insertedId;
    }
  }

  /**
   * 添加多条数据
   * @param {*} data
   * @returns 成功则返回上次添加的_id列表
   */
  async adds(
    data: (Document & {
      _id?: ObjectId | undefined;
    })[]
  ) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    const result = await this.instance.insertMany(data);
    if (result.acknowledged && result.insertedCount > 0) {
      return result.insertedIds;
    }
  }

  /**
   * 查找一条记录
   * @param {*} filter
   * @param {*} option
   */
  async get(filter: Filter<Document>, option: FindOptions<Document>) {
    return this.instance.findOne(filter, option);
  }

  /**
   * 查找多条记录
   * @param {*} filter
   * @param {*} option
   * @returns
   */
  async gets(filter: Filter<Document>, option: FindOptions<Document>) {
    const cursor = await this.instance.find(filter, option);
    const hasNext = await cursor.hasNext();
    const output: Document[] = [];
    if (!hasNext) {
      return output;
    }
    cursor.forEach((item) => {
      output.push(item);
    });
    return output;
  }

  /**
   * 获取记录的总条数
   * @param {*} filter
   * @param {*} option
   * @returns
   */
  async count(filter: Filter<Document>, option: FindOptions<Document>) {
    return await this.instance.countDocuments(filter, option);
  }
}
