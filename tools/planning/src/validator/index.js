/**
 * 主机参数校验
 * @type {{}}
 */
window.validate_host = function (data, allData) {
  console.log('validate_host', data.length);
  if (data.length < 3) {
    throw new Error('主机数量不能小于4！');
  }
  console.log('validate_allData', allData);
};
/**
 * 校验基础参数
 * @param data
 */
window.validate_common = function (data) {
  console.log('validate_common', data);
};

/**
 * 服务拓扑界面参数校验
 * @param data
 * @param allData
 */
window.validate_topology = function (data, allData) {
  const { host } = allData;
  console.log('validate_topology data', data);
  console.log('validate_topology host', host);
};
