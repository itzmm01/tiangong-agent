import React from 'react';
import { Alert, Button, notification, Table } from 'antd';
import { TemplateModel } from '../model/TemplateModel';
import { ColumnModel } from '../model/ColumnModel';
import IPageProps from '../interface/IPageProps';
import { isNull } from '../utils/paramRules';
/**
 * @author tuonian
 * @date 2021/1/27
 */

interface ServiceProps extends IPageProps {
  config: TemplateModel;
  data?: Array<any>;
  maxHeight: number;
}
interface ServiceState {
  dataSource: any;
  columns: Array<ColumnModel>;
  selectedRowKeys: Array<string>;
  description?: string;
  pageKey: string;
}

/**
 * 服务选择界面
 */
export default class ServicePage extends React.Component<ServiceProps, ServiceState> {
  /**
   * 不用管模板，数据，更新数据，模板，一定重新创建了组件
   * @param nextProps
   * @param prevData
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-empty-pattern
  public static getDerivedStateFromProps(nextProps: ServiceProps, {}: ServiceState) {
    return null;
  }

  public constructor(props: ServiceProps) {
    super(props);

    const { config } = props.config;
    const result = this.init(config.customConfig, props.data || []);

    this.state = {
      dataSource: result.customConfig,
      columns: config.basicConfig,
      pageKey: props.config.page,
      // @ts-ignore
      selectedRowKeys: result.selectedRowKeys,
      description: props.config.description,
    };
  }

  // 初始化表格
  public init(customConfig: Array<any>, checkData: Array<any>) {
    const selectedRowKeys: Array<any> = [];

    const selectedMap: any = {};
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (checkData && checkData.length) {
      checkData.forEach((item) => {
        const serviceKey = item.key || item.name;
        const checked = item.select;
        if (!isNull(checked)) {
          selectedMap[serviceKey] = checked;
        }
      });
    } else {
      customConfig.forEach((item) => {
        const checked = item.select;
        const serviceKey = item.key || item.name;
        if (!isNull(checked)) {
          selectedMap[serviceKey] = checked;
        }
      });
    }
    // 初始化一级数组key值
    // 表数据源
    const config = customConfig.map((element) => {
      const newElement = { ...element };
      if (!newElement.key || !newElement.key.length) {
        newElement.key = element.name;
      }
      const serviceKey = newElement.key;
      const checked = selectedMap[serviceKey];
      if (isNull(checked) || element.disabled) {
        if (newElement.select) {
          selectedRowKeys.push(serviceKey);
        }
      } else {
        if (checked) {
          selectedRowKeys.push(serviceKey);
        }
        newElement.select = checked;
        if (newElement.children) {
          newElement.children = element.children.map((child: any) => ({ ...child, select: checked }));
        }
      }
      return newElement;
    });
    return {
      selectedRowKeys,
      customConfig: config,
    };
  }

  // 下一步提交事件
  public async handleSubmit() {
    // 表格数据必须要有一行选中数据，则可以提交下一步
    const { selectedRowKeys, pageKey, dataSource } = this.state;
    if (selectedRowKeys.length >= 1) {
      this.props.onSubmit(pageKey, [...dataSource]);
    } else {
      notification.error({
        message: '错误',
        description: '请勾选服务配置',
      });
    }
  }

  // 勾选事件
  public onSelectChange = (selectedRowKeys: Array<any>) => {
    console.log('selectedRowKeys changed: ', selectedRowKeys);
    // @ts-ignore
    this.setState({ selectedRowKeys });
  };
  // 勾选触发获取整行数据
  public onSelect = (record: any, selected: boolean) => {
    // 勾选设置datasource值
    const newData = record;
    if (newData.children && newData.children.length > 0) {
      newData.children = newData.children.map((child: any) => ({ ...child, select: selected }));
    }
    newData.select = selected;
  };

  public render() {
    const { selectedRowKeys, dataSource, description } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      columnTitle: '选择状态',
      columnWidth: 100,
      checkStrictly: false,
      onSelect: this.onSelect,
      getCheckboxProps: (record: any) => ({
        defaultChecked: selectedRowKeys.includes(`${record.id}`),
        disabled: record.disabled === true,
      }),
    };
    const expandable = {
      defaultExpandAllRows: false,
      rowExpandable: () => false,
      expandRowByClick: false,
      expandIcon: () => '',
    };
    const columns = this.state.columns.map((item) => ({ ...item, dataIndex: item.key || item.dataIndex }));
    return (
      <>
        {description && (
          <Alert
            message={description}
            type="info"
            showIcon
            closable
            style={{ marginTop: '30px', marginBottom: '0px', width: '60%' }}
          />
        )}
        <Table
          columns={columns}
          className="full-table"
          rowSelection={rowSelection}
          dataSource={dataSource}
          pagination={false}
          expandable={expandable}
          scroll={{ y: '99%' }}
        />
        <div style={{ marginTop: 10 }}>
          {this.props.showCancelBtn ? (
            <Button type="ghost" htmlType="button" onClick={this.props.onCancel}>
              返回上一步
            </Button>
          ) : undefined}
          <Button onClick={this.handleSubmit.bind(this)} type="primary" style={{ marginLeft: 20 }}>
            保存并下一步
          </Button>
        </div>
      </>
    );
  }
}
