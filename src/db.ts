import mongoose from "mongoose";

export interface MongodbConnectOption {
  // 主机名
  host?: string;
  // 端口号
  port?: string | number;
  // 默认连接的数据库
  database?: string;
  // 用户名
  user?: string;
  // 密码
  password?: string;
  // 是否开启调试
  debug?: boolean;
}

/**
 * ref: https://docs.mongodb.com/manual/reference/connection-string/
 * 根据连接参数创建连接mongodb的uri
 * @param option MongodbOption
 */
export function createConnectionURI(option?: MongodbConnectOption): string {
  let config: MongodbConnectOption = {
    host: "127.0.0.1",
    port: 27017,
  };
  if (typeof option === "object") {
    config = { ...config, ...option };
  }

  let uri = "mongodb://";
  if (config.user) {
    uri += `${config.user}:${config.password ?? ""}@`;
  }

  uri += `${config.host}:${config.port}`;
  if (config.database) {
    uri += `/${config.database}`;
  }
  return uri;
}

/**
 * 连接mongodb数据库
 * @param option 连接参数
 * @param debug 是否开启调试
 */
export async function connectMongodb(option?: MongodbConnectOption) {
  // 根据条件判断是否开发环境开启mongoose调试
  if (!!option?.debug) {
    mongoose.set("debug", true);
  }
  const uri = createConnectionURI(option);

  mongoose.connect(uri, {
    useNewUrlParser: true,
    keepAlive: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  // 确认数据库连接正常
  return new Promise((resolve, reject) => {
    const db = mongoose.connection;
    db.on("error", () => {
      db.close();
      reject(`Mongodb connection with '${uri}' triggered an error`);
    });
    db.once("open", resolve);
  });
}

/**
 * 断开mongodb数据库的连接
 */
export async function disconnectMongodb() {
  await mongoose.connection.close();
}

/**
 * 创建一个mongoose模型
 * @param name
 * @param definition
 * @param option
 */
export async function createMongooseModel<T>(
  name: string,
  definition: mongoose.SchemaDefinition<T>,
  option?: mongoose.SchemaOptions
) {
  let schemaOption: mongoose.SchemaOptions = {
    timestamps: true,
  };
  if (typeof option === "object") {
    schemaOption = { ...schemaOption, ...option };
  }
  const schema = new mongoose.Schema(definition, schemaOption);
  const model = mongoose.model(name, schema, name);
  return model;
}
