import React from 'react';
import { Button, notification } from 'antd';
import { downloadText } from '../../utils/PlanningUtils';
import { SettingsConfig } from '../../model/SettingsConfig';

interface ExportProps {
  settings: SettingsConfig;
  data: any;
}
/**
 * @author tuonian
 * @date 2021/1/28
 * 导出配置按钮
 */
export class ExportConfigButton extends React.PureComponent<ExportProps> {
  /**
   * 导出配置文件
   */
  public exportConfigData() {
    const { data, settings } = this.props;
    new Promise<void>(async (resolve, reject) => {
      try {
        await downloadText(data, settings);
        resolve();
      } catch (e) {
        reject(e);
      }
    })
      .then(() => {
        notification.success({
          message: '提示',
          description: '导出成功！',
        });
      })
      .catch((e) => {
        console.log('downloadConfig fail ', e);
        let errMsg = '';
        if (!!e && e.message) {
          errMsg = e.message;
        }
        notification.error({
          description: `配置导出失败，错误原因：${errMsg || '无'}`,
          message: '错误',
        });
      });
  }

  public render() {
    return (
      <Button type="primary" key="console" onClick={this.exportConfigData.bind(this)}>
        立即生成配置文件
      </Button>
    );
  }
}
