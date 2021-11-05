import React, { RefObject } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Form, Tooltip, notification } from 'antd';
import { ColumnModel } from '../../model/ColumnModel';
import { DataValidator } from '../../utils/validator';
import { SimpleAutoTypeInput } from './SimpleAutoTypeInput';
import { isNull } from '../../utils/paramRules';
import { ObjectArrInput } from './ObjectArrInput';
import { mergeColumnList } from '../../utils/merge';
import './style.css';
import {isFalse} from "../../utils/util";

interface AutoTypeFormItemProps {
  type: string;
  onChange?: (value: any) => void;
  inputRef?: RefObject<any>;
  value?: any;
  column: ColumnModel;
  ruleType?: string;
  onSave: (value: any) => void;
  defaultValue?: any;
  renderHeader?: boolean;
  renderLabel?: boolean;
  skipValidator?: boolean;
  allData?: any;
}

interface AutoTypeFormItemState {
  prevValue: any;
  cascade: Array<ColumnModel>;
}

/**
 * ；联动配置分隔字符
 */
const CASCADE_SPLIT = '&';
/**
 * 解析联动
 * @param column
 * @param value
 */
function parseCascade(column: ColumnModel, value: any) {
  if (isNull(value)) {
    return [];
  }
  const { cascade } = column;
  if (!cascade) {
    return [];
  }
  const cascadeMap: any = {};
  Object.keys(cascade).forEach((item) => {
    const values = cascade[item];
    const arr = item.split(CASCADE_SPLIT);
    arr.forEach((key) => {
      if (cascadeMap[key]) {
        cascadeMap[key] = mergeColumnList(cascadeMap[key], values);
      } else {
        cascadeMap[key] = values;
      }
    });
  });
  let newCascade = cascadeMap[value];
  if (!newCascade) {
    newCascade = [];
  }
  return newCascade;
}

/**
 * @author tuonian
 * @date 2020/12/8
 */
export class AutoTypeFormItem extends React.Component<AutoTypeFormItemProps, AutoTypeFormItemState> {
  public static getDerivedStateFromProps(nextProps: AutoTypeFormItemProps, { prevValue }: AutoTypeFormItemState) {
    const newState: Partial<AutoTypeFormItemState> = { prevValue: nextProps.defaultValue };
    if (nextProps.defaultValue !== prevValue) {
      const { column } = nextProps;
      const value = isNull(nextProps.defaultValue) ? nextProps.column.value : nextProps.defaultValue;
      newState.cascade = parseCascade(column, value);
      return newState;
    }
    return null;
  }

  public constructor(props: AutoTypeFormItemProps) {
    super(props);
    const { defaultValue, column } = props;
    const value = isNull(defaultValue) ? column.value : defaultValue;
    this.state = {
      prevValue: props.defaultValue,
      cascade: parseCascade(column, value),
    };
  }

  public onValueChange(value: any, column: ColumnModel) {
    if (column.key === this.props.column.key) {
      const newCascade = parseCascade(column, value);
      this.setState({ cascade: newCascade });
    }
  }

  public validator(column: ColumnModel, rule: any, value: any) {
    const config = { ...column };
    if (!config.title) {
      config.title = config.name;
    }
    try {
      DataValidator(value, config, this.props.allData);
      return Promise.resolve();
    } catch (e) {
      // notification.warn({
      //   message: '提示',
      //   description: e.message,
      // });
      return Promise.reject(e.message);
    }
  }

  public render() {
    const { column, renderHeader, renderLabel } = this.props;
    if (column.type === 'array') {
      let formName = column.dataIndex;
      if (!formName) {
        formName = column.key;
      }
      let label: string | undefined = '';
      if (renderLabel) {
        label = column.title || column.name;
      }
      return (
        <Form.Item
          key={formName}
          required={isNull(column.required) || column.required}
          name={formName}
          label={<span>{label}</span>}
          rules={[{ validator: this.validator.bind(this, column) }]}
          // @ts-ignore
          className="auto-type-form-item"
          hidden={isFalse(column.display)}
        >
          <ObjectArrInput renderHeader={renderHeader} dataIndex={formName} indexArr={column.items} column={column} />
        </Form.Item>
      );
    }

    const { cascade } = this.state;
    if (!cascade || cascade.length === 0) {
      return this.renderFormItem(column);
    }

    return (
      <div>
        {this.renderFormItem(column)}
        {cascade.map((item: ColumnModel) => this.renderFormItem(item))}
      </div>
    );
  }

  public renderDescription(column: ColumnModel) {
    if (!column || !column.description) {
      return null;
    }
    if (column.isTable) {
      return null;
    }
    if (column.description.length === 0) {
      return null;
    }
    if (column.description.length > 80) {
      return (
        <Tooltip overlay={<span dangerouslySetInnerHTML={{ __html: column.description }} />}>
          <a href="#API" style={{ margin: '0 8px' }}>
            查看帮助?
          </a>
        </Tooltip>
      );
    }
    return <span className="description">{column.description}</span>;
  }

  public renderFormItem(column: ColumnModel) {
    let formName = column.dataIndex;
    if (!formName) {
      formName = column.key;
    }
    let initialValue;
    if (column.type === 'switch' || column.type === 'boolean') {
      initialValue = column.value || false;
    } else {
      initialValue = column.value;
    }
    const label = column.title || column.name;
    return (
      <Form.Item
        label={<span>{label}</span>}
        key={formName}
        required={isNull(column.required) || column.required}
        className="auto-type-form-item"
        hidden={isFalse(column.display)}
      >
        <Form.Item
          noStyle={true}
          name={formName}
          initialValue={initialValue}
          rules={[{ validator: this.validator.bind(this, column) }]}
        >
          <SimpleAutoTypeInput config={column} onSave={this.onValueChange.bind(this)} />
        </Form.Item>
        {this.renderDescription(column)}
      </Form.Item>
    );
  }
}
