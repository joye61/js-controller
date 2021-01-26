# A simple controller scaffold

Simple controller scaffolding for small individual projects


Installation

```
npm i js-controller
```

Import

```js
// Import Library
import { runApp } from "js-controller";
// Launch App
runApp()
// Or pass the configuration file directory at startup
runApp("path/to/configRootDir")
```

> For a complete example, please refer to the project under [test](./test) directory


## Configuration file conventions

- When starting the application, you can specify the configuration file root `runApp("path/to/configRoot")`, if not specified, the default is the `config` folder in the project root
- Assuming the configuration file root directory is `config`, `config/main.js` must exist to represent the generic configuration file
- Assuming that the configuration file root is `config`, `config/[process.env.NODE_ENV].js` must exist to represent the environment-related configuration file

Assuming the configuration file root is `config`, then:

```
┣━config
  ┣━main.js
  ┣━production.js
  ┣━development.js
  ┣━...
```

## Configuration item conventions

Scaffolding supports `mongodb` database by default and will automatically connect if the `mongodb` connection parameter is included in the configuration project

```ts
// For mongodb databases
interface MongodbConnectOption {
  // Host name
  host: string;
  // Port number
  port: string;
  // The default database to connect to
  database?: string;
  // user name
  user?: string;
  // password
  password?: string;
  // Whether debugging is enabled or not
  debug?: boolean;
}

interface ConfigOption {
  // Application name
  appName?: string;
  // Application version
  appVersion?: string;
  // Listen to the local address
  httpHost?: string;
  // The port to listen on
  httpPort?: number | string;
  // If or not debugging is enabled, this mode will output errors and other information
  debug: boolean;
  // POST request body limit (bytes)
  postBodyLimit?: number;
  // Controller root directory
  controllerRootDir: string;
  // name of the hook that is triggered before the action is called
  onBeforeActionHook?: string;
  // The name of the hook that fires after the action is invoked
  onAfterActionHook?: string;
  // mongodb database linking option
  mongodbConnectOption?: MongodbConnectOption;
}
```

> The configuration item `controllerRootDir` is required and represents the root directory of the **controller files**


## Routing rules

```
/path/to/[controller]/[action]
```

For example: `/module/article/search`

The last part of the path `search` will be treated as the action name, and the previous part `/module/article` will be treated as the path to the controller file, which will eventually resolve to

- Controller file: `path/to/[controllerRootDir]/module/article.js`   
- Action name: `search`


Controller filenames and action names are case-insensitive:

```
/module/ArtIcle/search  legal, controller is not case sensitive
/module/ArtIcle/seArch  legal, controller and action are case-insensitive
/module/article/SeaRch  legal, actions are case insensitive
/module/article/SeaRch  illegal, only controllers and actions are case-insensitive
```

## Controller Conventions

The controller file corresponds to a module, this module must have a **default exported class**, `js-controller` will instantiate that class and then call the actions of that class as follows: 

```js
// Controller
export default class Article {
  search(){
    // TODO
  }
}
```

The corresponding path is `/path/to/article/search`


# Development

Clone the project, run it at the same time, you can open the development test, `test` directory for the test code

```
npm run ts
npm run dev
```


