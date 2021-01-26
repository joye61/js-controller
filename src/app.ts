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
 * 启动并运行App
 * @param config
 */
export async function runApp(configRootDir?: string) {
  // 初始化配置信息，只执行一次
  await loadConfig(configRootDir);

  // 如果存在mongodb连接信息，则尝试连接数据库
  const mongodbUriInfo = getConfig("mongodbConnectOption");
  if (mongodbUriInfo) {
    await connectMongodb(mongodbUriInfo);
  }

  // 创建Koa实例
  const koa = new Koa();
  koa.proxy = true;

  /**
   * 发送错误响应
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

  // 监听系统错误
  koa.on("error", (error, ctx) => {
    sendErrorResponse(ctx, error);
  });

  // 解析POST请求
  const postBodyLimit = getConfig("postBodyLimit");
  koa.use(
    KoaBody({
      jsonLimit: postBodyLimit,
      formLimit: postBodyLimit,
      textLimit: postBodyLimit,
      // 开启文件上传解析
      multipart: true,
    })
  );

  // 处理请求
  koa.use(async (ctx) => {
    // debug模式输出http request相关信息
    runWithDebugCheck(() => {
      const method = ctx.method.toUpperCase();
      console.log(ctx.href, chalk.cyan(method));
      console.log("Headers", ctx.headers);
      if (method === "POST") {
        console.log("Body", ctx.request.body);
      }
    });
    // 路由请求
    await route(ctx);
  });

  // 启动监听
  const port = getConfig<number | number>("httpPort");
  const host = getConfig<string>("httpHost");
  runWithDebugCheck(() => {
    console.log(`Start Http Service -> ` + chalk.blue(`${host}:${port}`));
  });

  koa.listen(port, host);
}
