import { ColumnModel } from './ColumnModel';


export interface GroupParamColumnModel {

  'param-group': string,
  'param-items': Array<ColumnModel>,
  orientation?: 'left' | 'center' | 'right'

}
