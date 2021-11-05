/**
 * 全局参数设置的配置信息
 * @property hostLabelKey 主机标签的key值
 */
export const DEF_FIRST_COLUMN = {
  key: 'inner-ip',
  title: '内网IP',
};

export interface HostKeyColumn {
  title: string;
  key: string;
}

export interface SettingsConfig {
  pageTitle?: string;
  templateStr?: string; // 直接在这里粘贴导出文件的模板信息
  saveFun?: string | Array<string>; // 导出文档的方法,
  saveJs?: string; // 导出配置的脚本，直接执行
  exportFileName?: string; // 导出配置文件的名称
  validateFunPrefix?: string | Array<string>;
  hostLabelKey: string;
  hostColumn: HostKeyColumn;
  ipKey: string;
}

/**
 * 默认的全局配置参数
 */
export const DEF_SETTINGS_CONFIG: SettingsConfig = {
  hostColumn: DEF_FIRST_COLUMN,
  hostLabelKey: 'inner-ip',
  ipKey: 'inner-ip',
};
