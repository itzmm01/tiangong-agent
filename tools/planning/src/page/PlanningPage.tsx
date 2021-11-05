import React from 'react';
import { TemplateModel } from '../model/TemplateModel';
import { Button, notification, Result, Steps } from 'antd';
import { HostPage } from './HostPage';
import { TopologyPage } from './TopologyPage';
import { PlanningData } from '../model/PlanningData';
import { AutoForm, AutoGroupForm } from '../components';

import ServicePage from './ServicePage';
import { ExportConfigButton } from './planning/ExportConfigButton';
import { DEF_FIRST_COLUMN, DEF_SETTINGS_CONFIG, SettingsConfig } from '../model/SettingsConfig';
import { PlanningInstance } from '../interface/PlanningInstance';
import { makePageData } from '../utils/PlanningUtils';
import { pageDataValidator } from '../utils/validator';

const { Step } = Steps;

interface PlanningPageProps {
  data?: any;
  template: Array<TemplateModel>;
  onSaveData?: (data: PlanningData) => void;
}

/**
 * @author tuonian
 * @date 2020/12/9
 * 规划工具的首页
 */
interface PlanningPageState {
  steps: Array<StepModel>;
  current: number;
  currentStep?: StepModel;
  data: PlanningData;
  template?: TemplateModel;
  prevData?: any;
  prevTemplate?: any;
  settingsConfig: SettingsConfig;
}

interface StepModel {
  title: string;
  content: string;
  key: string;
  config: TemplateModel;
}

/**
 * 规划工具首页
 */
export class PlanningPage extends React.Component<PlanningPageProps, PlanningPageState> implements PlanningInstance {
  /**
   * 每次属性有变化，都会更新
   * @param nextProps
   * @param prevData
   * @param prevTemplate
   */
  public static getDerivedStateFromProps(nextProps: PlanningPageProps, { prevData, prevTemplate }: PlanningPageState) {
    const newState: any = {
      prevData: nextProps.data,
      prevTemplate: nextProps.template,
      current: 0,
    };
    if (nextProps.data !== prevData || nextProps.template !== prevTemplate) {
      const state: any = makePageData(nextProps.template, nextProps.data);
      console.log('[PlanningPage] state=>', state);
      Object.assign(newState, state);
      if (state.steps.length) {
        const firstStep = state.steps[0];
        newState.currentStep = { ...firstStep };
      }
      return newState;
    }
    return null;
  }

  public constructor(props: PlanningPageProps) {
    super(props);
    this.state = {
      data: {},
      steps: [],
      current: 0,
      settingsConfig: {
        ...DEF_SETTINGS_CONFIG,
      },
    };
  }

  /**
   * 每个页面提交数据，保存完毕后，到下一页
   * @param pageKey 提交数据的key值
   * @param newData
   */
  public async handleSubmit(pageKey: string, newData: any) {
    try {
      const { settingsConfig, data } = this.state;
      pageDataValidator(settingsConfig, pageKey, newData, data);
    } catch (e) {
      console.log('validate fail', e);
      notification.error({
        message: '参数校验未通过',
        description: e.message || '参数校验未通过，请检查数据！',
      });
      return false;
    }
    const { data, steps, current } = this.state;
    // @ts-ignore
    data[pageKey] = newData;
    let next = current + 1;
    if (next >= steps.length) {
      next = steps.length - 1;
    }
    const nextStep = steps[next];
    this.setState({ current: next, currentStep: nextStep, data });
    return true;
  }

  public getData() {
    return this.state.data;
  }

  public onPrevStep() {
    console.log('current', this.state);
    const { current, steps } = this.state;

    if (current === 0) {
      return;
    }
    const prev = current - 1;
    const prevStep = steps[prev];
    this.setState({ current: prev, currentStep: prevStep });
  }

  public renderStep() {
    const { current, currentStep, data, steps, settingsConfig } = this.state;
    console.log('[PlanningPage:renderStep] steps ', currentStep);
    if (!currentStep) {
      return null;
    }
    console.log('[PlanningPage:renderStep] data ', data);
    console.log('[PlanningPage:renderStep] settingsConfig ', settingsConfig);

    const showPrevBtn = current > 0 && current < steps.length - 1;
    const maxHeight = document.documentElement.clientHeight - 225;

    switch (currentStep.content) {
      case 'FormSizeDemo':
        return (
          <AutoForm
            current={current}
            // @ts-ignore
            template={currentStep.config}
            value={data.common}
            onCancel={this.onPrevStep.bind(this)}
            onSubmit={this.handleSubmit.bind(this)}
            key={`${new Date()}`}
            showPrev={showPrevBtn}
          />
        );

      case 'EditableTable':
        return (
          <HostPage
            current={current}
            data={data.host || []}
            config={currentStep.config.config}
            onCancel={this.onPrevStep.bind(this)}
            showCancelBtn={showPrevBtn}
            maxHeight={maxHeight}
            onSubmit={this.handleSubmit.bind(this, currentStep.key)}
          />
        );

      case 'ParamConfig':
        return (
          <AutoGroupForm
            value={data.param}
            // @ts-ignore
            template={currentStep.config}
            current={current}
            onCancel={this.onPrevStep.bind(this)}
            showPrev={showPrevBtn}
            onSubmit={this.handleSubmit.bind(this)}
          />
        );

      case 'ServiceConfig':
        return (
          <ServicePage
            data={data.service}
            config={currentStep.config}
            showCancelBtn={showPrevBtn}
            maxHeight={maxHeight}
            onCancel={this.onPrevStep.bind(this)}
            onSubmit={this.handleSubmit.bind(this)}
          />
        );

      case 'Topology':
        return (
          <TopologyPage
            data={data}
            showCancelBtn={showPrevBtn}
            templateConfig={currentStep.config}
            maxHeight={maxHeight}
            onCancel={this.onPrevStep.bind(this)}
            onSubmit={this.handleSubmit.bind(this)}
            settings={settingsConfig}
          />
        );
      default:
        break;
    }

    return null;
  }

  public render() {
    const { current, steps, data, settingsConfig } = this.state;
    return (
      <div className="planning-container">
        <Steps current={current}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        {this.renderStep()}
        <div className="steps-action" style={{ top: '10px' }}>
          {current === steps.length - 1 && (
            <Result
              style={{ marginTop: 20 }}
              status="success"
              title="提示"
              subTitle="已完成所有的信息配置？"
              extra={[
                <Button key="buy" onClick={() => this.onPrevStep()}>
                  返回上一页
                </Button>,
                <ExportConfigButton key="exportBtn" settings={settingsConfig} data={data} />,
              ]}
            />
          )}
        </div>
      </div>
    );
  }
}
