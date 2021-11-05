/**
 * 参数校验方法
 */
import { ColumnModel } from '../model/ColumnModel';

export const isNull = (val: any) => typeof val === 'undefined' || val === null;
export const noRequired = (val: any) => !isNull(val) && !val;

export const paramRules = {
  required: (val: any, config: ColumnModel, allData?: any, line?: number) => {
    if (config.required === false) {
      return;
    }
    if (isNull(val) && isNull(allData)) {
      throw new Error(`${config.title}不能为空！`);
    } else if (!isNull(val)) {
      switch (config.type) {
        case 'string':
        case 'enum':
        case 'password':
          paramRules.stringRequired(val, config);
          break;
        case 'array':
          paramRules.arrayRequired(val, config);
          break;
        case 'info':
          break;
      }
      return;
    }
    const { key } = config;
    if (allData instanceof Array) {
      allData.forEach((data: any, index: number) => {
        const indexData = data[key];
        if (isNull(indexData)) {
          console.log('allData=>', data, key);
          throw new Error(`第${(line || index) + 1}行“${config.title}”数据未填写完整，请检查！`);
        }
        paramRules.required(indexData, config, null, index);
      });
    } else {
      const checkData = allData[key];
      if (!checkData) {
        throw new Error(`“${config.title}”数据未填写完整，请检查！`);
      }
      paramRules.required(checkData, config, null);
    }
  },

  stringRequired: (val: any, config: ColumnModel) => {
    if (!val.length) {
      throw new Error(`${config.title}不能为空！`);
    }
  },
  arrayRequired: (val: any, config: ColumnModel) => {
    if (val.length < 1) {
      throw new Error(`${config.title}不能为空！`);
    }
    val.forEach((data: any) => {
      config.items.forEach((item) => {
        const indexData = data[item.key];
        paramRules.required(indexData, item);
      });
    });
  },

  ip(val: any) {
    if (!val) {
      return;
    }
    const right = /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/.test(val);
    if (!right) {
      throw new Error('请输入正确的IP地址！');
    }
  },
  reg(val: any, config: ColumnModel) {
    if (!config.pattern) {
      throw new Error(`未配置正则表达式，请配置pattern`);
    }
    const reg = new RegExp(config.pattern);
    if (!reg.test(val)) {
      throw new Error(`不符合正则：${config.pattern}`);
    }
  },
  columnEqually(value: any, config: ColumnModel, allData: Array<any>) {
    if (!allData || allData.length === 0) {
      return true;
    }
    const { key } = config;
    let preData: any = undefined;
    allData.forEach((item, index) => {
      const sameData = item[key];
      if (preData && preData !== sameData) {
        throw new Error(`${config ? config.title : ''}必须保持一致,第${index + 1} 行与上一行不一致，请核实！`);
      }
      preData = sameData;
    });
  },

  columnUnique(value: any, config: ColumnModel, allData: Array<any>) {
    // console.log('columnUnique=>', value, config, allData);
    if (!allData || allData.length === 0) {
      return true;
    }
    const { key } = config;
    if (isNull(value)) {
      const dataMap: any = {};
      allData.forEach((item) => {
        const uniqueData = item[key];
        if (dataMap[uniqueData]) {
          throw new Error(`${config ? config.title : ''} : "${uniqueData}" 重复！`);
        }
        dataMap[uniqueData] = true;
      });
    } else {
      let count = 0;
      allData.forEach((item) => {
        if (item[key] === value) {
          count = count + 1;
        }
        if (count > 1) {
          throw new Error(`${config ? config.title : ''} : "${value}" 重复！`);
        }
      });
    }
  },
};
