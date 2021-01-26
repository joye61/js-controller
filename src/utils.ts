import { Context } from "koa";
import { getConfig } from "./config";

export interface JSONMessageObject<T = null> {
  data?: T;
  code?: number;
  message?: string;
}

/**
 * Creating standard message format objects
 * @param data
 * @param code
 * @param message
 */
export function sendHttpResponse<T>(
  ctx: Context,
  message?: JSONMessageObject<T>
) {
  // Default Message Format
  const defaultMessage: JSONMessageObject = {
    data: null,
    code: 0,
    message: "success",
  };
  // Setting up the HTTP response
  ctx.status = 200;
  ctx.type = "application/json; charset=UTF-8";
  ctx.body = JSON.stringify({ ...defaultMessage, ...message });
}

/**
 * Execute function logic when debug mode is on
 * @param fn 
 */
export function runWithDebugCheck(fn?: () => void) {
  if (!!getConfig("debug")) {
    fn?.();
  }
}
