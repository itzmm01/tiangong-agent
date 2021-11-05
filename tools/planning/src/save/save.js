/**
 * 保存方法
 * @param data
 * @param yaml
 */
window.saveConfig = function (data, yaml) {
  console.log('saveConfig');
  return {
    'demo.json': JSON.stringify(data, null, 2),
  };
};

window.saveConfig2 = function () {
  return {
    'demo1.txt': 'second saveConfig2',
  };
};
