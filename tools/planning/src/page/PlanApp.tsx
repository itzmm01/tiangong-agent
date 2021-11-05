import React, { RefObject } from 'react';
import { PlanningPage } from './PlanningPage';
import { Button, Dropdown, Layout, Menu, message, Modal, notification } from 'antd';
import { CopyOutlined, DownOutlined } from '@ant-design/icons';
import { UploadDataButton, ExportJsonButton } from '../components';
import { PlanningInstance } from '../interface/PlanningInstance';
import '../style/App.css';
import { ColumnModel } from '../model/ColumnModel';

const { Header, Content, Footer } = Layout;
/**
 * @author tuonian
 * @date 2021/1/7
 */

interface AppProps {
  validator?: any;
}

interface AppState {
  data: any;
  template: Array<any>;
  checkedTemplate: string;
  showCodeModal: boolean;
  config: Array<any>;
}

export function parsePageSetting(template: Array<any>) {
  let pageSettings = { config: undefined };
  if (template && Array.isArray(template)) {
    pageSettings = template.find((item) => item.page === 'globalConfig' || item.page === 'setting');
  }
  if (!pageSettings || !pageSettings.config) {
    return {
      pageTitle: '配置规划工具',
    };
  }
  return pageSettings.config;
}

export default class PlanApp extends React.PureComponent<AppProps, AppState> {
  private planningRef: RefObject<PlanningInstance> = React.createRef();
  protected constructor(props: any) {
    super(props);
    const config = this.loadConfig() || [];
    this.state = {
      template: [],
      data: {},
      showCodeModal: false,
      config,
      checkedTemplate: config.length ? config[0].title : '可用模板',
    };
  }

  public render() {
    const { data, template, checkedTemplate } = this.state;
    console.log('tempalte=>', template);
    const pageSetting = parsePageSetting(template);
    console.log('[App] render', data);
    return (
      <div className="page-container">
        <Layout className="layout">
          {this.renderHeader(pageSetting)}
          {this.renderDropdown(template, checkedTemplate)}
          {this.renderContent(template, checkedTemplate, data)}
          {this.renderFooter()}
        </Layout>
      </div>
    );
  }
  public async componentDidMount() {
    message.loading({
      content: '正在加载，请稍后...',
      key: 'app_loading_data',
    });
    try {
      if (this.state.config.length) {
        const dataUrl = this.state.config[0].url;
        const template = await this.loadAndMergeTemplate('template.json');
        const data = await this.loadData(dataUrl);
        this.setState({
          data: JSON.parse(JSON.stringify(data)),
          template,
        });
      }
    } catch (e) {
      notification.warn({
        message: e.message || '数据加载失败，请检查数据文件！',
      });
    }
    // @ts-ignore
    message.destroy('app_loading_data');
  }
  /**
   * 加载config.json的数据，右上角的可用数据模板配置数据
   */
  protected loadConfig(): Array<any> {
    throw new Error('请返回config.json内容！');
  }

  /**
   * 加载渲染模板数据
   * @param url 渲染模板的名称，在config.json中配置的template字段
   */
  protected async loadTemplate(url: string): Promise<Array<any>> {
    throw new Error(`请实现该方法(loadTemplate)，返回渲染模板:(${url})数据信息！`);
  }

  /**
   * 加载数据模板的数据
   * @param url 数据模板的名称，在config.json中配置的url字段
   */
  protected async loadData(url: string) {
    throw new Error(`请实现该方法(loadData)，返回数据模板：${url}对应的数据信息！`);
  }

