# 适用于轻量级服务器的控制器脚手架

## 配置文件约定

- 启动应用程序时，需要传递参数指定配置文件根目录`runApp("path/to/configRoot")`
- 假设配置文件根目录为`config`，必须存在`config/main.js` 代表通用配置文件
- 假设配置文件根目录为`config`，必须存在`config/[process.env.NODE_ENV].js`代表环境相关的配置文件

假设配置文件根目录为`config`，如以下例子：

```
┣━config
  ┣━main.js
  ┣━production.js
  ┣━development.js
  ┣━...
```

## 配置项约定

```ts
// 针对mongodb数据库
interface MongodbConnectOption {
  // 主机名
  host: string;
  // 端口号
  port: string;
  // 默认连接的数据库
  database?: string;
  // 用户名
  user?: string;
  // 密码
  password?: string;
  // 是否开启调试
  debug?: boolean;
}

interface ConfigOption {
  // 应用程序名字
  appName?: string;
  // 应用程序版本
  appVersion?: string;
  // 监听本地地址
  httpHost?: string;
  // 监听的端口
  httpPort?: number | string;
  // POST请求的请求体限制（字节）
  postBodyLimit?: number;
  // 控制器根目录
  controllerRootDir: string;
  // 调用动作之前触发的钩子名字
  onBeforeActionHook?: string;
  // 调用动作之后触发的钩子名字
  onAfterActionHook?: string;
  // mongodb数据库链接选项
  mongodbConnectOption?: MongodbConnectOption;
}
```

配置项 `controllerRootDir` 是必须的，代表**控制器文件的根目录**

## 路由查找规则

如：`/module/article/search`

路径的最后一段`search`会被当成动作名，前面的部分`/module/article`会被当做控制器文件的路径，最终将解析得到：

- 控制器文件: `path/to/[controllerRootDir]/module/article.js`   
- 动作名字: `search`


控制器文件名和动作名都是不区分大小写的，`article.js` 可以为 `aRTicle.js`，`search`可以为`Search`。除此之外，路径其余的部分**对大小写敏感**，如`module`就不能为`Module`

## 控制器约定

控制器文件对应一个模块，此模块必须有一个**默认导出的类**，`js-controller`将会实例化该类，然后调用该类的动作，如下：

```js
// 控制器
export default class Article {
  search(){
    // TODO
  }
}
```


