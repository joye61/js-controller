import type { IKoaBodyOptions } from 'koa-body';

export interface AppConfigData {
  // debug模式，只有测试环境且debug=true才会打印日志
  debug?: boolean;
  // 监听端口
  port?: number | string;
  // 控制器根目录
  controllerRoot: string;
  // 默认动作
  defaultAction?: string;
  // koa-body的选项
  bodyOptions?: IKoaBodyOptions;
  // 启动时触发
  onAppStart?: () => Promise<void> | void;
}

export class AppConfig {
  public data: Required<AppConfigData>;
  private static instance?: AppConfig;

  private constructor(config: AppConfigData) {
    let defaultData: Required<AppConfigData> = {
      debug: true,
      port: 9000,
      defaultAction: 'index',
      bodyOptions: { multipart: true },
      onAppStart() {},
      ...config,
    };
    this.data = defaultData;
  }

  public static create(data: AppConfigData) {
    AppConfig.instance = new AppConfig(data);
  }

  public static getInstance() {
    return AppConfig.instance as AppConfig;
  }
}
