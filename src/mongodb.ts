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

export interface MongoDBConfig {
  // 一个自定义的名字，代表当前的连接实例
  name: string;
  // 连接用户名
  username?: string;
  // 连接密码
  password?: string;
  // 主机
  host: string;
  // 端口号
  port?: string | number;
}

export class MongoDB {
  private static dbs: Record<string, MongoDB> = {};
  private constructor(public client: MongoClient) {}

  /**
   * 创建mongodb实例
   * @param config
   * @returns
   */
  public static async create(config: MongoDBConfig): Promise<MongoDB> {
    if (!config.name) {
      throw new Error('Connection name must be specified');
    }
    let db = MongoDB.dbs[config.name];
    if (db instanceof MongoDB) {
      return db;
    }

    // 创建新的连接
    // 拼接数据库链接URI
    let uri = `mongodb://`;
    if (config.username && config.password) {
      uri += `${config.username}:${config.password}@`;
    }
    if (!config.host) {
      config.host = '127.0.0.1';
    }
    if (!config.port) {
      config.port = 27017;
    }
    uri += `${config.host}:${config.port}`;

    // 创建连接
    db = new MongoDB(
      new MongoClient(uri, {
        keepAlive: true,
        noDelay: true,
      })
    );

    // 一旦服务器链接关闭，清理当前客户端缓存
    db.client.once('serverClosed', () => {
      delete MongoDB.dbs[config.name];
    });

    // 连接客户端，出错直接抛出异常
    await db.client.connect();
    MongoDB.dbs[config.name] = db;

    return db;
  }

  /**
   * 获取Db实例
   * @param name
   * @returns
   */
  public db(name: string): Mdb {
    return new Mdb(this.client.db(name));
  }

  /**
   * 转换为对象id
   * @param id
   * @returns
   */
  public static toObjectId(id: string | ObjectId) {
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
  public static toStringId(id: string | ObjectId) {
    if (id instanceof ObjectId) {
      return id.toHexString();
    }
    return id;
  }
}

/**
 * 数据库实例
 */
export class Mdb {
  public constructor(public db: Db) {}
  public col(name: string) {
    return new MCol(this.db.collection(name));
  }
}

/**
 * 集合实例
 */
export class MCol {
  constructor(public col: Collection) {}

  /**
   * 删除多条数据
   * @param {*} filter
   */
  public async remove(filter: Filter<Document>) {
    const result = await this.col.deleteMany(filter);
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
  public async upsert(
    filter: Filter<Document>,
    data: MatchKeysAndValues<Document>
  ) {
    const result = await this.col.updateOne(
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
   * 更新多条记录
   * @param {*} filter
   * @param {*} data
   */
  public async update(
    filter: Filter<Document>,
    data: MatchKeysAndValues<Document>
  ) {
    const result = await this.col.updateMany(filter, { $set: data });
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
  public async add(data: Document) {
    const result = await this.col.insertOne(data);
    if (result.acknowledged) {
      return result.insertedId;
    }
  }

  /**
   * 添加多条数据
   * @param {*} data
   * @returns 成功则返回上次添加的_id列表
   */
  public async adds(
    data: (Document & {
      _id?: ObjectId | undefined;
    })[]
  ) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    const result = await this.col.insertMany(data);
    if (result.acknowledged && result.insertedCount > 0) {
      return result.insertedIds;
    }
  }

  /**
   * 查找一条记录
   * @param {*} filter
   * @param {*} option
   */
  public async get(filter: Filter<Document>, option: FindOptions<Document>) {
    return this.col.findOne(filter, option);
  }

  /**
   * 查找多条记录
   * @param {*} filter
   * @param {*} option
   * @returns
   */
  public async gets(filter: Filter<Document>, option: FindOptions<Document>) {
    const cursor = await this.col.find(filter, option);
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
  public async count(filter: Filter<Document>, option: FindOptions<Document>) {
    return await this.col.countDocuments(filter, option);
  }
}
