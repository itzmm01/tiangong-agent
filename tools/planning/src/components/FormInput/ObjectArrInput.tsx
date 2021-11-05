import React from 'react';
import './style.css';
import { ObjectInput } from './ObjectInput';
import { ColumnModel } from '../../model/ColumnModel';
import { checkPlanningData } from '../../utils/PlanningUtils';

/**
 * @author tuonian
 * @date 2020/12/7
 */

interface ObjectArrInputProps {
  value?: Array<any>;
  onChange?: (value: any, config: ColumnModel) => void;
  ref?: any;
  cellSave?: Function;
  dataIndex: string;
  indexArr: Array<any>;
  required?: boolean;
  column: ColumnModel;
  renderHeader?: boolean;
}

interface ObjectArrInputState {
  dataArr: Array<any>;
  prevValue?: Array<any>;
}

export class ObjectArrInput extends React.Component<ObjectArrInputProps, ObjectArrInputState> {
  public static getDerivedStateFromProps(nextProps: ObjectArrInputProps, { prevValue }: ObjectArrInputState) {
    const newState: Partial<ObjectArrInputState> = { prevValue: nextProps.value };
    // console.log('ObjectArrInput[getDerivedStateFromProps]', nextProps);
    if (prevValue !== nextProps.value && nextProps.value) {
      if (nextProps.value.length === 0) {
        newState.dataArr = [];
      } else {
        newState.dataArr = nextProps.value;
      }

      return newState;
    }
    return null;
  }

  public constructor(props: ObjectArrInputProps) {
    super(props);

    this.state = {
      dataArr: [],
      prevValue: [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onValueChange(data: Array<any>) {
    const { onChange, column } = this.props;
    if (onChange) {
      // console.log('ObjectArrInput[onValueChange]=>', data);
      onChange(data.concat([]), column);
    }
  }

  public async onAddColumn(templateData: any) {
    const newData = { ...templateData };
    newData.key = this.props.dataIndex + (Math.random() * 100000).toFixed(0);
    if (this.props.column.items) {
      checkPlanningData(newData, this.props.column.items);
    }
    const dataArr = this.state.dataArr.concat([newData]);
    await this.setState({
      dataArr,
      prevValue: dataArr,
    });
    this.onValueChange(dataArr);
  }

  public async onRemoveColumn(data: any) {
    const dataArr = this.state.dataArr.filter((item) => item.key !== data.key);
    await this.setState({
      dataArr,
    });
    this.onValueChange(dataArr);
  }

  public async onSaveData(data: any) {
    const { dataArr } = this.state;
    const newData = dataArr.map((item) => {
      const newItem = { ...item };
      if (item.key === data.key) {
        Object.assign(newItem, data);
      }
      return newItem;
    });
    await this.setState({
      dataArr: newData,
      prevValue: newData,
    });
    this.onValueChange(newData);
  }

  public renderHeader() {
    const { column } = this.props;
    return (
      <div className="object-arr-header">
        {column.items.map((item) => {
          const style: any = {};
          if (item.width) {
            style.width = item.width;
            style.flex = 'none';
          }
          return (
            <span className={item.type} key={`header_${item.key}`} style={style}>
              {item.title}
            </span>
          );
        })}
      </div>
    );
  }

  public render() {
    const { column, renderHeader } = this.props;
    const { dataArr } = this.state;

    // console.log('ObjectArrInput=>render=>', dataArr);
    const style: any = {};
    if (column.width) {
      style.width = column.width;
    }
    return (
      <div className="objectInput" style={style}>
        {renderHeader && this.renderHeader()}
        {dataArr
          ? dataArr.map((item: any) => (
              <ObjectInput
                key={item.key}
                value={item}
                column={column}
                onSave={this.onSaveData.bind(this)}
                onRemoveColumn={this.onRemoveColumn.bind(this)}
                onAddColumn={this.onAddColumn.bind(this)}
                add={false}
              />
            ))
          : null}

        {!dataArr || dataArr.length === 0 ? (
          <ObjectInput
            value={undefined}
            column={column}
            onSave={this.onSaveData.bind(this)}
            onRemoveColumn={this.onRemoveColumn.bind(this)}
            onAddColumn={this.onAddColumn.bind(this)}
            add={true}
          />
        ) : undefined}
      </div>
    );
  }
}
