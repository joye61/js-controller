import koaBody from 'koa-body';
import Server, { type Context } from 'koa';
import readdirp, { ReaddirpOptions } from 'readdirp';
import path from 'path';
import fs from 'fs';
import { AppConfig, AppConfigData } from './config';
import { log } from './utils';

export interface RouterData {
  class: new (c: Context) => any;
  actionName: string;
}

export interface CachedRouter {
  [path: string]: RouterData;
}

export class App {
  // APP对象是全局单例，保持只有一个
  private static instance?: App = undefined;

  // 配置对象
  private config: AppConfigData;

  private constructor() {
    this.config = AppConfig.getInstance().data;
  }

  /**
   * 获取APP实例对象
   * @returns
   */
  public static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  // 缓存路由逻辑
  private cachedRouter: CachedRouter = {};

  /**
   * 检测所有的路由逻辑
   */
  private async detectAllRouter() {
    let scanDir = path.normalize(this.config.controllerRoot);
    if (!fs.existsSync(scanDir)) {
      throw new Error('Controller root directory does not exist');
    }

    let filter: ReaddirpOptions = { fileFilter: ['*.js', '*.mjs'] };
    for await (const entry of readdirp(scanDir, filter)) {
      let pathname = entry.path
        .replace(/\.js$/i, '')
        .replace(/\\/, '/')
        .toLowerCase();

      let module = await import(entry.fullPath);
      // 默认控制器类不存在，跳过
      if (!module.default) {
        continue;
      }
      let actions = Reflect.ownKeys(module.default.prototype);
      for (let actionName of actions) {
        // 控制器方法不能作为action，符号类型不能作为action
        if (
          actionName === 'constructor' ||
          actionName === 'beforeAction' ||
          typeof actionName === 'symbol'
        ) {
          continue;
        }
        let routerData: RouterData = {
          class: module.default,
          actionName,
        };
        let actionUri = actionName.toLowerCase();
        // 可以配置一个默认路由
        if (actionUri === this.config.defaultAction) {
          this.cachedRouter[pathname] = routerData;
        }
        this.cachedRouter[`${pathname}/${actionUri}`] = routerData;
      }
    }
  }

  /**
   * 启动并运行应用程序
   */
  public async run() {
    // 启动时触发回调
    await this.config.onAppStart?.();

    // 首先注册所有路由
    await this.detectAllRouter();

    // 注册KOA对象
    const server = new Server();
    server.proxy = true;

    // 启用body解析
    server.use(koaBody({ multipart: true }));

    // 找到对应的动作并解析
    server.use(async (ctx: Context) => {
      let pathname = ctx.path
        .replace(/^\/*|\/*$/g, '')
        .trim()
        .toLowerCase();
      let data = this.cachedRouter[pathname];
      if (!data) {
        ctx.status = 404;
        return;
      }

      // 走到这里说明找到了路由，设置默认状态码200
      ctx.status = 200;
      // 先执行前置钩子
      let controller = new data.class(ctx);
      if (typeof controller.beforeAction === 'function') {
        let hookReturn = await controller.beforeAction();
        if (hookReturn === 'abort') {
          return;
        }
      }
      // 前置钩子执行通过，执行动作
      await controller[data.actionName]();
    });

    server.listen(this.config.port);
    log(`Application started and listening on port ${this.config.port}`);
  }
}
