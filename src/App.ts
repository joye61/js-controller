import koaBody, { type IKoaBodyOptions } from 'koa-body';
import Server, { type Context, type Middleware } from 'koa';
import readdirp, { type ReaddirpOptions } from 'readdirp';
import path from 'path';

export interface RouterData {
  class: new (ctx: Context) => any;
  actionName: string;
}

export interface CachedRouter {
  [path: string]: RouterData;
}

export interface AppConfig {
  // proxy为true时支持X-Forwarded-Host
  proxy?: boolean;
  // 应用监听端口
  port?: number | string;
  // 控制器根目录
  controllerRoot: string;
  // 默认动作
  defaultAction?: string;
  // 动作前置钩子名字
  beforeAction?: string;
  // koa-body的选项
  bodyOptions?: IKoaBodyOptions;
  // 启动时触发
  onStart?: () => Promise<void> | void;
  // 自定义中间件
  middlewares?: Middleware[];
}

export class App {
  // 配置对象
  private config: AppConfig;

  public constructor(option: AppConfig) {
    const defaultConfig: Partial<AppConfig> = {
      proxy: true,
      port: 9000,
      defaultAction: 'index',
      beforeAction: 'beforeAction',
      bodyOptions: { multipart: true },
      onStart() {},
    };
    this.config = {
      ...defaultConfig,
      ...option,
    };
  }

  // 缓存路由逻辑
  private cachedRouter: CachedRouter = {};

  /**
   * 检测所有的路由逻辑
   */
  private async detectAllRouter() {
    if (!this.config.controllerRoot) {
      throw new Error('Controller root directory does not exist');
    }
    const scanDir = path.normalize(this.config.controllerRoot);
    const filter: ReaddirpOptions = { fileFilter: ['*.js', '*.mjs', '*.cjs'] };
    for await (const entry of readdirp(scanDir, filter)) {
      const pathname = entry.path
        .replace(/\.js$/i, '')
        .replace(/\\/, '/')
        .toLowerCase();

      // 导入控制器文件
      let Class = require(entry.fullPath);

      // 如果导出的是一个对象，则认为是非默认导出
      // 非默认导出取第一个遇到的类为控制器类
      if (typeof Class === 'object') {
        const keys = Object.keys(Class);
        for (let key of keys) {
          if (typeof Class[key] === 'function') {
            Class = Class[key];
            break;
          }
        }
      }

      // 如果到这里，仍然无法检测出Class是个控制器类，则退出后续逻辑
      if (typeof Class !== 'function') {
        continue;
      }

      const actions = Reflect.ownKeys(Class.prototype);
      for (const actionName of actions) {
        // 控制器方法不能作为action，符号类型不能作为action
        if (
          actionName === 'constructor' ||
          actionName === this.config.beforeAction ||
          typeof actionName === 'symbol'
        ) {
          continue;
        }
        const routerData: RouterData = {
          class: Class,
          actionName,
        };
        const actionUri = actionName.toLowerCase();
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
    await this.config.onStart?.();

    // 首先注册所有路由
    await this.detectAllRouter();

    // 注册KOA对象
    const server = new Server();
    server.proxy = <boolean>this.config.proxy;

    // 启用body解析
    server.use(koaBody(this.config.bodyOptions));

    // 如果有其他自定义中间件，则启用
    const middlewares = this.config.middlewares;
    if (Array.isArray(middlewares) && middlewares.length > 0) {
      for (const middleware of middlewares) {
        server.use(middleware);
      }
    }

    // 找到对应的动作并解析
    server.use(async (ctx: Context) => {
      const pathname = ctx.path
        .replace(/^\/*|\/*$/g, '')
        .trim()
        .toLowerCase();
      const data = this.cachedRouter[pathname];
      if (!data) {
        ctx.status = 404;
        return;
      }

      // 走到这里说明找到了路由，设置默认状态码200
      ctx.status = 200;
      ctx.body = '';

      // 先执行前置钩子
      const controller = new data.class(ctx);
      const beforeAction = this.config.beforeAction!;
      if (typeof controller[beforeAction] === 'function') {
        const beforeActionReturn = await controller[beforeAction]();
        // 如果前置钩子有返回，不执行后续动作
        if (!!beforeActionReturn) {
          return;
        }
      }

      // 前置钩子返回任何可判定为false的值，执行动作
      await controller[data.actionName]();
    });

    server.listen(this.config.port);

    // 打印启动信息
    console.log(
      `Application started and listening on port :${this.config.port}`
    );
  }
}
