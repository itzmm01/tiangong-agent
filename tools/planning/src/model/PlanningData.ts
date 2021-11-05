/**
 * 规划数据的总体结构
 */

export interface PlanningData {
  common?: any;
  host?: any;
  param?: any;
  service?: Array<any>;
  topology?: Array<any>;
  summary?: any;
}
