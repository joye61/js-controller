import { Context } from "koa";

export interface JSONMessageObject<T = null> {
  data?: T;
  code?: number;
  message?: string;
}

/**
 * 创建标准消息格式对象
 * @param data
 * @param code
 * @param message
 */
export function sendHttpResponse<T>(
  ctx: Context,
  message?: JSONMessageObject<T>
) {
  // 默认消息
  const defaultMessage: JSONMessageObject = {
    data: null,
    code: 0,
    message: "success",
  };
  // 设置HTTP响应
  ctx.status = 200;
  ctx.type = "application/json; charset=UTF-8";
  ctx.body = JSON.stringify({ ...defaultMessage, ...message });
}
