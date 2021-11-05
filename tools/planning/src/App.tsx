// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import defaultTemplate from './template/template.json';
import templateConfig from './template/config.json';
import PlanApp from './page/PlanApp';
import './validator';
import './save/save';

/**
 * 该页面为使用规划工具依赖的demo
 * @author tuonian
 * @date 2021/1/7
 */
export default class App extends PlanApp {
  /**
   * 返回config.json的数据
   */
  protected loadConfig(): Array<any> {
    return templateConfig;
  }

  protected async loadData(url: string): Promise<any> {
    const noSuffixUrl = url.replace('.json', '');
    // @ts-ignore
    const data = await import(`./template/${noSuffixUrl}.json`);
    return data.default || data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async loadTemplate(url: string): Promise<any> {
    return defaultTemplate;
  }
}
