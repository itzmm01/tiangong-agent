/**
 * 配置的模板数据结构
 */
import { ColumnModel } from './ColumnModel';

export interface FormTemplateModel {

  page: string,
  config: Array<ColumnModel>
}
