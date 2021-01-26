# 适用于轻量级服务器的控制器脚手架

安装

```
npm i js-controller
```

引入

```js
// 导入库
import { runApp } from "js-controller";
// 启动App
runApp()
// 或者启动时传递配置文件目录
runApp("path/to/configRootDir")
```

> 完整示例请参考项目下 [test](./test) 目录


## 配置文件约定

- 启动应用程序时，可以指定配置文件根目录`runApp("path/to/configRoot")`，如果未指定，则默认为项目根目录下`config`文件夹
- 假设配置文件根目录为`config`，必须存在`config/main.js` 代表通用配置文件
- 假设配置文件根目录为`config`，必须存在`config/[process.env.NODE_ENV].js`代表环境相关的配置文件

假设配置文件根目录为`config`，那么：

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
  // 是否开启调试，这个模式会输出错误等信息
  debug: boolean;
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

```
/path/to/控制器/动作
```

如：`/module/article/search`

路径的最后一段`search`会被当成动作名，前面的部分`/module/article`会被当做控制器文件的路径，最终将解析得到：

- 控制器文件: `path/to/[controllerRootDir]/module/article.js`   
- 动作名字: `search`


控制器文件名和动作名都是不区分大小写的：

```
/module/ArtIcle/search  合法，控制器不分大小写
/module/ArtIcle/seArch  合法，控制器和动作不分大小写
/module/article/SeaRch  合法，动作不分大小写
/Module/article/SeaRch  不合法，只有控制器和动作不分大小写
```

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

对应的路径为 `/path/to/article/search`


# 开发

克隆项目，同时运行，可开启开发测试，`test`目录为测试代码

```
npm run ts
npm run dev
```


