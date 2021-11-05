/**
 * 配置的模板数据结构
 */
import { GroupParamColumnModel } from './GroupParamColumnModel';

export interface FormGroupConfigModel {

  page: string,
  config: Array<GroupParamColumnModel>
}
