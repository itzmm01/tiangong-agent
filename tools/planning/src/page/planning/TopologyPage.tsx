import React from 'react';
import IPageProps from '../../interface/IPageProps';
import { TemplateConfig } from '../../model/TemplateConfig';
/**
 * @author tuonian
 * @date 2021/1/28
 * 部署拓扑页面
 */

interface TopologyProps extends IPageProps {
  template?: TemplateConfig;
  data?: any;
}

interface TopologyState {
  prevData?: any;
}

export class TopologyPage extends React.Component<TopologyProps, TopologyState> {}
