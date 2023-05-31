export type ValueHolders = {
  prepare: string;
  holders: Array<string | number>;
};

export class SQLParser {
  /**
   * 创建排序字段
   * @param order
   * @returns
   */
  public createOrder(
    order?: Record<string, Uppercase<'ASC' | 'DESC'>> | null
  ): string {
    if (!order) {
      return '';
    }
    let parts: Array<string> = [];
    for (let key in order) {
      let type = order[key].toUpperCase();
      if (['ASC', 'DESC'].includes(type)) {
        parts.push(`\`${key}\` ${type}`);
      }
    }
    return parts.join(', ');
  }

  /**
   * 生成where段的条件
   * @param key
   * @param value
   * @returns
   */
  public createFilter(key: string, value: any): ValueHolders {
    const pattern =
      /^\s*(.*?)\s*(\<[=\>]?|\>=?|(NOT\s+)?(BETWEEN|LIKE|IN|RLIKE))?\s*$/i;
    const found = key.match(pattern);

    // 定义返回值
    let prepare = '';
    let holders: Array<string | number> = [];

    // 如果结果不匹配，直接返回
    if (!found) {
      return { prepare, holders };
    }
    const field = found[1].trim();
    let op = found[2];

    // 如果没有操作符，认为是相等逻辑
    if (!op) {
      prepare = `\`${field}\` = ?`;
      holders.push(value as any);
      return { prepare, holders };
    }
    // 操作符存在，转换维大写
    op = op.trim().replace(/\s+/, ' ').toUpperCase();

    // IN | NOT IN
    if (op === 'IN' || op === 'NOT IN') {
      prepare = `\`${field}\` ${op} `;
      let createInPair = (list: Array<string | number>) => {
        let places: string[] = [];
        let holders: Array<string | number> = [];
        for (let item of list) {
          places.push('?');
          holders.push(item);
        }
        return {
          prepare: places.join(', '),
          holders,
        };
      };
      let list: Array<string | number> | undefined = undefined;
      if (typeof value === 'string') {
        value = value.replace(/\s*\,\s*/g, ',');
        list = value.split(',');
      } else if (Array.isArray(value) && value.length > 0) {
        list = value;
      }

      if (list) {
        let result = createInPair(list);
        prepare += `(${result.prepare})`;
        holders.push(...result.holders);
      } else {
        prepare = '';
      }

      return { prepare, holders };
    }

    // BETWEEN | NOT BETWEEN
    if (op === 'BETWEEN' || op === 'NOT BETWEEN') {
      if (Array.isArray(value) && value.length === 2) {
        prepare = `\`${field}\` ${op} ? AND ?`;
        holders = value;
      }
      return { prepare, holders };
    }

    // < | <= | > | >= | <> | != | LIKE | RLIKE
    prepare = `\`${field}\` ${op} ?`;
    holders.push(value as any);
    return { prepare, holders };
  }

  /**
   * 创建数据过滤，用于update逻辑
   * @param key
   * @param value
   * @returns
   */
  public createDataFilter(key: string, value: any): ValueHolders {
    // 定义返回值
    let prepare = '';
    let holders: Array<any> = [];
    const found = key.match(/^\s*(.+?)\s*([\+\-\*\/]=)?\s*$/);
    if (!found) {
      return { prepare, holders };
    }
    let field = found[1].trim();
    if (!found[2]) {
      prepare = `\`${field}\` = ?`;
      holders.push(value as any);
      return { prepare, holders };
    }

    // 带运算操作
    let op = found[2].trim()[0];
    prepare = `\`${field}\` = \`${field}\` ${op} ?`;
    holders.push(value as any);
    return { prepare, holders };
  }

  /**
   * 创建where条件段
   * @param where
   * @returns
   */
  public createWhere(where?: Record<string, any> | null): ValueHolders {
    // 定义返回值
    let prepares: Array<string> = [];
    let holders: Array<string | number> = [];
    if (!where) {
      return { prepare: '', holders };
    }

    for (let key in where) {
      let value = where[key];
      let tmpHolders = this.createFilter(key, value);
      if (tmpHolders.prepare === '') {
        continue;
      }
      prepares.push(tmpHolders.prepare);
      holders.push(...tmpHolders.holders);
    }
    return {
      prepare: prepares.join(' AND '),
      holders,
    };
  }
}
