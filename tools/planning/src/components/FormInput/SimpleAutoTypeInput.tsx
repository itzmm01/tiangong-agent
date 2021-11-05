import React from 'react';
import { Input, InputNumber, Select, Switch } from 'antd';
import { ColumnModel } from '../../model/ColumnModel';
import EventBus, { EventType } from '../Events';
import { AutoTypeContext, AutoTypeFormConsumer } from './AutoTypeContext';

/**
 * @author tuonian
 * @date 2021/1/4
 * 简单的数据类型的自动映射
 */

interface SimpleAutoTypeInputProps {
  value?: any;
  config: ColumnModel;
  onChange?: (value: any) => void;
  onSave?: (value: any, config: ColumnModel) => void;
}

interface SimpleAutoTypeInputState {
  prevValue?: any;
  data?: any;
  visible: boolean;
}

export class SimpleAutoTypeInput extends React.Component<SimpleAutoTypeInputProps, SimpleAutoTypeInputState> {
  public static getDerivedStateFromProps(nextProps: SimpleAutoTypeInputProps, { prevValue }: SimpleAutoTypeInputState) {
    const newState: Partial<SimpleAutoTypeInputState> = { prevValue: nextProps.value };
    if (prevValue !== nextProps.value) {
      if (nextProps.config.multiple && typeof nextProps.value === 'string') {
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        if (nextProps.value && nextProps.value.length) {
          newState.data = nextProps.value.split(',');
        } else {
          newState.data = [];
        }
      } else {
        newState.data = nextProps.value;
      }
    }
    return newState;
  }

  private eventEmitter: any = undefined;
  private isDestroy = false;

  public constructor(props: any) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  public async onValueChangeEvent(e: any) {
    const { value } = e.currentTarget;
    this.setState({ data: value });
    const { onChange, onSave } = this.props;
    if (onSave) {
      onSave(value, this.props.config);
    }
    if (onChange) {
      onChange(e);
    }
  }

  public async onValueChange(value: any) {
    this.setState({ data: value });
    const { onChange, onSave } = this.props;
    if (onSave) {
      onSave(value, this.props.config);
    }
    if (onChange) {
      onChange(value);
    }
  }

  public onPwdSwitchListener(column: ColumnModel, visible: boolean) {
    if (column.key === this.props.config.key) {
      !this.isDestroy && this.setState({ visible });
    }
    if (this.isDestroy && this.eventEmitter) {
      EventBus.removeListener(EventType.HOST_PWD_SWITCH, this.onPwdSwitchListener);
    }
  }

  public componentDidMount() {
    // if (this.props.config.type === 'switch') {
    //   if (typeof this.state.data === 'undefined') {
    //     await this.onValueChange(!!this.props.config.value);
    //   }
    // }
    if (this.props.config.type === 'password') {
      this.eventEmitter = EventBus.addListener(EventType.HOST_PWD_SWITCH, this.onPwdSwitchListener.bind(this));
    }
  }

  public componentWillUnmount() {
    this.isDestroy = true;
    if (this.eventEmitter) {
      EventBus.removeListener(EventType.HOST_PWD_SWITCH, this.onPwdSwitchListener);
    }
    this.eventEmitter = undefined;
  }

  public renderInput(values: AutoTypeContext) {
    const { domRef } = values;
    const value = this.state.data;
    const { visible } = this.state;
    const { config } = this.props;
    const className = `input-item ${config.type}`;
    const inputKey = config.key || config.dataIndex;
    const disabled = !!config.disabled;
    switch (config.type) {
      case 'int':
        return (
          <InputNumber
            className={className}
            min={config['min-value']}
            max={config['max-value']}
            key={inputKey}
            value={value}
            disabled={disabled}
            placeholder={config.placeholder}
            onChange={this.onValueChange.bind(this)}
          />
        );
      case 'enum':
        if (config.multiple) {
          return (
            <Select
              value={value}
              className={className}
              key={inputKey}
              placeholder={config.placeholder}
              mode="multiple"
              getPopupContainer={() => domRef.current || document.body}
              disabled={disabled}
              onChange={(values) => this.onValueChange(values ? values.join(',') : '')}
              options={config.option.map((value) => {
                if (typeof value === 'string') {
                  return { label: value, value };
                }
                return value;
              })}
            />
          );
        }

        return (
          <Select
            value={value}
            className={className}
            key={inputKey}
            placeholder={config.placeholder}
            mode={config.mode}
            disabled={disabled}
            onChange={this.onValueChange.bind(this)}
            options={config.option.map((value) => {
              if (typeof value === 'string') {
                return { label: value, value };
              }
              return value;
            })}
          />
        );

      case 'boolean':
      case 'switch':
        return <Switch checked={value} className={className} onChange={this.onValueChange.bind(this)} />;

      case 'password':
        if (config.isTable) {
          return (
            <Input
              value={value}
              className={className}
              key={inputKey}
              type={visible ? 'text' : 'password'}
              placeholder={config.placeholder}
              disabled={disabled}
              onChange={this.onValueChangeEvent.bind(this)}
            />
          );
        }
        return (
          <Input.Password
            value={value}
            className={className}
            key={inputKey}
            disabled={disabled}
            placeholder={config.placeholder}
            onChange={this.onValueChangeEvent.bind(this)}
          />
        );

      case 'info':
        return '';
      default:
        return (
          <Input
            value={value}
            className={className}
            key={inputKey}
            disabled={disabled}
            placeholder={config.placeholder}
            onChange={this.onValueChangeEvent.bind(this)}
          />
        );
    }
  }
  public render() {
    return <AutoTypeFormConsumer>{(values) => this.renderInput(values)}</AutoTypeFormConsumer>;
  }
}
