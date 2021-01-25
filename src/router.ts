import Koa from "koa";
import { getConfig } from "./config";
import path from "path";
import fs from "fs";
import { sendHttpResponse } from "./utils";
import { sprintf } from "sprintf-js";

// 各种路由错误信息
export enum RouteError {
  InterfacePathIllegal = "Path '%s' must contain controller and action",
  ControllerFileNotExist = "Controller file '%s' does not exist",
  ControllerNotExist = "The file '%s' does not exist for the default exported controller",
  ActionNotExist = "Action '%s' does not exist",
  ServerHasNoOutput = "The server does not have any output",
}

/**
 * 所有的路由错误都当做404错误
 * @param ctx
 * @param message
 */
function responseRouterError(ctx: Koa.Context, message: string) {
  if (getConfig("printError")) {
    console.error(message);
  }
  sendHttpResponse(ctx, { code: 404, message: "404 Not Found" });
}

// 控制器和动作大小写无关缓存
interface CaseInsensitiveNameMap {
  [key: string]: Map<string, string>;
}

// 键为控制器所在目录，值为控制器文件名大小写映射
const controllerNameMap: CaseInsensitiveNameMap = {};
// 键为控制器文件，值为控制器所有动作大小写映射
const actionNameMap: CaseInsensitiveNameMap = {};

/**
 * 路由功能
 * @param ctx
 */
export async function route(ctx: Koa.Context) {
  // 获取路由路径
  const routePath = ctx.path.replace(/^\/*|\/*$/g, "");
  const segments = routePath.split("/");
  // 强制要求段数至少为controller/action两段，少于两段则认为不合法
  if (segments.length < 2) {
    return responseRouterError(
      ctx,
      sprintf(RouteError.InterfacePathIllegal, ctx.path)
    );
  }

  // 获取存放控制器文件的根目录
  const rootDir = getConfig("controllerRootDir")!;
  let actionName: string | undefined = segments.pop()!;
  let controllerName: string | undefined = segments.pop()!;

  // 获取当前控制器目录
  const controllerDir = path.resolve(rootDir, segments.join(path.sep));
  if (!controllerNameMap[controllerDir]) {
    controllerNameMap[controllerDir] = new Map<string, string>();
    const fileList = fs.readdirSync(controllerDir);
    for (let file of fileList) {
      controllerNameMap[controllerDir].set(file.toLowerCase(), file);
    }
  }

  // 获取控制器文件
  const controllerFile = path.resolve(
    rootDir,
    `./${controllerNameMap[controllerDir].get(
      controllerName.toLowerCase() + ".js"
    )}`
  );

  // 如果控制器文件不存在
  if (!fs.existsSync(controllerFile)) {
    return responseRouterError(
      ctx,
      sprintf(RouteError.ControllerFileNotExist, controllerFile)
    );
  }

  // 加载控制器类
  let controllerClass = (await import(controllerFile)).default;

  // 验证控制器存在与否
  if (typeof controllerClass !== "function") {
    return responseRouterError(
      ctx,
      sprintf(RouteError.ControllerNotExist, controllerFile)
    );
  }

  // 创建控制器实例
  const controller = new controllerClass(ctx);

  // 如果大小写映射不存在，则先将映射存储
  if (!actionNameMap[controllerFile]) {
    actionNameMap[controllerFile] = new Map<string, string>();
    const propertyNames = [
      ...Object.getOwnPropertyNames(controller),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(controller)),
    ];
    for (let key of propertyNames) {
      if (key === "constructor") {
        continue;
      }
      if (typeof controller[key] === "function") {
        actionNameMap[controllerFile].set(key.toLowerCase(), key);
      }
    }
  }

  // 获取真实动作名
  actionName = actionNameMap[controllerFile].get(actionName.toLowerCase());

  // 判断动作是否存在
  if (!actionName) {
    return responseRouterError(
      ctx,
      sprintf(RouteError.ActionNotExist, actionName)
    );
  }

  // 是否有前置动作钩子
  const onBeforeActionHook: string = getConfig("onBeforeActionHook")!;
  if (typeof controller[onBeforeActionHook] === "function") {
    const beforeHookResult = await controller[onBeforeActionHook]();
    // 当前置钩子返回prevent关键字的时候，阻止继续执行
    if (beforeHookResult === "prevent") {
      return;
    }
  }

  // 调用动作
  await controller[actionName]();

  // 后置钩子
  const onAfterActionHook: string = getConfig("onAfterActionHook")!;
  if (typeof controller[onAfterActionHook] === "function") {
    await controller[onAfterActionHook]();
  }

  // 如果服务器没有任何响应，输入默认响应
  if (!ctx.body) {
    sendHttpResponse(ctx, { message: RouteError.ServerHasNoOutput });
  }
}
