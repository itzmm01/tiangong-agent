import React, { createRef, RefObject } from 'react';
import { Alert, Button, Divider, Form } from 'antd';
import { ColumnModel } from '../../model/ColumnModel';
import { FormInstance } from 'antd/lib/form';
import { AutoTypeFormItem } from './AutoTypeFormItem';
import { checkPlanningData } from '../../utils/PlanningUtils';
import { FormGroupConfigModel } from '../../model/FormGroupConfigModel';
import { GroupParamColumnModel } from '../../model/GroupParamColumnModel';
import { AutoTypeFormProvider } from './AutoTypeContext';

/**
 * @author tuonian
 * @date 2021/1/8
 * 自动渲染表单
 */

interface AutoGroupFormProps {
  template: FormGroupConfigModel;
  value?: any;
  current: number;
  onSubmit: (page: string, values: any) => void;
  showPrev?: boolean;
  hiddenNext?: boolean;
  onCancel: () => void;
}

interface AutoGroupFormState {
  data: any;
  prevData?: any;
  description?: string;
}

export class AutoGroupForm extends React.Component<AutoGroupFormProps, AutoGroupFormState> {
  public static getDerivedStateFromProps(nextProps: AutoGroupFormProps, { prevData }: AutoGroupFormState) {
    const newState: Partial<AutoGroupFormState> = { prevData: nextProps.value };
    if (prevData !== nextProps.value) {
      newState.data = nextProps.value;
      let columns: Array<ColumnModel> = [];
      nextProps.template.config.forEach((config) => {
        columns = columns.concat(config['param-items']);
      });
      checkPlanningData(newState.data, columns);
    }
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

  public render() {
    const { template } = this.props;
    const { config } = template;

    if (!config) {
      return null;
    }
    const formList: Array<GroupParamColumnModel> = config;
    const { description, data } = this.state;
    const domRef: RefObject<HTMLDivElement> = React.createRef();

    return (
      <AutoTypeFormProvider value={{ domRef, formRef: this.formRef }}>
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
              {formList.map((group, index) => (
                <div key={`${group['param-group']}`}>
                  <Divider
                    className="default-divider group-title"
                    orientation={group.orientation || 'left'}
                    style={{ marginBottom: 10, marginTop: 10 }}
                  >
                    {group['param-group']}
                  </Divider>
                  {group['param-items'].map((item) => (
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
                </div>
              ))}
            </Form>
          </div>

          <div className="tool-btns" style={{ paddingLeft: 40 }}>
            {this.props.showPrev ? (
              <Button type="ghost" htmlType="button" onClick={this.props.onCancel}>
                返回上一步
              </Button>
            ) : undefined}
            <Button
              type="primary"
              hidden={this.props.hiddenNext}
              htmlType="submit"
              onClick={this.onSubmit.bind(this)}
              style={{ marginLeft: 20 }}
            >
              保存并下一步
            </Button>
          </div>
        </div>
      </AutoTypeFormProvider>
    );
  }
}
