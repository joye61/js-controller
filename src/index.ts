import { App } from './app';
import { AppConfig, AppConfigData } from './config';

export async function runApp(configData: AppConfigData) {
  AppConfig.create(configData);
  await App.getInstance().run();
}

export { Controller } from './controller';
export { Model } from './model';
export { MongoDB, Mdb, MCol } from './mongodb';
export { SQLite } from './sqlite';

export type { HookReturnValue } from './types';
