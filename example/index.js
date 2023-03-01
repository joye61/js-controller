import { App } from '../dist/index.js';
import path from 'path';
import { fileURLToPath } from 'url';


new App({
  controllerRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), './controller'),
}).run();
