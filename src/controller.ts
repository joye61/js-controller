import Koa from "koa";
import { sendHttpResponse } from "./utils";

export class Controller {
  // GET request parameters
  protected paramsGet: any;
  // POST request parameters
  protected paramsPost: any;
  // Parameters for GET and POST merging
  protected params: any;

  constructor(protected ctx: Koa.Context) {
    this.ctx = ctx;

    this.paramsGet = this.ctx.query;
    this.paramsPost = this.ctx.request.body;
    this.params = { ...this.paramsGet, ...this.paramsPost };
  }

  /**
   * Get parameters, including GET and POST requests
   * @param {*} name
   */
  getParam(name: string) {
    if (!name || typeof name !== "string") return;
    return this.params[name];
  }

  /**
   * Get GET request parameters
   * @param {*} name
   */
  getGetParam(name: string) {
    if (!name || typeof name !== "string") return;
    return this.paramsGet[name];
  }

  /**
   * Get POST request parameters
   * @param {*} name
   */
  getPostParam(name: string) {
    if (!name || typeof name !== "string") return;
    return this.paramsGet[name];
  }

  /**
   * JSON output
   * @param {*} data
   * @param {*} code
   * @param {*} message
   */
  json(data = null, code = 0, message = "success") {
    sendHttpResponse(this.ctx, { data, code, message });
  }
}
