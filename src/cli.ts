import { getConfig, loadConfig } from "./config";
import { connectMongodb, disconnectMongodb } from "./db";
import yargs from "yargs/yargs";
import chalk from "chalk";

/**
 * cli environment execution script logic
 * @param configRootDir Configuring the root directory
 * @param fn Script logic functions
 */
export async function runWithinCli(
  fn?: () => Promise<void>,
  configRootDir?: string
): Promise<void> {
  // Try to assign values to environment variables
  const args: any = yargs(process.argv).argv;
  if (!process.env.NODE_ENV && typeof args.env === "string") {
    process.env.NODE_ENV = args.env;
  }

  if (!process.env.NODE_ENV) {
    throw new Error(
      `The environment variable ${chalk.red(
        "process.env.NODE_ENV"
      )} must be set`
    );
  }

  // Load configuration, initialize and execute once
  await loadConfig(configRootDir);

  // If mongodb connection information exists, try to connect to the database
  const mongodbUriInfo = getConfig("mongodbConnectOption");
  if (mongodbUriInfo) {
    await connectMongodb(mongodbUriInfo);
  }

  // Execute script logic
  await fn?.();

  // Close the connection
  if (mongodbUriInfo) {
    await disconnectMongodb();
  }

  // Close process
  process.exit();
}
