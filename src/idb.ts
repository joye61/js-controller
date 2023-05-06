export interface Idb {
  lastInsertedId?: number;
  exec(prepareSql: string, holders: Array<any>): Promise<boolean>;
  query<T = any>(prepareSql: string, holders: Array<any>): Promise<Array<T>>;
}
