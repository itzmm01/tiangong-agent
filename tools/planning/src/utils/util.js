import { ruleValidata } from './rules';

// 是否存在重复值
export const isRepeat = (arr) => {
  const hash = {};
  arr.forEach((item) => {
    if (hash[item]) {
      return true;
    }
    hash[item] = true;
  });

  return false;
};

export const hasRepeat = (arr = [], dataIndex) => {
  if (!arr || !dataIndex) {
    return false;
  }
  const dataMap = {};
  return (
    arr.findIndex((item, index) => {
      if (dataMap[item[dataIndex]]) {
        return true;
      }
      dataMap[item[dataIndex]] = true;
      return false;
    }) > -1
  );
};

// 添加默认效验证规则
export const initRules = (data) => {
  const { name, ruleType } = data;
  let { required } = data;
  // 如果没有设置require属性，默认必填
  if (required === undefined) {
    required = true;
  }
  const rules = [{ required: !!required, message: `${name}必须填写.` }];
  // 如果为必填，直接添加效验证
  if (required) {
    if (ruleType) {
      rules.push({
        message: `${name}格式填写不正确`,
        pattern: ruleValidata[ruleType],
      });
    }
  } else {
    // 如果非必填，如果输入了文本内容 再效验
    const passwordValidator = (rule, value, callback) => {
      if (value && value !== '') {
        if (!ruleValidata[ruleType].test(value)) {
          callback(`${name}格式填写不正确`);
        }
      }
      callback();
    };
    if (ruleType) {
      rules.push({
        validator: passwordValidator,
      });
    }
  }
  return rules;
};

export const replaceConfig = (data) => {
  const { fileList } = window;
  // 多个模板 遍历循环
  Object.keys(fileList).forEach((template) => {
    let templateStr = fileList[template]; // 拿到单个模板字符串
    const iplist = {};
    if (data.common) {
      Object.keys(data.common).forEach((keyItem) => {
        const value = data.common[keyItem] || '';
        templateStr = templateStr.replace(`__${keyItem}__`, value);
      });
    }
    if (data.param) {
      Object.keys(data.param).forEach((keyItem) => {
        const value = data.param[keyItem] || '';
        templateStr = templateStr.replace(`__${keyItem}__`, value);
      });
    }
    if (data.topology && data.topology.length > 0) {
      // 将ip根据select 服务进行数组分类
      data.topology.forEach((item, index) => {
        item.selectArr.forEach((cliItem) => {
          if (cliItem.children && cliItem.children.length > 0) {
            cliItem.children.forEach((clildrenItem) => {
              // 根据select 为true 的服务 进行ip数组归类
              if (index === 0) {
                iplist[clildrenItem.key] = [];
              }
              clildrenItem.select && iplist[clildrenItem.key].push(item['inner-ip']);
            });
          } else {
            if (index === 0) {
              iplist[cliItem.key] = [];
            }
            cliItem.select && iplist[cliItem.key].push(item['inner-ip']);
          }
        });
      });
    }

    // ip数组不是空对象
    if (Object.getOwnPropertyNames(iplist).length > 0) {
      Object.keys(iplist).forEach((item) => {
        iplist[item].forEach((ip, ipIndex) => {
          const value = ip || '';
          templateStr = templateStr.replace(`__${item}_IP_${ipIndex}__`, value);
        });
      });
    }

    fileList[template] = templateStr;
  });
  return fileList;
};

export const uniqueKey = () => {
  const s = [];
  const hexDigits = '0123456789abcdef';
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  return s.join('');
};

export const hasLength = value => (value ? value.length : false);
export const isNull = val => typeof val === 'undefined' || val === null;
export const isFalse = value => !isNull(value) && !value;
