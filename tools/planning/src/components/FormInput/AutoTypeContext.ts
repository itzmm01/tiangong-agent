import React, { RefObject } from 'react';
import { FormInstance } from 'antd';

const { Provider, Consumer } = React.createContext<AutoTypeContext>({
  formRef: React.createRef(),
  domRef: React.createRef(),
});

/**
 * 消费者,生产者
 */
export { Consumer as AutoTypeFormConsumer, Provider as AutoTypeFormProvider };

/**
 * 表单共享数据结构
 */
export interface AutoTypeContext {
  formRef: RefObject<FormInstance>;
  domRef: RefObject<HTMLElement>;
}
