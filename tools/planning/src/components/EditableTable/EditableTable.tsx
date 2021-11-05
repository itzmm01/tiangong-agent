import React, { createRef, RefObject } from 'react';
import { Spin, Table } from 'antd';
import { EditableRow } from './EditableRow';
import { EditableCell } from './EditableCell';
import { TableHeaderCell } from './TableHeaderCell';
import { ColumnModel } from '../../model/ColumnModel';
import './style.css';

/**
 * @author tuonian
 * @date 2020/12/7
 */

interface EditableTableProps {
  columns: Array<any>;
  dataSource: Array<any>;
  onChange: (value: any) => void;
  onRow?: any;
  maxHeight?: number;
}

interface EditableTableState {
  isLoading: boolean;
}

export class EditableTable extends React.Component<EditableTableProps, EditableTableState> {
  // static getDerivedStateFromProps(nextProps: EditableTableProps, {  }: EditableTableState) {
  //   console.log('next',nextProps.dataSource)
  // }

  private rowFormRef: Array<RefObject<EditableRow>> = [];
  // timestamp = new Date().getTime();
  public constructor(props: EditableTableProps) {
    super(props);
    this.state = {
      isLoading: true,
    };
  }

  public componentDidMount() {
    setTimeout(() => this.setState({ isLoading: false }), 10);
  }

  // 编辑单元格并且保存
  public cellSave = (row: any) => {
    const newData = [...this.props.dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    if (this.props.onChange) {
      this.props.onChange(newData);
    }
  };

  /**
   * 批量编辑
   * @param column
   * @param data
   * @param rows
   * @param childColumn
   */
  public onRowBatchEdit(column: ColumnModel, data: any, rows: Array<number>, childColumn: ColumnModel) {
    const changeData: any = {};
    if (childColumn) {
      changeData[childColumn.dataIndex] = data;
    } else {
      changeData[column.dataIndex] = data;
    }
    const fieldsJson = JSON.stringify(changeData);
    // console.log('onRowBatchEdit=>', rows);
    // console.log('onRowBatchEdit changeData=>', changeData);
    this.rowFormRef
      .map((ref) => ref.current)
      .forEach((current) => {
        if (current && rows.indexOf(current.props.index) > -1) {
          current.setFieldValues(column, JSON.parse(fieldsJson), childColumn);
        }
      });
  }

  public onRow(record: any, index?: number) {
    const ref: RefObject<EditableRow> = createRef();
    this.rowFormRef.push(ref);
    const parentRow = this.props.onRow || {};
    return {
      record,
      index,
      ref,
      ...parentRow,
      allData: this.props.dataSource,
    };
  }

  public onSubmit = () => {
    const refArr = this.rowFormRef;
    return new Promise(async (resolve, reject) => {
      const rowData = [];
      try {
        for (const ref of refArr) {
          if (ref.current) {
            const data = await ref.current.validateFields();
            rowData.push(data);
          }
        }
        resolve(rowData);
      } catch (e) {
        reject(e);
      }
    });
  };

  public render() {
    let height = 200;
    if (this.props.maxHeight) {
      height = this.props.maxHeight;
    }
    if (this.state.isLoading) {
      return (
        <div style={{ minHeight: height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin tip={'正在加载，请稍后...'} />
        </div>
      );
    }
    return this.renderTable();
  }

  public renderTable() {
    const { dataSource, columns } = this.props;
    const columnList = columns.map((col, index) => {
      if (!col.type) {
        return col;
      }
      const copyCol = { ...col, dataIndex: col.dataIndex || col.key };
      return {
        ...copyCol,
        onCell: (record: any) => ({
          record,
          type: col.type,
          dataIndex: col.dataIndex || col.key,
          title: col.title,
          ruleType: col.ruleType,
          cellSave: this.cellSave,
          value: col.value || [],
          option: col.option,
          indexArr: col.items,
          column: { ...copyCol, isTable: true },
          allData: this.props.dataSource,
        }),
        onHeaderCell: (column: any) => ({
          column: copyCol,
          addBtn: column.addBrn || false,
          colIndex: index,
          indexArr: col.items,
          rowSize: dataSource.length,
          editable: col.editable === undefined || col.editable,
          onRowValueChange: this.onRowBatchEdit.bind(this),
          allData: this.props.dataSource,
        }),
      };
    });

    const components = {
      body: {
        row: EditableRow,
        cell: EditableCell,
      },
      header: {
        cell: TableHeaderCell,
      },
    };
    const width = columns.length * 160 + 200;
    const scroll: any = { x: width };
    if (this.props.maxHeight) {
      scroll.y = this.props.maxHeight - 80;
    }
    this.rowFormRef = [];
    return (
      <div className="editableTable">
        <Table
          // @ts-ignore
          components={components}
          bordered
          columns={columnList}
          dataSource={dataSource}
          pagination={false}
          scroll={scroll}
          rowClassName="editable-row"
          onRow={this.onRow.bind(this)}
        />
      </div>
    );
  }
}
