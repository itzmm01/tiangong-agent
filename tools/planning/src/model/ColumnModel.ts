/**
 *  "title": "主机分组",
 *   "dataIndex": "hostGroup",
 *     "type": "array",
 *     "width": 200
 *  @property isHostLabel 是否为主机标签
 *  @property isTable 是否为表格
 */
export interface ColumnModel {
  dataIndex: string;
  items: Array<any>;
  option: Array<any>;
  type: string;
  title?: string;
  name?: string;
  key: string;
  ruleType?: string;
  width?: number;
  required?: boolean;
  'min-value'?: number;
  'max-value'?: number;
  multiple?: boolean;
  value?: any;
  description?: string;
  display?: boolean;
  cascade?: any;
  placeholder?: string;
  isHostLabel?: boolean;
  isTable?: boolean;
  mode?: 'multiple' | 'tags';
  pattern?: string;
  disabled?: boolean;
}
