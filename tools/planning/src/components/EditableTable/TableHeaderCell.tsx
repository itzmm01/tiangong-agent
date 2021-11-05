import React from 'react';
import { EditOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Checkbox, Divider, Form, InputNumber, Modal, Tooltip } from 'antd';
import { AutoTypeInput } from '../FormInput/AutoTypeInput';
import { ColumnModel } from '../../model/ColumnModel';
import { FormInstance } from 'antd/es/form';
import { DataValidator } from '../../utils/validator';
import EventBus, { EventType } from '../Events';

/**
 * @author tuonian
 * @date 2020/12/7
 */

interface HeaderCellProps {
  addBtn: Boolean;
  colIndex: number;
  children: Array<any>;
  className: string;
  colSpan?: number;
  rowSpan?: number;
  style: any;
  column: ColumnModel;
  rowSize: number; // 行数
  indexArr: Array<any>;
  editable: boolean;
  onRowValueChange: (column: ColumnModel, value: any, rows: Array<number>, childColumn?: ColumnModel) => void;
}

interface TableHeaderCellState {
  editorShow: boolean;
  editModel: any;
  checkedAll: boolean;
  rowList: Array<any>;
  indeterminate: boolean;
  editColumn: ColumnModel;
  editChild: boolean;
  startNum: number;
  endNum: number;
  prevRowSize: number;
  visibleMap: any;
}

export class TableHeaderCell extends React.Component<HeaderCellProps, TableHeaderCellState> {
  /**
   * 如果 props里的内容对state有影响，需要判断是否有变更
   * @param nextProps
   * @param prevState
   */
  public static getDerivedStateFromProps(nextProps: HeaderCellProps, prevState: TableHeaderCellState) {
    const newState: any = { prevRowSize: nextProps.rowSize };
    if (prevState.prevRowSize !== nextProps.rowSize) {
      const rowList: Array<any> = [];
      for (let i = 0; i < nextProps.rowSize; i++) {
        rowList.push(i);
      }
      if (prevState.checkedAll) {
        newState.rows = rowList.concat([]);
      }
      newState.rowList = rowList;
      newState.endNum = rowList.length;
    }
    return newState;
  }

  private formRef: React.RefObject<FormInstance> = React.createRef();

  public constructor(props: HeaderCellProps) {
    super(props);
    const rowList = [];
    for (let i = 0; i < props.rowSize; i++) {
      rowList.push(i);
    }

    this.state = {
      editorShow: false,
      editModel: {},
      checkedAll: true,
      rowList,
      indeterminate: false,
      editColumn: props.column,
      editChild: false,
      startNum: 1,
      endNum: rowList.length,
      prevRowSize: props.rowSize,
      visibleMap: {},
    };
  }

  public render() {
    const { children, colSpan, rowSpan, className, style, indexArr = [], editable, column } = this.props;
    const hasMoreChild = indexArr && indexArr.length > 1;
    return (
      <th rowSpan={rowSpan} className={className} style={style} colSpan={colSpan}>
        <div className="headerCellGroupContainer">
          <span className="headerCellTitle">
            {this.renderHeaderTitle(children, column)}
            {this.renderPasswordSwitch(column)}
            {editable ? (
              <EditOutlined onClick={this.onEditClick.bind(this, column, false)} className="editIcon" />
            ) : undefined}
          </span>
          {hasMoreChild ? (
            <div className="headerCellGroup">
              {indexArr.map((item: any) => (
                <span key={item.key} className={`childCell ${item.type}`}>
                  {item.title}
                  {editable ? (
                    <EditOutlined onClick={this.onEditClick.bind(this, item, true)} className="editIcon" />
                  ) : undefined}
                </span>
              ))}
              <span className="childCell op-btn">操作</span>
            </div>
          ) : undefined}
        </div>
        {column ? this.renderModalForm() : undefined}
      </th>
    );
  }

  public onSubmit(values: any) {
    const { column } = this.props;
    const { editColumn, editChild, startNum, endNum } = this.state;

    const rows = [];
    for (let i = startNum; i <= endNum; i++) {
      rows.push(i - 1);
    }
    if (editChild && this.props.onRowValueChange) {
      const value = values[`${column.dataIndex}.${editColumn.dataIndex}`];
      this.props.onRowValueChange(column, value, rows, editColumn);
    } else if (this.props.onRowValueChange) {
      const value = values[column.dataIndex];
      this.props.onRowValueChange(column, value, rows);
    }
    console.log('values=>', values, rows);
    this.setState({ editorShow: false });
  }
  protected renderHeaderTitle(children: any, column: ColumnModel) {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (column && column.description && column.description.length) {
      return <Tooltip overlay={<span dangerouslySetInnerHTML={{ __html: column.description }} />}>{children}</Tooltip>;
    }
    return children;
  }

