import mongoose from "mongoose";
import { getEnvironment } from "./env";

export interface MongodbConnectOption {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

/**
 * ref: https://docs.mongodb.com/manual/reference/connection-string/
 * 根据连接参数创建连接mongodb的uri
 * @param option MongodbOption
 */
export function createConnectionURI(
  option: Partial<MongodbConnectOption>
): string {
  let uri = "mongodb://";
  if (option.user) {
    uri += `${option.user}:${option.password ?? ""}@`;
  }

  if (!option.host) {
    throw new Error(`The host must be specified`);
  }
  uri += option.host;
  if (option.port) {
    uri += `:${option.port}`;
  }
  if (option.database) {
    uri += `/${option.database}`;
  }
  return uri;
}

/**
 * 连接mongodb数据库
 * @param option
 */
export async function connectMongodb(option: Partial<MongodbConnectOption>) {
  // 开发环境开启mongoose调试
  if (getEnvironment() === "development") {
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
