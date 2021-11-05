/**
 * 配置的模板数据结构
 */
import { TemplateConfig } from './TemplateConfig';

export interface TemplateModel {
  page: string;
  config: TemplateConfig;
  template?: any;
  description?: string;
}
