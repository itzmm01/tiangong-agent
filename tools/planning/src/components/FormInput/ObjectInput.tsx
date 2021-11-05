import React from 'react';
import { Button, Form, notification } from 'antd';
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import './style.css';
import { ColumnModel } from '../../model/ColumnModel';
import { DataValidator } from '../../utils/validator';
import { SimpleAutoTypeInput } from './SimpleAutoTypeInput';

/**
 * @author tuonian
 * @date 2020/12/7
 */

interface ObjectInputProps {
  value?: any;
  column: ColumnModel;
  add: boolean;
  onAddColumn: (value: any) => void;
  onRemoveColumn: (value: any) => void;
  onSave: (value: any) => void;
}

interface ObjectInputState {
  data: any;
  prevValue: any;
  validateStatus?: 'success' | 'warning' | 'error' | 'validating';
  validateHelp?: string;
  hasFeedback?: boolean;
}

export class ObjectInput extends React.Component<ObjectInputProps, ObjectInputState> {
  public static getDerivedStateFromProps(nextProps: ObjectInputProps, { prevValue }: ObjectInputState) {
    const newState: Partial<ObjectInputState> = { prevValue: nextProps.value };
    if (prevValue !== nextProps.value) {
      newState.data = nextProps.value;
    }
    return newState;
  }

  public constructor(props: ObjectInputProps) {
    super(props);
    this.state = {
      data: props.value,
      prevValue: props.value,
    };
  }

  public async onInputChange(value: any, config: ColumnModel) {
    // await this.validator(value, config);
    const newData: any = { ...this.state.data };
    const dataIndex = config.key || config.dataIndex;
    newData[dataIndex] = value;
    this.setState({ data: newData });
    if (this.props.onSave) {
      this.props.onSave(newData);
    }
  }

  public async validator(data: any, column: ColumnModel) {
    try {
      DataValidator(data, column);
      await this.setState({
        validateStatus: 'success',
        hasFeedback: false,
        validateHelp: undefined,
      });
    } catch (e) {
      await this.setState({
        validateStatus: 'error',
        validateHelp: e.message,
        hasFeedback: true,
      });
      notification.warn({
        message: '提示',
        description: e.message,
      });
    }
  }

  public renderChildInput(column: ColumnModel, data: any) {
    if (column.items) {
      return column.items.map((config: ColumnModel) => {
        const dataIndex = config.key || config.dataIndex;
        const style: any = {};
        let className = `input-item-flex ${config.type}`;
        if (config.width) {
          style.width = config.width;
          style.flex = 'none';
          className = `${className} fixed-width`;
        }
        return (
          <div key={config.key} className={className} style={style}>
            <SimpleAutoTypeInput config={config} value={data[dataIndex]} onSave={this.onInputChange.bind(this)} />
          </div>
        );
      });
    }
    const dataIndex = column.key || column.dataIndex;
    return <SimpleAutoTypeInput config={column} value={data[dataIndex]} onSave={this.onInputChange.bind(this)} />;
  }

  public onLineChange(remove: boolean, data: any) {
    if (remove) {
      this.props.onRemoveColumn(data);
    } else {
      this.props.onAddColumn(data);
    }
  }

  public render() {
    const { column, add } = this.props;
    const { data, hasFeedback, validateStatus, validateHelp } = this.state;
    return (
      <Form.Item
        hasFeedback={hasFeedback}
        help={validateHelp}
        validateStatus={validateStatus}
        className="object-form-item"
      >
        <div className="input-line">
          <div className="input-form-item">{data ? this.renderChildInput(column, data) : undefined}</div>
          <Button
            size="small"
            type="dashed"
            className="add-btn"
            onClick={this.onLineChange.bind(this, false, data)}
            icon={<PlusCircleOutlined />}
          />
          <Button
            size="small"
            type="dashed"
            className="add-btn"
            disabled={add}
            onClick={this.onLineChange.bind(this, true, data)}
            icon={<MinusCircleOutlined />}
          />
        </div>
      </Form.Item>
    );
  }
}
