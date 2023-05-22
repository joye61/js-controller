# Web Services Rapid Development

HTTP server side development for small or personal projects in a `MVC-like` way. In fact, it is suitable for most of the daily projects, I have used it to develop a number of online stable projects, very simple. The underlying framework of the HTTP service is based on [`Koa`](https://github.com/koajs/koa)

# Installation

```
npm i js-controller
```

# Usage

```js
// Import Library
import { runApp } from 'js-controller';
// Import configuration
runApp({
  controllerRoot: 'path/to/controller',
});
```

`runApp` accepts an object of type `AppConfig` to configure the application, all optional except for the `controllerRoot` parameter, which is mandatory

```ts
interface AppConfig {
  // X-Forwarded-Host is supported when proxy is true, default is true
  proxy?: boolean;
  // Application Listening Port, default is 9000
  port?: number | string;
  // Controller root directory
  controllerRoot: string;
  // The default action is `index`
  defaultAction?: string;
  // action prefix hook name, default is 'beforeAction'
  beforeAction?: string;
  // Options for koa-body
  bodyOptions?: IKoaBodyOptions;
  // A function that is triggered when the application starts and is used to initialize some functions
  onStart?: () => Promise<void> | void;
  // custom middlewares for koa
  middlewares?: Middleware[];
}
```

> For a complete example, please refer to the project under [example](./example) directory

# Controller Conventions

- The controller is a JavaScript file
- The controller file must have a default class export
- The instance methods of the controller class are agreed to be actions
- The controller file name and the action together form the route, which is case-insensitive
- Actions can have a default value, which is configured in the startup portal via `defaultAction` or, if not specified, `index`.

For example: `/module/article/search`

The last part of the path `search` will be treated as the action name, and the previous part `/module/article` will be treated as the path to the controller file, which will eventually resolve to

- Controller file: `path/to/[controllerRootDir]/module/article.js`
- Action name: `search`

The corresponding controller file should look like the following, which can be found in the [example](. /example) directory for an example

```js
// ES module. Controller file: article.ts
// Since routing is not case sensitive, the file names article.ts, Article.ts, arTicle.ts are fine
export default class {
  search() {
    // TODO
  }
}
```

Controller filenames and action names are case-insensitive:

```
/module/ArtIcle/search  legal, controller is not case sensitive
/module/ArtIcle/seArch  legal, controller and action are case insensitive
/module/article/SeaRch  legal, actions are case insensitive
```

If `search` is configured as the default action, then the routes `/module/article/search` and `/module/article` are equivalent

# Routing rules

**`path/to/[controllerRoot]/controller/action`**

The corresponding route is `controller/action`

**`path/to/[controllerRoot]/subdirectory/controller/action`**

The corresponding route is `subdirectory/controller/action`

**`path/to/[controllerRoot]/subdirectory/.../controller/action`**

The corresponding route is `subdirectory/.../controller/action`, Subdirectories can have unlimited levels

The directory structure is shown below.

```
┣━controllerRoot
  ┣━controller1.js
  ┣━controller2.js
  ┣━subdirectory
    ┣━controller1.js
    ┣━controller2.js
    ┣━...
  ┣━...
```


# Development

Clone the project, run it at the same time

```
npm run ts
npm run dev
```
