import { ColumnModel } from '../model/ColumnModel';
import { paramRules } from './paramRules';
import { SettingsConfig } from '../model/SettingsConfig';

/**
 * 合并参数校验的方法
 * @param settings 全局配置信息
 * @param pageKey 页面key
 */
export const mergeValidatePrefix = (settings: SettingsConfig, pageKey: string) => {
  const prefixList = [`validate_${pageKey}`];
  if (settings.validateFunPrefix) {
    let list;
    if (Array.isArray(settings.validateFunPrefix)) {
      list = settings.validateFunPrefix;
    } else {
      list = settings.validateFunPrefix.split(',');
    }
    list.forEach((prefix) => {
      const funName = `${prefix}${pageKey}`;
      if (prefixList.indexOf(funName) < 0) {
        prefixList.push(funName);
      }
    });
  }
  return prefixList;
};

/**
 * 整页的参数校验，用户自定义
 * @param settings 全局配置信息
 * @param pageKey 当前分页的key值，校验方法即为 prefix_key
 * @param data 当前需要校验的数据
 * @param allData 当前修改的全部数据
 */
export function pageDataValidator(settings: SettingsConfig, pageKey: string, data: any, allData: any) {
  const validateList: Array<string> = mergeValidatePrefix(settings, pageKey);
  console.log('validate=>', validateList);
  validateList.forEach((validateName) => {
    // @ts-ignore
    const fun = window[validateName];
    if (fun) {
      fun(data, allData);
    }
  });
}
/**
 *
 * @param value 需要验证的单个值，如果不为空，则验证单个值
 * @param config 当前的配置信息
 * @param allData 表单的所有数据，如果value为空，则验证
 * @constructor
 */
export function DataValidator(value: any, config: ColumnModel, allData?: any) {
  // console.log('DataValidator=>[value]', value);
  // console.log('DataValidator=>[config]', config);
  // console.log('DataValidator[allData]=>', allData);
  paramRules.required(value, config, allData);
  ruleTypeValidator(value, config, allData);
  if (config.items && value instanceof Array) {
    config.items.forEach((item) => {
      ruleTypeValidator(null, item, value);
    });
  }
}

/**
 * 自定义校验规则
 * @param value 当前的输入值
 * @param config 当前输入值的配置信息
 * @param allData 需要校验的全部数据
 */
export function ruleTypeValidator(value: any, config: ColumnModel, allData: any) {
  if (!config.ruleType) {
    return;
  }
  const rules = config.ruleType.split(',');
  if (!rules.length) {
    return;
  }
  rules.forEach((rule) => {
    // @ts-ignore
    const validator: any = paramRules[rule];
    if (!validator) {
      return;
    }
    validator(value, config, allData);
  });
}
