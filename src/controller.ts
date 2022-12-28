import type { Context } from 'koa';
import type { HookReturnValue } from './types';

export class Controller {
  protected constructor(protected context: Context) {}

  /**
   * 输出JSON
   * @param data
   * @param code
   * @param message
   */
  protected json(data: any = null, code = 0, message = '成功') {
    this.context.status = 200;
    this.context.type = 'application/json';
    this.context.body = JSON.stringify({
      data,
      code,
      message,
    });
  }

  /**
   * 获取get请求参数
   * @param name
   * @param value
   * @returns
   */
  protected get(name: string, value?: string): any {
    return <string | undefined>this.context.query[name] ?? value;
  }

  /**
   * 获取POST请求参数
   * @param name
   * @param value
   * @returns
   */
  protected post(name: string, value?: any): any {
    return this.context.request.body[name] ?? value;
  }

  /**
   * 获取GET或者POST请求参数
   * @param name
   * @param value
   * @returns
   */
  protected param(name: string, value?: any): any {
    let result = this.get(name, value);
    if (result) return result;
    result = this.post(name, value);
    return result ?? value;
  }

  /**
   * 获取当前请求方法
   * @returns
   */
  protected method(): string {
    return this.context.method.toUpperCase();
  }

  /**
   * 强制POST请求
   * @returns
   */
  protected forcePost(): HookReturnValue {
    if (this.context.method !== 'POST') {
      this.context.status = 404;
      return 'abort';
    }
    return 'continue';
  }
}
