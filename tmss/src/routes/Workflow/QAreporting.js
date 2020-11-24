import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import {Dropdown} from 'primereact/dropdown';
import katex from 'katex' // for mathematical operations on sun editor this component should be added
import 'katex/dist/katex.min.css'

class QAreporting extends Component{
   
    constructor(props) {
        super(props);
        this.state={
            content: props.report
        };
        this.onSave = this.onSave.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    onSave() {
        this.props.onNext({report: this.state.content});
     }

    handleChange(e) {
        localStorage.setItem('report_qa', e); //QA report on editor
        this.setState({ content: e });
    }
    cancelCreate() {
        this.props.history.goBack();
    }

    render() {
        return (<>
            <div className="p-fluid">
                <div className="p-field p-grid">
                    <label htmlFor="assignTo" className="col-lg-2 col-md-2 col-sm-12">Assign To </label>
                    <div className="col-lg-3 col-md-3 col-sm-12" data-testid="assignTo" >
                        <Dropdown inputId="assignToValue" optionLabel="value" optionValue="value"
                            options={[{ value: 'User 1' }, { value: 'User 2' }, { value: 'User 3' }]}
                            placeholder="Assign To" />
                    </div>
                </div>
                <div className="p-grid" style={{ padding: '10px' }}>
                    <label htmlFor="comments" >Comments</label>
                    <div className="col-lg-12 col-md-12 col-sm-12"></div>
                    <SunEditor height="250" enableToolbar={true}
                        onChange={this.handleChange}
                        setOptions={{
                            buttonList: [
                                ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video', 'italic', 'strike', 'subscript',
                                    'superscript', 'outdent', 'indent', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'removeFormat']
                            ]
                        }} />
                </div>
            </div>
            <div className="p-grid p-justify-start">
                <div className="p-col-1">
                    <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.onSave} />
                </div>
                <div className="p-col-1">
                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '88px' }} onClick={this.cancelCreate} />
                </div>
            </div>
        </>
    )
};
                   
}
export default QAreporting;