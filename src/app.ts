import Koa from "koa";
import KoaBody from "koa-body";
import { getConfig, loadConfig } from "./config";
import { connectMongodb } from "./db";
import { route } from "./router";
import { sendHttpResponse } from "./utils";

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

  // 发送响应
  const sendErrorResponse = (ctx: Koa.Context, error: Error) => {
    if (getConfig("printError")) {
      console.error(error);
    }
    sendHttpResponse(ctx, { code: 500, message: "System Exception" });
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
    await route(ctx);
  });

  // 启动监听
  koa.listen(getConfig("httpPort"), getConfig("httpHost"));
}
