import type { IKoaBodyOptions } from 'koa-body';

export interface AppConfigData {
  // 监听端口
  port?: number | string;
  // 控制器根目录
  controllerRoot: string;
  // 默认动作
  defaultAction?: string;
  // koa-body的选项
  bodyOptions?: IKoaBodyOptions;
}

export class AppConfig {
  private data: Required<AppConfigData>;
  private static instance?: AppConfig;

  private constructor(data: AppConfigData) {
    let defaultData: Required<AppConfigData> = {
      port: 9000,
      controllerRoot: data.controllerRoot,
      defaultAction: 'index',
      bodyOptions: { multipart: true },
    };

    if (data.port) {
      defaultData.port = data.port;
    }

    if (data.defaultAction) {
      defaultData.defaultAction = data.defaultAction;
    }

    if (typeof data.bodyOptions === 'object') {
      defaultData.bodyOptions = {
        ...defaultData.bodyOptions,
        ...data.bodyOptions,
      };
    }

    this.data = defaultData;
  }

  public static create(data: AppConfigData) {
    AppConfig.instance = new AppConfig(data);
  }

  public static getInstance() {
    return AppConfig.instance as AppConfig;
  }

  public item(name: keyof AppConfigData) {
    return this.data[name];
  }
}
