// @ts-ignore
import React, { RefObject } from 'react';
import { ColumnModel } from '../../model/ColumnModel';
import { AutoTypeFormItem } from '../FormInput/AutoTypeFormItem';
import { EditableContext } from './EditableContext';
const { Consumer } = EditableContext;
/**
 * @author tuonian
 * @date 2020/12/7
 */

interface Props {
  title: string;
  type: string;
  children: any;
  indexArr: Array<any>;
  record: any;
  ruleType: string;
  value: any;
  option: Array<any>;
  cellSave: Function;
  column: ColumnModel;
  allData: Array<any>;
}

interface State {
  rowData: any;
}

/**
 *只要是这里面调用cellSave刷新，那么一定会出发重新渲染。
 *这里会存在一点性能问题
 */
export class EditableCell extends React.Component<Props, State> {
  public static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    if (nextProps.record !== prevState.rowData) {
      return { rowData: nextProps.record };
    }
    return null;
  }

  public constructor(props: Props) {
    super(props);
    this.state = {
      rowData: props.record,
    };
  }

  public onChangeValue(newValue: any) {
    const newRowData = { ...this.state.rowData };
    const { column } = this.props;
    const dataIndex = column.key || column.dataIndex;
    newRowData[dataIndex] = newValue;
    this.props.cellSave(newRowData);
  }

  public render() {
    const inputRef: RefObject<any> = React.createRef<any>();

    const { children, type, ruleType, column, allData } = this.props;
    const { rowData } = this.state;

    let childNode = children || [];

    if (type) {
      const value = rowData[column.dataIndex];
      childNode = (
        <Consumer
          children={(context) => (
            <AutoTypeFormItem
              type={column.type}
              column={this.props.column}
              ruleType={ruleType}
              defaultValue={value}
              onSave={context.onRowDataChange}
              allData={allData}
              inputRef={inputRef}
            />
          )}
        />
      );
    }

    const domProps = {
      ...this.props,
      cellSave: undefined,
      indexArr: undefined,
      ruleType: undefined,
      dataIndex: undefined,
      allData: undefined,
    };
    delete domProps.cellSave;
    delete domProps.indexArr;
    delete domProps.ruleType;
    delete domProps.dataIndex;
    delete domProps.allData;
    return <td {...domProps}>{childNode}</td>;
  }
}
