import React, { createRef, RefObject } from 'react';
import { TemplateConfig } from '../model/TemplateConfig';
import { Button, notification, Space } from 'antd';
import { EditableTable } from '../components';
import { checkPlanningData } from '../utils/PlanningUtils';
import { uniqueKey } from '../utils/util';

/**
 * @author tuonian
 * @date 2020/12/16
 */
interface HostProps {
  data: Array<any>;
  config: TemplateConfig;
  onSubmit: (data: any) => void;
  current: number;
  onCancel: () => void;
  showCancelBtn?: boolean;
  maxHeight?: number;
}

interface HostState {
  data: Array<any>;
  columns: Array<any>;
  prevData: Array<any>;
  prevConfig?: TemplateConfig;
}

/**
 * 主机的配置界面
 */
export class HostPage extends React.Component<HostProps, HostState> {
  public static getDerivedStateFromProps(nextProps: HostProps, { prevData, prevConfig }: HostState) {
    const newState: any = {
      prevData: nextProps.data,
      prevConfig: nextProps.config,
    };

    let customData: Array<any> = [];

    if (prevConfig === null || prevConfig !== nextProps.config) {
      const { config } = nextProps;
      const customConfig = config ? config.customConfig || [] : [];
      if (customConfig.length) {
        customData = [...customConfig];
      }
      if (config.basicConfig) {
        newState.columns = config.basicConfig;
      } else {
        newState.columns = [];
      }
      console.log('config=>', nextProps.config);
    }

    if (prevData === null || prevData !== nextProps.data) {
      const propsData = nextProps ? nextProps.data || [] : [];
      if (propsData.length) {
        newState.data = [...nextProps.data];
      } else {
        newState.data = customData;
      }
    }
    checkPlanningData(newState.data, nextProps.config.basicConfig);
    return newState;
  }

  private editableTableRef: RefObject<EditableTable> = createRef();

  public constructor(props: any) {
    super(props);
    this.state = {
      data: [],
      columns: [],
      prevConfig: undefined,
      prevData: [],
    };
  }

  /**
   * 每次变动都会更新，但是不需要setState,不需要重新引发渲染
   * 除非是增加行，批量修改行等操作
   * @param values
   */
  public onRowChangeValues(values: any) {
    const { data } = this.state;
    data.forEach((item) => {
      if (item.key === values.key) {
        Object.assign(item, values);
      }
    });
  }

  /**
   * 删除一行
   * @param key
   */
  public handleDelete = (key: string) => {
    const { data } = this.state;
    const result = data.filter((item: any) => item.key !== key);
    this.setState({
      data: result,
    });
  };

  /**
   * 新增一行
   */
  public handleAdd = async () => {
    const { data, columns } = this.state;
    // 初始化唯一key值
    const newData: any = {
      key: uniqueKey(),
    };
    // 新增行默认空值
    checkPlanningData(newData, columns);
    const newDataSource = [...data, newData];
    console.log('newData=>', newData);

    this.setState({
      data: newDataSource,
    });
  };
  // 复制一行
  public copyRows = async (data: any, index: number) => {
    const { data: dataList } = this.state;
    const copyData = JSON.parse(JSON.stringify(data));
    const newData = {
      ...copyData,
      key: uniqueKey(),
    };
    let list = dataList.slice(0, index);
    list.push(newData);
    list = list.concat(dataList.slice(index));

    this.setState({
      data: [...list],
    });
  };

  public onDataSourceChange(data: any) {
    this.setState({ data });
  }

  // 保存数据并下一步
  public handleSubmit() {
    // const { columns } = this.state;
    if (this.editableTableRef.current) {
      this.editableTableRef.current
        .onSubmit()
        .then((arr) => {
          console.log('HostPage[submit]', arr);
          // @ts-ignore
          if (!arr.length) {
            notification.error({
              message: '提示',
              description: '请添加主机信息！',
            });
            throw new Error('请添加主机信息!');
          }
          // columns.forEach((column: ColumnModel) => {
          //   DataValidator(undefined, column, arr);
          // });
          return arr;
        })
        .then((arr) => {
          console.log('HostPage[submit-2]', arr);
          // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
          this.props.onSubmit && this.props.onSubmit(arr);
        })
        .catch((e) => {
          console.log('HostPage[submit] fail ', e);
          let errMsg = '';
          if (!!e) {
            // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
            if (e.errorFields && e.errorFields.length) {
              errMsg = e.errorFields[0].errors.join(',');
            } else if (e.message) {
              errMsg = e.message;
            }
          }

          if (!errMsg || !errMsg.length) {
            errMsg = '数据填写有误，请核对后重试！';
          }
          notification.error({
            message: '错误',
            description: errMsg,
          });
        });
    }
  }

  public render() {
    const { data, columns } = this.state;
    const columnList = [
      {
        title: '序号',
        dataIndex: 'orderNum',
        width: 50,
        align: 'center',
        editable: false,
        fixed: 'left',
        render: (text: any, record: any, index: number) => (
          <Space size="middle">
            <span>{index + 1}</span>
          </Space>
        ),
      },
      ...columns,
      {
        title: '操作',
        dataIndex: 'operation',
        width: 100,
        fixed: 'right',
        editable: false,
        align: 'center',
        render: (text: string, record: any, index: number) => (
          <Space size="middle">
            <a href="#!" onClick={() => this.copyRows(record, index)} style={{ marginRight: 8 }}>
              复制
            </a>
            {data.length && (
              <a href="#!" onClick={() => this.handleDelete(record.key)}>
                删除
              </a>
            )}
          </Space>
        ),
      },
    ];
    return (
      <div className="planning-content">
        <Button
          onClick={this.handleAdd}
          type="primary"
          style={{
            marginBottom: 16,
            marginTop: 20,
            width: 90,
          }}
        >
          新增一行
        </Button>
        <EditableTable
          ref={this.editableTableRef}
          columns={columnList}
          dataSource={data}
          onChange={this.onDataSourceChange.bind(this)}
          maxHeight={this.props.maxHeight ? this.props.maxHeight - 120 : undefined}
          onRow={{ onValuesChange: this.onRowChangeValues.bind(this) }}
        />
        <div style={{ marginTop: 10, marginLeft: 20 }}>
          {this.props.showCancelBtn ? (
            <Button type="ghost" htmlType="button" onClick={this.props.onCancel}>
              返回上一步
            </Button>
          ) : undefined}
          <Button onClick={this.handleSubmit.bind(this)} type="primary" style={{ marginLeft: 20 }}>
            保存并下一步
          </Button>
        </div>
      </div>
    );
  }
}
