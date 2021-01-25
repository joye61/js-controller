import Koa from "koa";
import { getConfig } from "./config";
import path from "path";

// 各种路由错误信息
export enum RouteError {
  InterfacePathIllegal = "Interface path is not legal",
  ControllerFileNotExist = "Controller file does not exist",
  ControllerNotExist = "Controller does not exist",
  ActionNotExist = "Action does not exist",
  ActionReserved = "Action name is reserved name",
  ServerHasNoOutput = "The server does not have any output",
}

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
    throw new Error(RouteError.InterfacePathIllegal);
  }

  // 获取存放控制器文件的根目录
  const rootDir = getConfig("controllerRootDir")!;
  const actionName = segments.pop()!;
  const controllerFile = path.resolve(
    rootDir,
    `./${segments.join(path.sep)}.js`
  );

  // 加载控制器类
  let controllerClass = null;
  try {
    controllerClass = (await import(controllerFile)).default;
  } catch (error) {
    throw new Error(RouteError.ControllerFileNotExist);
  }

  // 验证控制器存在与否
  if (typeof controllerClass !== "function") {
    throw new Error(RouteError.ControllerNotExist);
  }

  // 创建控制器实例
  const controller = new controllerClass(ctx);

  // 判断动作是否存在
  if (typeof controller[actionName] !== "function") {
    throw new Error(RouteError.ActionNotExist);
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

  // 如果服务器没有任何响应，提示错误
  if (!ctx.body) {
    throw new Error(RouteError.ServerHasNoOutput);
  }
}
