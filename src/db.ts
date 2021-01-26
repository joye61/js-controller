import mongoose from "mongoose";
import { runWithDebugCheck } from "./utils";
import chalk from "chalk";

export interface MongodbConnectOption {
  // Host Name
  host?: string;
  // Port number
  port?: string | number;
  // The default database to connect to
  database?: string;
  // username
  user?: string;
  // password
  password?: string;
  // 是Whether to turn on debugging
  debug?: boolean;
}

/**
 * ref: https://docs.mongodb.com/manual/reference/connection-string/
 * Create a uri to connect to mongodb based on the connection parameters
 * @param option MongodbOption
 */
export function createConnectionURI(option?: MongodbConnectOption): string {
  let config: MongodbConnectOption = {
    host: "127.0.0.1",
    port: 27017,
    debug: false,
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
 * Connecting to a mongodb database
 * @param option Connection parameters
 * @param debug Whether to turn on debugging
 */
export async function connectMongodb(
  option?: MongodbConnectOption
): Promise<void> {
  // Determine if mongoose debugging is enabled based on conditions
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

  // Verify that the database connection is working
  await new Promise((resolve, reject) => {
    const db = mongoose.connection;
    db.on("error", () => {
      db.close();
      reject(`An error occurred while connecting to the database via '${uri}'`);
    });
    db.once("open", resolve);
  });

  runWithDebugCheck(() => {
    // Print the successful database connection message
    console.log(`Connected to mongodb database -> ` + chalk.blue(uri));
  });
}

/**
 * Disconnecting the mongodb database
 */
export async function disconnectMongodb() {
  await mongoose.connection.close();
}

/**
 * Create a mongoose model
 * @param name
 * @param definition
 * @param option
 */
export function createMongooseModel(
  name: string,
  definition: mongoose.SchemaDefinition,
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

  return { schema, model };
}
