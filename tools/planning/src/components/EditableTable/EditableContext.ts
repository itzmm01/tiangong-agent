import React from 'react';

/**
 * 暂时不使用这个
 */
interface EditableTableContext {
  onRowDataChange: (value: any) => void;
  onDataChange: (value: Array<any>) => void;
  allData: Array<any>;
}

export const EditableContext = React.createContext<EditableTableContext>({
  onRowDataChange: () => undefined,
  onDataChange: () => undefined,
  allData: [],
});
