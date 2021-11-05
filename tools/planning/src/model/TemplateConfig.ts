import { ColumnModel } from './ColumnModel';

export interface TemplateConfig {
  pageTitle?: string;
  basicConfig: Array<ColumnModel>;
  customConfig: Array<any>;
}
