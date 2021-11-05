import React from 'react';
import { Alert, Button, Checkbox, notification, Table } from 'antd';
import { TemplateModel } from '../model/TemplateModel';
import IPageProps from '../interface/IPageProps';
import { hasLength } from '../utils/util';
import { SettingsConfig } from '../model/SettingsConfig';

const { Column, ColumnGroup } = Table;
/**
 * @author tuonian
 * @date 2021/3/3
 */

interface TopologyProps extends IPageProps {
  data: any;
  templateConfig: TemplateModel;
  maxHeight: number;
  settings: SettingsConfig;
}
interface TopologyState {
  prevValue?: any;
  page: string;
  data: Array<any>;
  checkedAll: Array<any>;
  serviceCheckedMap: any;
  serviceList: Array<any>;
}

export class TopologyPage extends React.Component<TopologyProps, TopologyState> {
  /**
   * 需要确定单一的数据来源更改，否则处理起来会很麻烦
   * @param nextProps
   * @param prevValue
   * @returns {{prevValue: *}|null}
   */
  public static getDerivedStateFromProps(nextProps: TopologyProps, { prevValue }: TopologyState) {
    const newState: any = { prevValue: nextProps.data };
    // 如果上层组件传递过来的数据没有任何变化，则不需要更新
    if (prevValue === nextProps.data) {
      return null;
    }

    const templateConfig = nextProps.templateConfig || {};
    const { settings } = nextProps;

    const page = templateConfig.page || 'topology';
    const copyData = JSON.parse(JSON.stringify(nextProps));
    const {
      data: { host, service },
    } = copyData;
    const currentData = nextProps.data[page] || [];
    if (hasLength(host) && service && service.length) {
      const dataIndex = settings.hostLabelKey || 'inner-ip';
      const originColumnMap: any = {};
      currentData.forEach((item: any) => {
        originColumnMap[item[dataIndex]] = { ...item };
      });

      let serviceCount = 0;
      const serviceList: Array<any> = [];
      // 过滤掉未勾选数据，默认为未选择
      let serviceArr = service
        .filter((item: any) => item.select && (!item.children || item.children.length))
        .map((item: any) => {
          const newItem = item;
          if (newItem.children) {
            newItem.children = newItem.children
              .filter((child: any) => !!child.select)
              .map((child: any) => {
                serviceCount = serviceCount + 1;
                serviceList.push(child.name);
                return { ...child, select: false };
              });
          } else {
            serviceCount = serviceCount + 1;
            serviceList.push(newItem.name);
          }
          return { ...newItem, select: false };
        });

      if (!serviceArr) {
        serviceArr = [];
      }

      console.log('serviceCount=>', serviceCount);

      const hostArr: Array<any> = [];
      const serviceCheckedHostMap: any = {};

      host.forEach((item: any, index: number) => {
        const value = item[dataIndex];

        let hostItem = originColumnMap[value];
        if (!hostItem) {
          hostItem = { key: `N${index + 1}`, 'inner-ip': item['inner-ip'] };
        }
        if (!hostItem['inner-ip']) {
          hostItem['inner-ip'] = item['inner-ip'];
        }
        if (!hostItem[dataIndex]) {
          hostItem[dataIndex] = item[dataIndex];
        }

        const prevSelectArr = hostItem.selectArr;
        if (!prevSelectArr || prevSelectArr.length === 0 || serviceArr.length === 0) {
          hostItem.selectArr = [...serviceArr];
        } else {
          const selectMap: any = {};
          prevSelectArr.forEach((selectItem: any) => {
            if (selectItem.select) {
              selectMap[selectItem.name] = true;
            }
            if (selectItem.children) {
              selectItem.children.forEach((child: any) => {
                if (child.select) {
                  selectMap[child.name] = true;
                }
              });
            }
          });

          hostItem.selectArr = serviceArr.map((item: any) => {
            const oldSelect = !!selectMap[item.name] || false;
            const newItem = { ...item };
            if (newItem.children) {
              newItem.children = newItem.children.map((child: any) => {
                const childSelect = !!selectMap[child.name] || false;

                if (childSelect) {
                  const checkedArr = serviceCheckedHostMap[child.name] || [];
                  checkedArr.push(hostItem.key);
                  serviceCheckedHostMap[child.name] = checkedArr;
                }
                return { ...child, select: childSelect };
              });
            } else if (oldSelect) {
              const checkedArr = serviceCheckedHostMap[item.name] || [];
              checkedArr.push(hostItem.key);
              serviceCheckedHostMap[item.name] = checkedArr;
            }
            newItem.select = oldSelect;
            return newItem;
          });
        }
        hostArr.push(hostItem);
      });
      const checkedAll = Object.keys(serviceCheckedHostMap).filter((item) => {
        const checkedHostArr = serviceCheckedHostMap[item] || [];
        return checkedHostArr.length === hostArr.length;
      });
      newState.data = hostArr;
      newState.checkedAll = checkedAll;
      newState.serviceCheckedMap = serviceCheckedHostMap;
      newState.serviceList = serviceList;
    }
    return newState;
  }
  public constructor(props: TopologyProps) {
    super(props);
    this.state = {
      page: props.templateConfig.page,
      data: [],
      prevValue: [],
      checkedAll: [],
      serviceCheckedMap: {}, // 每个服务勾选的主机列表
      serviceList: [],
    };
  }

