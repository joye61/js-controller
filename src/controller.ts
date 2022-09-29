import Server from 'koa';
import koaBody from 'koa-body';
import readdirp, { ReaddirpOptions } from 'readdirp';

interface JSControllerConfig {
  rootDir: string;
  defaultRoute?: string;
  port?: number;
  bodyOption?: koaBody.IKoaBodyOptions;
  // 应用启动时触发
  onAppStart?: () => Promise<void>;
  // 路由开始前触发
  onBeforeRoute?: (ctx: ActionParam) => Promise<boolean>;
  // 路由结束后触发
  onAfterRoute?: (ctx: ActionParam) => Promise<void>;
}

type ActionParam = Server.ParameterizedContext<
  Server.DefaultState,
  Server.DefaultContext,
  any
>;

type Action = (ctx?: ActionParam) => void;

export class JSController {
  config: JSControllerConfig;
  cache: Record<string, Action> = {};

  constructor(option: JSControllerConfig) {
    let bodyOption = option.bodyOption ?? {};
    delete option.bodyOption;
    this.config = {
      defaultRoute: '/index/index',
      port: 4000,
      bodyOption: {
        jsonLimit: 1 * 1024 * 1024,
        formLimit: 1 * 1024 * 1024,
        textLimit: 1 * 1024 * 1024,
        multipart: true,
        ...bodyOption,
      },
      ...option,
    };

    this.run();
  }

  /**
   * 启动APP
   */
  async run() {
    await this.config.onAppStart?.();
    await this.register();
    await this.startServer();
  }

  normalize(pathname: string) {
    pathname = pathname.replace(/^\/*|\/*$/g, '').trim();
    return pathname;
  }

  /**
   * 初始化时注册所有控制器
   */
  async register() {
    const readOption: ReaddirpOptions = {
      fileFilter: ['*.js', '*.mjs'],
    };
    for await (const entry of readdirp(this.config.rootDir, readOption)) {
      const name = this.normalize(
        entry.path.replace(/\.js$/i, '')
      ).toLowerCase();
      const module = await import(entry.fullPath);
      const keys = Object.keys(module);
      for (let key of keys) {
        // 下划线开头的键认为是私有的，不能访问
        // 动作必须是函数
        if (
          !key.startsWith('_') &&
          key !== 'default' &&
          typeof module[key] === 'function'
        ) {
          this.cache[name + `/${key.toLowerCase()}`] = module[key];
        }
      }
    }
  }

  /**
   * 启动koa服务器
   */
  async startServer() {
    const app = new Server();
    app.proxy = true;

    app.use(koaBody(this.config.bodyOption));

    app.use(async (ctx, next) => {
      ctx.form = ctx.request.body;
      ctx.files = ctx.request.files;
      ctx.json = function (data = null, code = 0, message = 'ok') {
        this.status = 200;
        this.type = 'json';
        this.body = JSON.stringify({ data, code, message });
      };
      ctx.GET = (name: string) => {
        return (<any>ctx.search)[name];
      };
      ctx.POST = (name: string) => {
        return ctx.form[name];
      };
      ctx.param = (name: string) => {
        let find = ctx.search as any;
        if (typeof ctx.form === 'object') {
          find = { ...find, ...ctx.form };
        }
        return find[name];
      };

      await this.config.onBeforeRoute?.(ctx);
      await next();
    });

    app.use(async (ctx) => {
      // 路由前置钩子
      const preventRoute = await this.config.onBeforeRoute?.(ctx);
      // 前置钩子可以返回指示阻止后续路由的逻辑
      if (preventRoute) {
        return;
      }

      const action = this.findAction(ctx.path);
      if (!action) {
        ctx.throw(404);
        return;
      }
      // 调用action
      await action(ctx);

      // 没有输出，则默认输出空
      if (!ctx.body) {
        ctx.json();
      }
      // 路由后置钩子
      await this.config.onAfterRoute?.(ctx);
    });

    app.listen(this.config.port);
  }

  /**
   * 查找动作
   * @param pathname
   * @returns Action | undefined
   */
  findAction(pathname: string): Action | undefined {
    let route = this.normalize(pathname).toLowerCase();
    if (!route) {
      route = this.normalize(this.config.defaultRoute!).toLowerCase();
    }
    // 查找action，如果控制器存在，直接返回
    let action = this.cache[route];
    if (action) {
      return action;
    }
    // 如果action不存在，尝试检测名为index的action路径
    return this.cache[route + '/index'];
  }
}
