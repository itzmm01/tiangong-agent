import { SettingsConfig } from '../model/SettingsConfig';
// @ts-ignore
import YAML from 'js-yaml';

/**
 * 保存host.yaml 文件
 * @param host 主机数据
 * @param settings 全局配置信息
 */
export function saveHostData(settings: SettingsConfig, host?: Array<any>) {
  if (!host) {
    return {};
  }
  const hostMap: any = {};
  const labelKey = settings.hostLabelKey || 'hostGroup';
  const allHost: Array<any> = [];
  host.forEach((item) => {
    const groups = item[labelKey];
    let tags = groups?.split(',');
    if (!tags) {
      tags = [];
    }
    const info = {
      ip: item['inner-ip'] || item.ip,
      port: item['ssh-port'] || item.port,
      user: item.user,
      password: item.passwd || item.password,
    };
    allHost.push({ ...info });
    tags.forEach((tag: string) => {
      let children = hostMap[tag];
      if (!children) {
        children = [];
        hostMap[tag] = children;
      }
      children.push({ ...info });
    });
  });
  hostMap.ALL_HOST = allHost;
  return {
    'host.yml': YAML.safeDump(hostMap),
  };
}

/**
 * 把部署拓扑转化为服务key->hostList的形式
 * @param topology
 * @param host
 * @param uniqueKey
 * @param ipKey
 */
export function topologyToServiceHosts(
  topology: Array<any>,
  host: Array<any>,
  uniqueKey = 'inner-ip',
  ipKey = 'inner-ip',
) {
  const hostKeyInfoMap: any = {};
  const allHost: Array<any> = [];
  const hostMap: any = {
    ALL_HOST: [],
  };
  host.forEach((item: any) => {
    const ip = item[ipKey];
    const info = {
      ip: item['inner-ip'] || item.ip,
      port: item['ssh-port'] || item.port,
      user: item.user,
      password: item.passwd || item.password,
    };
    const hostLabelValue = item[uniqueKey];
    if (ip) {
      hostKeyInfoMap[hostLabelValue] = info;
      allHost.push({ ...info });
    }
  });
  topology.forEach((item: any) => {
    const selectArr = item.selectArr || [];
    const labelValue = item[uniqueKey];
    const info = hostKeyInfoMap[labelValue];
    selectArr.forEach((service: any) => {
      const children = service.children || [];
      if (children.length < 1) {
        const serviceKey = service.key || service.name;
        if (service.select) {
          const ips = hostMap[serviceKey] || [];
          ips.push({ ...info });
          hostMap[serviceKey] = ips;
        }
      } else {
        children
          .filter((item: any) => item.select)
          .forEach((child: any) => {
            const childKey = child.key || child.name;
            const ips = hostMap[childKey] || [];
            ips.push({ ...info });
            hostMap[childKey] = ips;
          });
      }
    });
  });
  hostMap.ALL_HOST = allHost;
  return hostMap;
}

export function saveTopologyHost(settings: SettingsConfig, topology: Array<any>, host: Array<any>) {
  const { hostLabelKey, ipKey } = settings;
  const hostMap: any = topologyToServiceHosts(topology, host, hostLabelKey, ipKey);
  return {
    'host.yml': YAML.safeDump(hostMap),
  };
}