  public async onChangeAll(e: any) {
    // debugger
    const { data } = this.state;
    const { checked, name } = e.target;
    const newData = data.map((serviceItem) => {
      const newService = { ...serviceItem };
      newService.selectArr = newService.selectArr.map((item: any) => {
        const newItem = { ...item };
        newItem.name === name && (newItem.select = checked);
        if (newItem.children) {
          newItem.children = newItem.children.map((child: any) => {
            const newChild = { ...child };
            if (newChild.name === name) {
              newChild.select = checked;
            }
            return newChild;
          });
        }
        return newItem;
      });

      return newService;
    });

    this.setState({
      ...this.checkedAllAndMap(newData),
      data: newData,
    });
  }

  // 勾选checkbox触发事件，保存勾选的值
  public async onChange(e: any) {
    const { data } = this.state;
    const { checked, index, name } = e.target;
    const indexData = JSON.parse(JSON.stringify(data[index]));
    indexData.selectArr = indexData.selectArr.map((item: any) => {
      const newItem = item;
      if (newItem.name === name) {
        newItem.select = checked;
      }
      if (newItem.children) {
        newItem.children = newItem.children.map((child: any) => {
          const newChild = child;
          if (newChild.name === name) {
            newChild.select = checked;
          }
          return newChild;
        });
      }
      return newItem;
    });
    data[index] = indexData;
    this.setState({
      data: data.concat([]),
      ...this.checkedAllAndMap(data),
    });
  }

  public checkedAllAndMap(newData: Array<any>) {
    const serviceSelMap: any = {};
    newData.forEach(({ selectArr }) => {
      selectArr.forEach((item: any) => {
        if (item && hasLength(item.children)) {
          item.children.forEach((child: any) => {
            const arr = serviceSelMap[child.name] || [];
            serviceSelMap[child.name] = arr;
            if (child.select) {
              arr.push(child.name);
            }
          });
        } else {
          const arr = serviceSelMap[item.name] || [];
          serviceSelMap[item.name] = arr;
          if (item.select) {
            arr.push(item.name);
          }
        }
      });
    });

    const checkedAllService: Array<any> = [];
    const hostSize = newData.length;
    Object.keys(serviceSelMap).forEach((name) => {
      const arr = serviceSelMap[name] || [];
      if (arr.length === hostSize) {
        checkedAllService.push(name);
      }
    });
    return {
      checkedAll: checkedAllService,
      serviceCheckedMap: serviceSelMap, // 每个服务勾选的主机列表
    };
  }

  // 下一步数据提交
  public async handleSubmit() {
    // 表格数据必须要有一行选中数据，则可以提交下一步
    const { page, data, serviceCheckedMap, serviceList } = this.state;
    const result = true;
    try {
      console.log('serviceCheckedMap=>', serviceCheckedMap);
      serviceList.forEach((serviceName) => {
        const selectHostArr = serviceCheckedMap[serviceName] || [];
        if (selectHostArr.length === 0) {
          const errMsg = `请勾选"${serviceName}"的配置`;
          notification.error({
            message: '错误',
            description: errMsg,
          });
          throw new Error(errMsg);
        }
      });
      result && this.props.onSubmit(page, data);
    } catch (e) {}
  }

  public render() {
    const { data, checkedAll } = this.state;
    const firstColumn = this.props.settings.hostColumn;
    const { templateConfig } = this.props;
    const { description } = templateConfig;
    return (
      <>
        {description && (
          <Alert
            message={description}
            type="info"
            showIcon
            closable={true}
            style={{ marginTop: '10px', marginBottom: '10px', width: '100%' }}
          />
        )}
        <Table dataSource={data} className="full-table" scroll={{ y: '100%' }} pagination={false} bordered={true}>
          <Column title={firstColumn.title} dataIndex={firstColumn.key} key={firstColumn.key} />
          {data.length > 0 &&
            data[0].selectArr.map((item: any, itx: number) =>
              item.children ? (
                <ColumnGroup title={item.name} align="center" key="item.name">
                  {item.children.map((itm: any, idx: number) => (
                    <Column
                      title={itm.name}
                      dataIndex={itm.name}
                      key={itm.name}
                      render={(text, record: any, index) => (
                        <Checkbox
                          checked={record.selectArr[itx].children[idx].select}
                          // @ts-ignore
                          record={record}
                          index={index}
                          name={itm.name}
                          onChange={this.onChange.bind(this)}
                        />
                      )}
                      filterDropdown={() => (
                        <div style={{ padding: '15px 10px' }} key={itm.name}>
                          <Checkbox
                            checked={checkedAll.indexOf(itm.name) > -1}
                            onChange={this.onChangeAll.bind(this)}
                            name={itm.name}
                            // @ts-ignore
                            index={checkedAll}
                          >
                            勾选全部
                          </Checkbox>
                        </div>
                      )}
                    />
                  ))}
                </ColumnGroup>
              ) : (
                <Column
                  title={item.name}
                  dataIndex={item.name}
                  key={item.name}
                  render={(text, record: any, index) => (
                    <Checkbox
                      checked={record.selectArr[itx].select}
                      // @ts-ignore
                      record={record}
                      index={index}
                      key={index}
                      name={item.name}
                      onChange={this.onChange.bind(this)}
                    />
                  )}
                  filterDropdown={() => (
                    <div style={{ padding: '15px 10px' }} key={item.name} id={item.name}>
                      <Checkbox
                        onChange={this.onChangeAll.bind(this)}
                        name={item.name}
                        // @ts-ignore
                        index={checkedAll}
                        checked={checkedAll.indexOf(item.name) > -1}
                      >
                        勾选全部
                      </Checkbox>
                    </div>
                  )}
                />
              ),
            )}
        </Table>
        <div style={{ marginTop: 20 }}>
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
