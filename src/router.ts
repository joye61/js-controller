import Koa from "koa";
import { getConfig } from "./config";
import path from "path";
import fs from "fs";
import {
  JSONMessageObject,
  runWithDebugCheck,
  sendHttpResponse,
} from "./utils";
import { sprintf } from "sprintf-js";
import chalk from "chalk";

// Various routing error messages
export const RouteError = {
  InterfacePathIllegal: `Path %s must contain controller and action information`,
  ControllerFileNotExist: `Controller file %s does not exist`,
  ControllerNotExist: `The file %s does not exist for the default exported controller`,
  ActionNotExist: `Action %s does not exist`,
  ServerHasNoOutput: "No response content from the server",
};

/**
 * All routing errors are treated as 404 errors
 * @param ctx
 * @param message
 */
function sendErrorResponse(ctx: Koa.Context, message: string) {
  const result: JSONMessageObject<string> = {
    code: 404,
    message: "404 Not Found",
  };
  runWithDebugCheck(() => {
    console.error("Error:", chalk.red(message));
    result.data = message;
  });

  sendHttpResponse(ctx, result);
}

// Controller and action case-independent caching
interface CaseInsensitiveNameMap {
  [key: string]: Map<string, string>;
}

// The key is the directory where the controller is located, 
// and the value is the case mapping of the controller file name
const controllerNameMap: CaseInsensitiveNameMap = {};
// The key is the controller file and the value 
// is the case mapping of all controller actions
const actionNameMap: CaseInsensitiveNameMap = {};

/**
 * Routing Function
 * @param ctx
 */
export async function route(ctx: Koa.Context) {
  // Get routing path
  const routePath = ctx.path.replace(/^\/*|\/*$/g, "");
  const segments = routePath.split("/");
  // Mandatory paragraph number of at least two paragraphs for controller/action, 
  // less than two paragraphs is not considered legal
  if (segments.length < 2) {
    return sendErrorResponse(
      ctx,
      sprintf(RouteError.InterfacePathIllegal, ctx.path)
    );
  }

  // Get the root directory where the controller files are stored
  const rootDir = getConfig("controllerRootDir")!;
  let actionName: string | undefined = segments.pop()!;
  let controllerName: string | undefined = segments.pop()!;

  // Get the current controller directory
  const controllerDir = path.resolve(rootDir, segments.join(path.sep));
  if (!controllerNameMap[controllerDir]) {
    controllerNameMap[controllerDir] = new Map<string, string>();
    const fileList = fs.readdirSync(controllerDir);
    for (let file of fileList) {
      controllerNameMap[controllerDir].set(file.toLowerCase(), file);
    }
  }

  // Get the controller file
  const controllerFile = path.resolve(
    rootDir,
    `./${controllerNameMap[controllerDir].get(
      controllerName.toLowerCase() + ".js"
    )}`
  );

  // If the controller file does not exist
  if (!fs.existsSync(controllerFile)) {
    return sendErrorResponse(
      ctx,
      sprintf(RouteError.ControllerFileNotExist, controllerFile)
    );
  }

  // If the controller file does not exist
  let controllerClass = (await import(controllerFile)).default;

  // Verify the presence or absence of the controller
  if (typeof controllerClass !== "function") {
    return sendErrorResponse(
      ctx,
      sprintf(RouteError.ControllerNotExist, controllerFile)
    );
  }

  // Creating a controller instance
  const controller = new controllerClass(ctx);

  // If the case mapping does not exist, the mapping is stored first
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

  // Get real action name
  const rawActionName = actionName;
  actionName = actionNameMap[controllerFile].get(actionName.toLowerCase());

  // Determine if the action exists
  if (!actionName) {
    return sendErrorResponse(
      ctx,
      sprintf(RouteError.ActionNotExist, rawActionName)
    );
  }

  // Whether there are pre-action hooks
  const onBeforeActionHook: string = getConfig("onBeforeActionHook")!;
  if (typeof controller[onBeforeActionHook] === "function") {
    const beforeHookResult = await controller[onBeforeActionHook]();
    // Prevent execution from continuing when 
    // the former hook returns the prevent keyword
    if (beforeHookResult === "prevent") {
      return;
    }
  }

  // Calling the action
  await controller[actionName]();

  // Post-hooks
  const onAfterActionHook: string = getConfig("onAfterActionHook")!;
  if (typeof controller[onAfterActionHook] === "function") {
    await controller[onAfterActionHook]();
  }

  // If there is no response from the server, enter the default response
  if (!ctx.body) {
    sendHttpResponse(ctx, { message: RouteError.ServerHasNoOutput });
  }
}
