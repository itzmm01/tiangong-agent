// @ts-ignore
import YAML from 'js-yaml';
import PlanApp, { parsePageSetting } from './page/PlanApp';
import { PlanningPage } from './page/PlanningPage';
import { HostPage } from './page/HostPage';
import ServicePage from './page/ServicePage';
import { TopologyPage } from './page/TopologyPage';
import { ExportJsonButton, EditableTable, AutoGroupForm, AutoForm, UploadDataButton } from './components';
import CodeEditor from './page/editor/CodeEditor';
import { mergeArray, mergeConfig, mergeTemplate } from './utils/merge';
import { topologyToServiceHosts } from './utils/save';
import DemoApp from './App';

if (window) {
  // @ts-ignore
  window.YAML = YAML;
  // @ts-ignore
  window.safe2Yaml = YAML.safeDump;
  // @ts-ignore
  window.toYaml = YAML.dump;
}

export {
  PlanApp,
  DemoApp,
  PlanningPage,
  HostPage,
  ServicePage,
  TopologyPage,
  ExportJsonButton,
  EditableTable,
  AutoForm,
  AutoGroupForm,
  UploadDataButton,
  CodeEditor,
  parsePageSetting,
  mergeArray,
  mergeTemplate,
  mergeConfig,
  topologyToServiceHosts
};
