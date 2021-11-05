/**
 * 合并渲染模板
 * 暂时只支持两个模板的合并
 */
import { ColumnModel } from '../model/ColumnModel';

export function mergeTemplate(template1: Array<any>, template2: Array<any>) {
  const map1: any = arrayToMap(template1, 'page');
  const map2: any = arrayToMap(template2, 'page');
  Object.keys(map2).forEach((key) => {
    const source = map1[key];
    const value = map2[key];
    if (!source) {
      map1[key] = value;
      return;
    }
    if (key === 'setting' || key === 'globalConfig') {
      map1[key] = mergeGlobalSettings(source, value);
    } else if (key === 'common') {
      const sourceConfig = source.config || [];
      const config = value.config || [];
      map1[key] = { ...source, config: mergeArray(sourceConfig, config) };
    } else if (key === 'host' || key === 'service' || key === 'topology') {
      const sourceConfig = source.config || {};
      const config = value.config || {};
      map1[key] = { ...source, config: mergeConfig(sourceConfig, config) };
    } else if (key === 'param') {
      const sourceConfig = source.config || [];
      const config = value.config || [];
      map1[key] = { ...source, config: mergeArray(sourceConfig, config, 'param-group', true) };
    }
  });
  return Object.values(map1);
}

/**
 * 全局配置合并
 * @param source
 * @param value
 */
export function mergeGlobalSettings(source: any, value: any) {
  const sourceConfig = source.config || {};
  const config = value.config || {};
  const mergeConfig = { ...sourceConfig, ...config, validateFunPrefix: [], saveFun: [] };
  if (sourceConfig.validateFunPrefix) {
    if (Array.isArray(sourceConfig.validateFunPrefix)) {
      mergeConfig.validateFunPrefix = [...sourceConfig.validateFunPrefix];
    } else {
      mergeConfig.validateFunPrefix.push(sourceConfig.validateFunPrefix);
    }
  }
  if (sourceConfig.saveFun) {
    if (Array.isArray(sourceConfig.saveFun)) {
      mergeConfig.saveFun = [...sourceConfig.saveFun];
    } else {
      mergeConfig.saveFun.push(source.config.saveFun);
    }
  }
  if (config.validateFunPrefix) {
    mergeConfig.validateFunPrefix.push(config.validateFunPrefix);
  }
  if (config.saveFun) {
    mergeConfig.saveFun.push(config.saveFun);
  }
  return { ...source, ...value, config: mergeConfig };
}
/**
 * 合并两个对象，到第三个对象
 * @param config1
 * @param config2
 */
export function mergeConfig(config1: any, config2: any) {
  const source = { ...config1 };
  Object.keys(config2).forEach((k) => {
    if (!config1[k]) {
      source[k] = { ...config2[k] };
    } else {
      const value = config2[k];
      if (Array.isArray(value)) {
        source[k] = mergeArray(source[k], value);
      } else if (typeof value === 'object') {
        source[k] = { ...config1[k], ...value };
      } else {
        source[k] = config2[k];
      }
    }
  });
  return source;
}

/**
 * 根据key合并两个数组
 * @param arr1
 * @param arr2
 * @param key
 * @param recursion 当值为数组的时候，是否进行递归的处理
 */
export function mergeArray(arr1: Array<any>, arr2: Array<any>, key = 'key', recursion = false) {
  const map1: any = arrayToMap(arr1, key);
  const map2: any = arrayToMap(arr2, key);

  Object.keys(map2).forEach((key) => {
    const value = map2[key];
    if (!map1[key]) {
      map1[key] = value;
    } else if (Array.isArray(value) && recursion) {
      map1[key] = mergeArray(map1[key], value);
    } else if (Array.isArray(value)) {
      map1[key] = [...value];
    } else if (typeof value === 'object' && recursion) {
      map1[key] = mergeConfig(map1[key], value);
    } else {
      map1[key] = { ...value };
    }
  });
  return Object.values(map1);
}

export function arrayToMap(arr: Array<any>, key = 'key') {
  const map: any = {};
  arr.forEach((item) => {
    let uniqueKey = item[key];
    if (!uniqueKey) {
      uniqueKey = item.key;
    }
    if (!uniqueKey) {
      uniqueKey = item.dataIndex;
    }
    map[uniqueKey] = item;
  });
  return map;
}

/**
 * 合并两个输入组件配置,不进行递归处理，以后者为准
 * @param arr1
 * @param arr2
 */
export function mergeColumnList(arr1: Array<ColumnModel>, arr2: Array<ColumnModel>) {
  const map1: any = arrayToMap(arr1, 'key');
  const map2: any = arrayToMap(arr2, 'key');
  Object.keys(map2).forEach((key) => {
    const value = map2[key];
    if (!map1[key]) {
      map1[key] = value;
    } else {
      map1[key] = { ...value };
    }
  });
  return Object.values(map1);
}
