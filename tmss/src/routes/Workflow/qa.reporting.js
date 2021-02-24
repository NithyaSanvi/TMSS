import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import { Dropdown } from 'primereact/dropdown';
//import katex from 'katex' // for mathematical operations on sun editor this component should be added
//import 'katex/dist/katex.min.css'

class QAreporting extends Component{
   
    constructor(props) {
        super(props);
        this.state={
            content: props.report
        };
        this.Next = this.Next.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    /**
     * Method will trigger on click save buton
     * here onNext props coming from parent, where will handle redirection to other page
     */
     Next() {
        this.props.onNext({ report: this.state.content });
     }

    /**
     * Method will trigger on change of operator report sun-editor
     */
    handleChange(e) {
        localStorage.setItem('report_qa', e); 
        this.setState({ content: e });
    }

    //Not using at present
    cancelCreate() {
        this.props.history.goBack();
    }

    render() {
        return (
        <>
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
                    <SunEditor enableToolbar={true}
                        setDefaultStyle="min-height: 250px; height: auto;"
                        onChange={ this.handleChange }
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
                    <Button label="Next" className="p-button-primary" icon="pi pi-check" onClick={ this.Next } />
                </div>
                <div className="p-col-1">
                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '88px' }}/>
                </div>
            </div>
        </>
    )
};
                   
}
export default QAreporting;