import { TemplateModel } from './TemplateModel';

/**
 * 规划步骤
 */
export interface PlanStepModel {
  title: string;
  content: string;
  key: string;
  config: TemplateModel;
}