  protected renderPasswordSwitch(item: ColumnModel) {
    if (!item || 'password' !== item.type) {
      return null;
    }
    const { visibleMap } = this.state;
    const visible = visibleMap[item.key];
    return (
      <span style={{ marginLeft: 10, cursor: 'pointer' }} onClick={() => this.onSwitchPasswordVisible(item)}>
        {visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
      </span>
    );
  }
  protected renderModalForm() {
    const { editColumn } = this.state;
    const { rowList, checkedAll, indeterminate, startNum, endNum, editChild } = this.state;
    let fieldName = this.props.column.dataIndex;
    if (editChild) {
      fieldName = `${fieldName}.${editColumn.dataIndex}`;
    }
    const columnItems = editColumn.items ? editColumn.items : [];

    return (
      <Modal
        visible={this.state.editorShow}
        title="批量修改"
        okText="提交"
        cancelText="取消"
        width={630}
        onCancel={() => this.setState({ editorShow: false })}
        onOk={() =>
          // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
          this.formRef.current && this.formRef.current.validateFields().then((values) => this.onSubmit(values))
        }
      >
        <Form ref={this.formRef} name="rowEdit">
          <div className="edit-header" style={{ display: columnItems.length ? 'flex' : 'none' }}>
            {columnItems.map((item) => (
              <span key={item.key}>{item.title}</span>
            ))}
          </div>

          <Form.Item
            rules={[{ validator: this.validator.bind(this) }]}
            name={fieldName}
            className="batch-edit-form-item"
            label={editColumn.title}
          >
            <AutoTypeInput
              column={editColumn}
              renderHeader={false}
              // onSave={this.onSaveData.bind(this)}
              onSave={() => undefined}
              type={editColumn.type}
            />
          </Form.Item>
          <Divider />
          <div className="flex-form-item">
            <Form.Item label="修改序号" style={{ minWidth: 130 }}>
              <Checkbox onChange={this.onCheckAll.bind(this)} indeterminate={indeterminate} checked={checkedAll}>
                全选
              </Checkbox>
            </Form.Item>

            <Form.Item label="起始序号">
              <InputNumber
                min={1}
                value={startNum}
                onChange={(value) => this.onOrderNumChange(true, value)}
                max={rowList.length}
                type="number"
              />
            </Form.Item>

            <Form.Item style={{ marginLeft: 10 }} label="截止序号">
              <InputNumber
                min={startNum}
                max={rowList.length}
                value={endNum}
                onChange={(value) => this.onOrderNumChange(false, value)}
                type="number"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    );
  }
  private onSaveData(data: any) {
    const editModel: any = {};
    const { column } = this.props;
    const { editChild, editColumn } = this.state;
    if (editChild) {
      const key = `${column.dataIndex}.${editColumn.dataIndex}`;
      if (data) {
        editModel[key] = data[editColumn.dataIndex];
      } else {
        editModel[key] = undefined;
      }
    } else {
      if (data) {
        Object.assign(editModel, data);
      } else {
        editModel[editColumn.dataIndex] = undefined;
      }
    }
    this.setState({ editModel });
  }
  private onOrderNumChange(start: boolean, value: any) {
    const { rowList, startNum, endNum } = this.state;
    if (isNaN(value)) {
      // eslint-disable-next-line no-param-reassign
      value = start ? 1 : rowList.length;
    }
    let sNum = startNum;
    let eNum = endNum;
    if (start) {
      sNum = value;
      if (sNum > eNum) {
        sNum = startNum;
      }
    } else {
      eNum = value;
      if (eNum < sNum) {
        eNum = endNum;
      }
    }
    const checkedAll = eNum - sNum + 1 === rowList.length;
    const indeterminate = !checkedAll && eNum - sNum + 1 > 0;
    this.setState({
      checkedAll,
      indeterminate,
      startNum: sNum,
      endNum: eNum,
    });
  }

  private onCheckAll(e: any) {
    const { checked } = e.target;
    const { rowList } = this.state;
    this.setState({
      checkedAll: checked,
      indeterminate: false,
      startNum: 1,
      endNum: rowList.length,
    });
  }

  private onSwitchPasswordVisible(item: ColumnModel) {
    const visible = !this.state.visibleMap[item.key];
    const nVisMap = { ...this.state.visibleMap };
    nVisMap[item.key] = visible;
    this.setState({ visibleMap: nVisMap });
    EventBus.emit(EventType.HOST_PWD_SWITCH, item, visible);
  }

  private validator(rule: any, value: any) {
    try {
      DataValidator(value, this.state.editChild ? this.state.editColumn : this.props.column);
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.resolve();
  }

  private onEditClick(column: ColumnModel, editChild: boolean) {
    this.setState({
      editorShow: true,
      editColumn: column,
      editChild,
    });
  }
}
