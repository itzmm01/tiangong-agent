import { EventEmitter } from 'events';

const EventBus = new EventEmitter();
EventBus.setMaxListeners(100);
export default EventBus;

/**
 * 事件类型
 * @type {{HOST_PWD_SWITCH}}
 */
export const EventType = {
  HOST_PWD_SWITCH: 'HOST_PWD_SWITCH', // 主机配置界面，密码显示和隐藏
};
