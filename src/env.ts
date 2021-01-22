/**
 * 获取当前环境
 */
export function getEnvironment() {
  const env = process.env.NODE_ENV;
  if (!env) {
    throw new Error("Environment variable NODE_ENV is not set");
  }
  if (!["development", "production"].includes(env)) {
    throw new Error(
      "The environment variable can only be 'development' or 'production'"
    );
  }
  return env;
}
