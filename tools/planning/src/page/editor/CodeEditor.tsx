import React, { RefObject } from 'react';
import { Button } from 'antd';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-idle_fingers';
import 'ace-builds/src-noconflict/ext-language_tools';

interface CodeEditorProps {
  mode?: 'javascript' | 'json';
  onChange?: (value: any) => void;
  width?: string;
}
interface CodeEditorState {
  current?: string;
}

/**
 * @author tuonian
 * @date 2021/3/2
 */

export default class CodeEditor extends React.Component<CodeEditorProps, CodeEditorState> {
  private editorRef: RefObject<AceEditor> = React.createRef();
  private currentValue?: string;

  public onChange(newValue: string) {
    this.currentValue = newValue;
    if (this.props.onChange) {
      this.props.onChange(newValue);
    }
  }

  public onExec() {
    try {
      const code = this.currentValue;
      const host = [];
      if (code) {
        // eslint-disable-next-line no-eval
        eval(code);
      }
    } catch (e) {
      console.log('exec err', e);
    }
  }

  public render() {
    const { mode, width } = this.props;
    return (
      <div>
        <AceEditor
          ref={this.editorRef}
          mode={mode || 'javascript'}
          theme="idle_fingers"
          name={`ACE_EDITOR_${Math.random() * 10000}`}
          onChange={this.onChange.bind(this)}
          highlightActiveLine={true}
          editorProps={{ $blockScrolling: true }}
          enableSnippets
          tabSize={2}
          enableBasicAutocompletion={true}
          enableLiveAutocompletion={true}
          showGutter={true}
          width={width}
        />
        <div>
          <Button onClick={this.onExec.bind(this)}>执行</Button>
        </div>
      </div>
    );
  }
}
