import React from 'react';
import { Button, notification } from 'antd';
import { VerticalAlignBottomOutlined } from '@ant-design/icons';
import { downloadJsonData } from '../../utils/DownloadUtils';

/**
 * 导出指定的数据为json格式的数据
 * @author tuonian
 * @date 2021/1/28
 */

interface ExportJsonProps {
  style?: any;
  title?: string;
  getData: () => any;
}

export class ExportJsonButton extends React.PureComponent<ExportJsonProps> {
  /**
   * 导出数据为JSON格式的文件
   */
  public exportJsonData() {
    new Promise((resolve) => {
      downloadJsonData(this.props.getData() || {});
      resolve(1);
    })
      .then(() => {
        notification.success({
          message: '提示',
          description: '模板文件导出成功',
        });
      })
      .catch((e) => {
        console.log('exportJsonData', e);
        notification.error({
          message: '错误',
          description: '模板文件导出失败！',
        });
      });
  }

  public render() {
    return (
      <Button
        type="primary"
        icon={<VerticalAlignBottomOutlined />}
        style={this.props.style}
        onClick={this.exportJsonData.bind(this)}
      >
        {this.props.title || '导出模板'}
      </Button>
    );
  }
}
