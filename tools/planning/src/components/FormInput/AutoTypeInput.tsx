import React, { RefObject } from 'react';
import { Form, Tooltip } from 'antd';
import { ColumnModel } from '../../model/ColumnModel';
import { ObjectArrInput } from './ObjectArrInput';
import { DataValidator } from '../../utils/validator';
import { SimpleAutoTypeInput } from './SimpleAutoTypeInput';
import { isNull } from '../../utils/paramRules';

interface AutoTypeInputProps {
  type: string;
  onChange?: (value: any) => void;
  inputRef?: RefObject<any>;
  value?: any;
  column: ColumnModel;
  ruleType?: string;
  onSave: (value: any) => void;
  defaultValue?: any;
  renderHeader?: boolean;
  skipValidator?: boolean;
}

interface AutoTypeInputState {
  data: any;
  prevValue: any;

  validateStatus?: 'success' | 'warning' | 'error' | 'validating';
  validateHelp?: string;
  hasFeedback?: boolean;
}

/**
 * @author tuonian
 * @date 2020/12/8
 * 用于表格的模式
 * 跟适用于表单模式的：AutoTypeFormItem 有一定的区分
 * 1、不支持
 */
export class AutoTypeInput extends React.Component<AutoTypeInputProps, AutoTypeInputState> {
  public static getDerivedStateFromProps(nextProps: AutoTypeInputProps, { prevValue }: AutoTypeInputState) {
    const newState: Partial<AutoTypeInputState> = { prevValue: nextProps.value };
    if (prevValue !== nextProps.value) {
      newState.data = nextProps.value;
    }
    // console.log('AutoTypeInput[getDerivedStateFromProps]');
    return newState;
  }

  public constructor(props: AutoTypeInputProps) {
    super(props);
    let data = props.value;
    if (props.column.multiple) {
      data = data ? data.split(',') : [];
    }
    this.state = {
      data,
      prevValue: props.value,
    };
  }

  public async noValidatorChangeValue(currentValue: any) {
    const { onSave, onChange } = this.props;
    const newData = currentValue;
    if (onSave) {
      onSave(currentValue);
    }
    if (onChange) {
      onChange(currentValue);
    }
    this.setState({
      data: newData,
      prevValue: newData,
    });
  }

  public async onChangeValue(currentValue: any, config: ColumnModel) {
    const { onSave, onChange } = this.props;
    const success = await this.validator(currentValue, config);
    let newData = currentValue;
    if (success) {
      if (onSave) {
        onSave(currentValue);
      }
      if (onChange) {
        onChange(currentValue);
      }
    } else {
      newData = this.state.data;
    }
    this.setState({
      data: newData,
      prevValue: newData,
    });
  }

  public async validator(data: any, column: ColumnModel) {
    try {
      DataValidator(data, column);
      await this.setState({
        validateStatus: 'success',
        hasFeedback: false,
        validateHelp: undefined,
      });
      return true;
    } catch (e) {
      // console.log('AutoTypeInput validator fail ', e, data);
      await this.setState({
        validateStatus: 'error',
        validateHelp: e.message,
        hasFeedback: true,
      });
      return false;
    }
  }

  public render() {
    const { type, inputRef, column, renderHeader } = this.props;

    const { data, hasFeedback, validateHelp, validateStatus } = this.state;
    if (type === 'array') {
      return (
        <ObjectArrInput
          ref={inputRef}
          renderHeader={renderHeader}
          onChange={this.noValidatorChangeValue.bind(this)}
          dataIndex={column.dataIndex}
          indexArr={column.items}
          value={data}
          column={column}
        />
      );
    }

    return (
      <Form.Item
        style={{
          margin: 0,
        }}
        hasFeedback={hasFeedback}
        help={validateHelp}
        validateStatus={validateStatus}
        initialValue={data}
        label={column.name}
        required={isNull(column.required) || column.required}
        name={column.dataIndex || column.key}
      >
        <SimpleAutoTypeInput config={column} value={data} onSave={this.onChangeValue.bind(this)} />

        {column.description && column.description.length > 80 ? (
          <Tooltip overlay={column.description}>
            <a href="#API" style={{ margin: '0 8px' }}>
              查看帮助?
            </a>
          </Tooltip>
        ) : (
          <span className="descripInfo">{column.description}</span>
        )}
      </Form.Item>
    );
  }
}
