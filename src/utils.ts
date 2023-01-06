import { AppConfig } from './config';

/**
 * 记录日志
 * @param args 
 */
export function log(...args: any[]) {
  const config = AppConfig.getInstance();
  if (config.data.debug && process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}
