import Koa from "koa";
import { sendHttpResponse } from "./utils";

class Base {
  // GET请求参数
  protected paramsGet: any;
  // POST请求参数
  protected paramsPost: any;
  // GET和POST合并的参数
  protected params: any;

  constructor(protected ctx: Koa.Context) {
    this.ctx = ctx;

    this.paramsGet = this.ctx.query;
    this.paramsPost = this.ctx.request.body;
    this.params = { ...this.paramsGet, ...this.paramsPost };
  }

  /**
   * 获取参数，包含GET和POST请求
   * @param {*} name
   */
  getParam(name: string) {
    if (!name || typeof name !== "string") return;
    return this.params[name];
  }

  /**
   * 获取GET请求参数
   * @param {*} name
   */
  getGetParam(name: string) {
    if (!name || typeof name !== "string") return;
    return this.paramsGet[name];
  }

  /**
   * 获取POST请求参数
   * @param {*} name
   */
  getPostParam(name: string) {
    if (!name || typeof name !== "string") return;
    return this.paramsGet[name];
  }

  /**
   * JSON输出
   * @param {*} data
   * @param {*} code
   * @param {*} message
   */
  json(data = null, code = 0, message = "success") {
    sendHttpResponse(this.ctx, { data, code, message });
  }
}

module.exports = { Base };
