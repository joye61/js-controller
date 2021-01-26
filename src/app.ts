import Koa from "koa";
import KoaBody from "koa-body";
import { getConfig, loadConfig } from "./config";
import { connectMongodb } from "./db";
import { route } from "./router";
import {
  JSONMessageObject,
  runWithDebugCheck,
  sendHttpResponse,
} from "./utils";
import chalk from "chalk";

/**
 * Start and run the App
 * @param config
 */
export async function runApp(configRootDir?: string) {
  // Initialize the configuration information and execute it only once
  await loadConfig(configRootDir);

  // If mongodb connection information exists, try to connect to the database
  const mongodbUriInfo = getConfig("mongodbConnectOption");
  if (mongodbUriInfo) {
    await connectMongodb(mongodbUriInfo);
  }

  // Creating Koa Instances
  const koa = new Koa();
  koa.proxy = true;

  /**
   * Sending an error response
   * @param ctx
   * @param error
   */
  const sendErrorResponse = (ctx: Koa.Context, error: Error) => {
    const result: JSONMessageObject<string> = {
      code: 500,
      message: "Internal server error",
    };

    runWithDebugCheck(() => {
      console.error(error);
      result.data = error.message;
    });

    sendHttpResponse(ctx, result);
  };

  // Listening for system errors
  koa.on("error", (error, ctx) => {
    sendErrorResponse(ctx, error);
  });

  // Parsing POST requests
  const postBodyLimit = getConfig("postBodyLimit");
  koa.use(
    KoaBody({
      jsonLimit: postBodyLimit,
      formLimit: postBodyLimit,
      textLimit: postBodyLimit,
      // Enabling file upload parsing
      multipart: true,
    })
  );

  // Processing Requests
  koa.use(async (ctx) => {
    // debug mode output http request related information
    runWithDebugCheck(() => {
      const method = ctx.method.toUpperCase();
      console.log(ctx.href, chalk.cyan(method));
      console.log("Headers", ctx.headers);
      if (method === "POST") {
        console.log("Body", ctx.request.body);
      }
    });
    // Routing requests
    await route(ctx);
  });

  // Start Service Listening
  const port = getConfig<number | number>("httpPort");
  const host = getConfig<string>("httpHost");
  runWithDebugCheck(() => {
    console.log(`Start Http Service -> ` + chalk.blue(`${host}:${port}`));
  });

  koa.listen(port, host);
}
