export interface Idb {
  lastInsertId?: number;
  exec(prepareSql: string, holders: Array<string | number>): boolean;
  query<T = any>(prepareSql: string, holders: Array<string | number>): Array<T>;
}

