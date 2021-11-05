import JSZip from 'jszip';
import { replaceConfig, uniqueKey } from './util';
// @ts-ignore
import YAML from 'js-yaml';
import { ColumnModel } from '../model/ColumnModel';
import { isNull, noRequired } from './paramRules';
import { DEF_FIRST_COLUMN, DEF_SETTINGS_CONFIG, SettingsConfig } from '../model/SettingsConfig';
import { TemplateConfig } from '../model/TemplateConfig';
import { TemplateModel } from '../model/TemplateModel';
import { PlanningData } from '../model/PlanningData';
import { PlanStepModel } from '../model/PlanStepModel';
import { saveHostData, saveTopologyHost } from './save';

/**
 * 导出配置文件
 * @param data  勾选保存的配置数据，
 * @param settings  默认导出文件的名字
 * @param templateFile  导入的模板json格式数据，
 */
export function downloadText(data: any, settings: SettingsConfig, templateFile = 'data') {
  const zip = new JSZip();
  zip.file(`${templateFile}.json`, JSON.stringify(data, null, 2));

  let hostData: any;
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  if (data.topology && data.topology.length) {
    hostData = saveTopologyHost(settings, data.topology, data.host);
  } else {
    hostData = saveHostData(settings, data.host);
  }
  const saveFileMap: any = { ...hostData };

  console.log('templateData=>', settings);
  const { saveFun } = settings;
  const saveFunList: Array<string> = ['saveConfig'];
  if (saveFun) {
    if (Array.isArray(saveFun)) {
      saveFun.forEach((fun) => {
        if (saveFunList.indexOf(fun) < 0) {
          saveFunList.push(fun);
        }
      });
    } else {
      saveFun.split(',').forEach((funName) => {
        if (saveFunList.indexOf(funName) < 0) {
          saveFunList.push(funName);
        }
      });
    }
  }

  let hasSave = false;
  console.log('saveFunList', saveFunList);
  saveFunList.forEach((funName) => {
    // @ts-ignore
    if (!window[funName]) {
      console.warn('function not exist', funName);
      return;
    }
    // @ts-ignore
    const configData: any = window[funName](data, YAML);
    Object.assign(saveFileMap, configData);
    hasSave = true;
  });

  if (!hasSave) {
    // 通过 model.js 自定义模板格式，通过 【替换的】 形式来生成导出自己想要的配置文件
    try {
      // 读取model.js中的 定义的模板
      const replaceData = replaceConfig(data);
      console.log('replaceData', replaceData);
      if (replaceData) {
        Object.keys(replaceData).forEach((item) => {
          saveFileMap[item] = replaceData[item];
        });
      }
    } catch (e) {
      console.error('生成自定义配置信息错误----------', e);
      throw new Error('生成自定义配置信息错误!');
    }
  }

  Object.keys(saveFileMap).forEach((fileName) => {
    zip.file(fileName, saveFileMap[fileName]);
  });

  // 打包压缩文件
  zip.generateAsync({ type: 'base64' }).then((base64) => {
    let filename = `${settings.exportFileName || 'conf'}.zip`;
    if (!filename.endsWith('.zip')) {
      filename = `${filename}.zip`;
    }
    const element = document.createElement('a');
    element.setAttribute('href', `data:application/zip;base64,${base64}`);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();
    document.body.removeChild(element);
  });
}

/**
 * 加一些初始值，不然不好搞，主要是检查数据的key值，免得出现异常
 * 比如开关按钮，默认加个值为false
 * @param data
 * @param columns
 */
export function checkPlanningData(data: any, columns: Array<ColumnModel>) {
  if (data instanceof Array) {
    const keyMap: any = {};
    data.forEach((item: any) => {
      if (!item.key || item.key.length === 0 || keyMap[item.key]) {
        // eslint-disable-next-line no-param-reassign
        item.key = uniqueKey();
      }
      keyMap[item.key] = true;
      checkPlanningData(item, columns);
    });
  } else if (data && columns) {
    columns.forEach((column) => {
      const dataIndex = column.dataIndex || column.key;
      let indexData = data[dataIndex];
      if (column.type === 'array' && column.items) {
        if ((!indexData || indexData.length === 0) && !noRequired(column.required)) {
          indexData = [initArrayData(column.items, { key: `${dataIndex}_1` })];
          // eslint-disable-next-line no-param-reassign
          data[dataIndex] = indexData;
          console.log('indexData', indexData);
        }
        if (indexData) {
          const keyMap: any = {};
          indexData.forEach((childData: any) => {
            if (!childData.key || childData.key.length === 0 || keyMap[childData.key]) {
              // eslint-disable-next-line no-param-reassign
              childData.key = uniqueKey();
            }
            keyMap[childData.key] = true;
            checkPlanningData(childData, column.items);
          });
        }
      }
    });
  }
}

