import React, { createRef, RefObject } from 'react';
import { Alert, Button, Form } from 'antd';
import { ColumnModel } from '../../model/ColumnModel';
import { FormTemplateModel } from '../../model/FormTemplateModel';
import { FormInstance } from 'antd/lib/form';
import { isNull } from '../../utils/paramRules';
import { AutoTypeFormItem } from './AutoTypeFormItem';
import { checkPlanningData } from '../../utils/PlanningUtils';
import { AutoTypeFormProvider } from './AutoTypeContext';
/**
 * @author tuonian
 * @date 2021/1/8
 * 自动渲染表单
 */

interface AutoFormProps {
  template: FormTemplateModel;
  value?: any;
  current: number;
  showPrev?: boolean;
  hiddenNext?: boolean;
  onCancel: () => void;
  onSubmit: (page: string, values: any) => void;
}

interface AutoFormState {
  data: any;
  prevData?: any;
  description?: string;
  loading?: boolean;
}

export class AutoForm extends React.Component<AutoFormProps, AutoFormState> {
  public static getDerivedStateFromProps(nextProps: AutoFormProps, { prevData }: AutoFormState) {
    const newState: Partial<AutoFormState> = { prevData: nextProps.value };
    if (prevData !== nextProps.value) {
      newState.data = nextProps.value;
      checkPlanningData(newState.data, nextProps.template.config);
    }
    // console.log('AutoTypeInput[getDerivedStateFromProps]', newState,nextProps.value);
    return newState;
  }

  private formRef: RefObject<FormInstance> = createRef();

  public constructor(props: any) {
    super(props);
    this.state = {
      data: {},
      prevData: {},
    };
  }

  public handleSubmit(values: any) {
    const { page } = this.props.template;
    if (this.props.onSubmit) {
      this.props.onSubmit(page, values);
    }
  }

  public onSubmit() {
    if (this.formRef.current) {
      this.formRef.current.submit();
    }
  }

  public componentDidUpdate() {
    const { data } = this.state;
    if (this.formRef.current && data) {
      this.formRef.current.setFieldsValue(data);
    }
  }

  public render() {
    const { template } = this.props;
    const { config } = template;

    if (!config) {
      return null;
    }
    const formList: Array<ColumnModel> = config;
    const { description, data, loading } = this.state;
    const domRef: RefObject<HTMLDivElement> = React.createRef();
    return (
      <AutoTypeFormProvider value={{ formRef: this.formRef, domRef }}>
        <div className="mg-top__20 auto-form">
          {description ? (
            <Alert message={description} type="info" showIcon closable style={{ marginBottom: '20px', width: '60%' }} />
          ) : (
            ''
          )}
          <div ref={domRef} className="auto-form-container">
            <Form
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 18 }}
              layout="horizontal"
              ref={this.formRef}
              onFinish={this.handleSubmit.bind(this)}
              initialValues={data}
            >
              {formList.map((item, index) => (
                <AutoTypeFormItem
                  column={item}
                  key={`${item.key}${index}`}
                  type={item.type}
                  renderLabel={true}
                  renderHeader={true}
                  defaultValue={data ? data[item.key] : undefined}
                  onSave={() => undefined}
                />
              ))}
            </Form>
          </div>
          <div className="tool-btns">
            {this.props.showPrev ? (
              <Button type="ghost" htmlType="button" onClick={this.props.onCancel}>
                返回上一步
              </Button>
            ) : undefined}
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              onClick={this.onSubmit.bind(this)}
              style={{ marginLeft: 20 }}
              hidden={this.props.hiddenNext}
            >
              保存并下一步
            </Button>
          </div>
        </div>
      </AutoTypeFormProvider>
    );
  }
}
