import React, { RefObject } from 'react';
import { Form } from 'antd';
import { FormInstance } from 'antd/es/form';
import { ColumnModel } from '../../model/ColumnModel';
import { AutoTypeFormProvider } from '../FormInput/AutoTypeContext';

/**
 * @author tuonian
 * @date 2020/12/7
 */

interface EditableRowProps {
  record: any;
  index: number;
  onValuesChange: (values: any) => void;
}

interface EditableRowState {
  rowKey: string;
  prevValue?: any;
  value?: any;
}

export class EditableRow extends React.Component<EditableRowProps, EditableRowState> {
  public static getDerivedStateFromProps(nextProps: EditableRowProps, { prevValue }: EditableRowState) {
    if (prevValue !== nextProps.record) {
      return {
        prevValue: nextProps.record,
        value: nextProps.record,
        rowKey: `EditableRow_${nextProps.record.key}`,
      };
    }
    return null;
  }

  private formRef = React.createRef<FormInstance>();

  public constructor(props: any) {
    super(props);
    this.state = {
      rowKey: 'EditableRow',
    };
  }

  public validateFields = () => {
    if (this.formRef.current) {
      return this.formRef.current.validateFields();
    }
  };

  public setFieldValues = (column: ColumnModel, fieldsValue: any, childColumn: ColumnModel) => {
    if (!this.formRef.current) {
      return;
    }
    const changeFields: any = { key: this.props.record.key };
    if (!childColumn) {
      this.formRef.current.setFieldsValue(fieldsValue);
      Object.assign(changeFields, fieldsValue);
    } else {
      const dataIndex = column.dataIndex || column.key;
      const nowValue = this.formRef.current.getFieldValue(dataIndex);
      let newValue = [];
      if (nowValue instanceof Array) {
        newValue = nowValue.map((value) => ({
          ...value,
          ...fieldsValue,
        }));
      } else {
        newValue = { ...nowValue, ...fieldsValue };
      }
      const fieldsData: any = {};
      fieldsData[dataIndex] = newValue;
      this.formRef.current.setFieldsValue(fieldsData);
      changeFields[dataIndex] = newValue;
    }
    if (this.props.onValuesChange) {
      this.props.onValuesChange(changeFields);
    }
  };

  /**
   * 更新行字段值
   * @param ref
   * @param values
   */
  public async updateFormFields(ref: RefObject<FormInstance>, values: any) {
    if (ref.current && values) {
      ref.current.setFieldsValue(values);
    }
  }

  // componentWillReceiveProps(nextProps: Readonly<EditableRowProps>, { prevValue }: EditableRowState): void {
  //   if (prevValue !== nextProps.record) {
  //     if (this.formRef.current) {
  //       this.formRef.current.setFieldsValue(nextProps.record);
  //     }
  //     this.setState({ prevValue: nextProps.record, rowKey: `EditableRow_${nextProps.record.key}` });
  //   }
  // }

  public onFieldsChange(changeFields: any, values: any) {
    if (this.props.onValuesChange) {
      // eslint-disable-next-line no-param-reassign
      values.key = this.props.record.key;
      this.props.onValuesChange(values);
    }
  }

  public render() {
    const { rowKey, value } = this.state;
    if (!this.props.record) {
      return null;
    }
    this.updateFormFields(this.formRef, value).then(() => undefined);
    const props = { ...this.props, onValuesChange: undefined, allData: undefined };
    delete props.onValuesChange;
    delete props.allData;
    const domRef: RefObject<any> = React.createRef();
    return (
      <AutoTypeFormProvider value={{ domRef, formRef: this.formRef }}>
        <Form
          ref={this.formRef}
          initialValues={this.props.record}
          key={rowKey}
          onValuesChange={this.onFieldsChange.bind(this)}
          component={false}
        >
          <tr ref={domRef} {...props} />
        </Form>
      </AutoTypeFormProvider>
    );
  }
}