export const initArrayData = (columns: Array<ColumnModel>, initialData: any) => {
  const data = { ...initialData };
  columns.forEach((column: ColumnModel) => {
    const dataIndex = column.dataIndex || column.key;
    if (noRequired(column.required) || !isNull(data[dataIndex])) {
      return;
    }
    if (column.type === 'boolean' || column.type === 'switch') {
      data[dataIndex] = !!column.value;
    } else {
      data[dataIndex] = column.value;
    }
  });
  return data;
};

/**
 * 从主机配置中，把主机标签的key值找出来
 * @param hostConfig 主机配置项
 */
export const parseHostLabel = (hostConfig?: TemplateConfig) => {
  if (!hostConfig) {
    return;
  }
  if (hostConfig.basicConfig) {
    const labelColumns = hostConfig.basicConfig.filter((item) => item.isHostLabel);
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (labelColumns && labelColumns.length) {
      return labelColumns[0];
    }
  }
  return;
};

/**
 * 初始化界面的数据,将list数据转化为需要的map类型的数据
 * 所以当时为什么渲染模板结构要这么定义？
 * @param template
 * @param originData
 */
export function makePageData(template: Array<TemplateModel>, originData: PlanningData) {
  const steps: Array<PlanStepModel> = [];
  const data: PlanningData = {};

  if (!template || !template.length) {
    return {
      steps,
      data,
      settingsConfig: {
        ...DEF_SETTINGS_CONFIG,
      },
    };
  }

  let pageSetting: any = { ...DEF_SETTINGS_CONFIG };
  let hostLabelColumn: any = undefined;
  template.forEach((pageItem: TemplateModel) => {
    switch (pageItem.page) {
      case 'globalConfig':
      case 'setting':
        if (pageItem.config.pageTitle) {
          document.title = pageItem.config.pageTitle;
        }
        pageSetting = { ...pageSetting, ...pageItem.config };
        break;
      case 'common':
        steps.push({ title: '基础配置', content: 'FormSizeDemo', config: pageItem, key: 'common' });
        data.common = originData.common || {};
        break;
      case 'host':
        steps.push({ title: '主机配置', content: 'EditableTable', config: pageItem, key: 'host' });
        data.host = originData.host || [];
        hostLabelColumn = parseHostLabel(pageItem.config);
        if (hostLabelColumn && !hostLabelColumn.key) {
          hostLabelColumn.key = hostLabelColumn.dataIndex;
        }
        break;
      case 'param':
        steps.push({ title: '参数配置', content: 'ParamConfig', config: pageItem, key: 'param' });
        data.param = originData.param || {};
        break;
      case 'service':
        steps.push({ title: '服务配置', content: 'ServiceConfig', config: pageItem, key: 'service' });
        data.service = originData.service || [];
        break;
      case 'topology':
        steps.push({ title: '部署拓扑', content: 'Topology', config: pageItem, key: 'topology' });
        data.topology = originData.topology || [];
        break;
      case 'summary':
        // @ts-ignore
        steps.push({ title: '信息确认', content: '信息确认', config: {}, key: 'summary' });
        break;
      default:
        console.warn('添加了其他template里面没有的配置~~');
    }
  });

  if (hostLabelColumn) {
    pageSetting.hostLabelKey = hostLabelColumn.key || hostLabelColumn.dataIndex;
    pageSetting.hostColumn = hostLabelColumn;
  }
  if (!pageSetting.ipKey) {
    pageSetting.ipKey = 'inner-ip';
  }
  return {
    steps,
    data,
    settingsConfig: pageSetting,
  };
}