  /**
   * 主要为了解决dataIndex 和key混用的额问题，目前只有主机配置和服务配置等表格，为dataIndex
   * 需要补充添加key
   * @param url
   */
  protected async loadAndMergeTemplate(url: string) {
    const templates: Array<any> = await this.loadTemplate(url);
    if (Array.isArray(templates)) {
      try {
        templates
          .filter((item) => item.page === 'host' || item.page === 'service')
          .forEach((template) => {
            let columns = [];
            if (template.config) {
              columns = template.config.basicConfig || [];
            }
            columns.forEach((column: ColumnModel) => {
              const copyColumn = column;
              if (!copyColumn.key) {
                copyColumn.key = column.dataIndex;
              }
              if (column.items) {
                column.items.forEach((childColumn) => {
                  const copyChild = childColumn;
                  if (!copyChild.key) {
                    copyChild.key = childColumn.dataIndex;
                  }
                });
              }
            });
          });
      } catch (e) {
        console.error('loadAndMergeTemplate', e);
      }
    }
    return templates;
  }
  // 点击可选模板下拉选择
  protected handleMenuClick(e: { key: any }) {
    // console.log('handleMenuClick=>', e);
    const { config } = this.state;
    Modal.confirm({
      title: '警告',
      content: '确定要放弃当前修改的数据加载新的数据吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        const { key } = e;
        if (config.length > key) {
          const template = config[key];
          this.onLoadTemplateData(template);
        } else {
          console.error('数据模板数据有问题，请联系开发人员！');
        }
      },
    });
  }

  protected getData() {
    if (this.planningRef.current) {
      return this.planningRef.current.getData();
    }
    return {};
  }

  protected onLoadTemplateData(template: any) {
    message.loading({
      content: '正在加载数据，请耐心等待...',
      key: 'app_menu_data_loading',
    });
    const { title, url, template: tmp } = template;
    new Promise(async (resolve, reject) => {
      let templateData;
      let newData;
      try {
        templateData = await this.loadAndMergeTemplate(tmp);
        newData = await this.loadData(url);
      } catch (e) {
        console.error('onLoadTemplateData', tmp, url, e);
        reject(new Error('导入异常，请检查文件名是否正确及该文件是否为json文件!'));
        return;
      }
      const newState = {
        template: templateData,
        data: JSON.parse(JSON.stringify(newData)) || {},
        checkedTemplate: title,
      };
      resolve(newState);
    })
      .then((newState) => {
        // @ts-ignore
        this.setState(newState);
      })
      .catch((e) => {
        notification.error({
          description: e.message,
          message: '错误',
        });
      })
      .finally(() => {
        // @ts-ignore
        message.destroy('app_menu_data_loading');
      });
  }

  protected renderHeader(settings: any) {
    return (
      <Header key={`${new Date()}`}>
        <div className="logo" />
        <div>{settings.pageTitle}</div>
      </Header>
    );
  }

  protected renderDropdown(template: Array<any>, checkedTemplate: string) {
    return (
      <div className="importButton">
        <div style={{ margin: '0 10px 0 10px', display: 'inline-block' }}>
          <Dropdown overlay={() => this.initMenu()}>
            <Button>
              {checkedTemplate} <DownOutlined />
            </Button>
          </Dropdown>
        </div>
        <UploadDataButton
          // @ts-ignore
          onComplete={(data) => this.setState({ data, current: 0 })}
        />
        <ExportJsonButton style={{ margin: '0 20px 0 10px' }} getData={this.getData.bind(this)} />
      </div>
    );
  }

  protected renderContent(template: Array<any>, checkedTemplate: string, data: any) {
    return (
      <Content>
        <PlanningPage
          data={data}
          // @ts-ignore
          ref={this.planningRef}
          template={template}
        />
      </Content>
    );
  }

  protected renderFooter() {
    return (
      <Footer style={{ textAlign: 'center', marginTop: 10, padding: 10 }}>
        Tencent Cloud ©2020 All Rights Reserved.
      </Footer>
    );
  }
  protected renderMenu(items: Array<any>) {
    return (
      <Menu onClick={this.handleMenuClick.bind(this)}>
        {items.map((item, index) => (
          <Menu.Item key={index} icon={<CopyOutlined />}>
            {item.title}
          </Menu.Item>
        ))}
      </Menu>
    );
  }

  // 初始化可选模板下拉框
  protected initMenu() {
    const { config } = this.state;
    if (config && config.length > 0) {
      try {
        return this.renderMenu(config);
      } catch (e) {
        console.error('读取选择模板配置出错----------', e);
        notification.warn({
          message: '错误',
          description: '配置文件config.json内容有错误，请检查！',
        });
      }
    }
    return <Menu />;
  }
}
