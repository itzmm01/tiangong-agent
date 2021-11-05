/**
 * 只导出json数据模板
 */
export const downloadJsonData = (data) => {
  const jsonData = JSON.stringify(data, null, 2);
  const filename = 'data.json';

  const element = document.createElement('a');
  element.setAttribute('href', `data:text/paint;utf-8,${jsonData}`);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();
  document.body.removeChild(element);
};
