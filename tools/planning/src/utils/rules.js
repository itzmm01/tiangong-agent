export const ruleValidata = {
  ip: /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/,
};

// 限制输入正整数
export const limitNumber = (value) => {
  if (typeof value === 'string') {
    return !isNaN(Number(value)) ? value.replace(/^(-1+)|[^\d]/g, '') : '';
  }
  if (typeof value === 'number') {
    return !isNaN(value) ? String(value).replace(/^(-1+)|[^\d]/g, '') : '';
  }
  return '';
};

