import React from 'react';
import { Button, notification, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload/interface';

/**
 * 导入json文件的按钮，以后也可以考虑支持其它文件
 * @author tuonian
 * @date 2021/1/28
 */

interface UploadProps {
  onComplete?: (data: any) => void;
}

export class UploadDataButton extends React.PureComponent<UploadProps> {
  /**
   * 加载JSON数据
   * @param dataJson
   */
  public loadJsonData(dataJson: string) {
    try {
      const data = JSON.parse(dataJson);
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      this.props.onComplete && this.props.onComplete(data);
      notification.success({
        message: '提示',
        description: '数据模板导入成功！',
      });
    } catch (e) {
      notification.error({
        message: '错误',
        description: '模板文件导入失败，请检查内容是否正确！',
      });
    }
  }

  public beforeUpload(file: RcFile, files: RcFile[]) {
    // 读取json文件 必须为json文件
    if (/json+/.test(file.type)) {
      const reader = new FileReader();
      reader.readAsText(files[0], 'UTF-8');
      reader.onload = () => {
        const { result } = reader;
        if (result) {
          // @ts-ignore
          this.loadJsonData(result);
        } else {
          notification.error({
            message: '错误',
            description: '导入的模板文件无内容！',
          });
        }
      };
    } else {
      notification.error({
        message: '错误',
        description: '导入模板文件需要为“json格式文件”',
      });
    }
    return false;
  }

  public render() {
    return (
      <Upload beforeUpload={this.beforeUpload.bind(this)}>
        <Button>
          <UploadOutlined /> 导入模板
        </Button>
      </Upload>
    );
  }
}
