import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import { Dropdown } from 'primereact/dropdown';
import WorkflowService from '../../services/workflow.service';
import { Checkbox } from 'primereact/checkbox';

//import katex from 'katex' // for mathematical operations on sun editor this component should be added
//import 'katex/dist/katex.min.css'

class QAreporting extends Component{
   
    constructor(props) {
        super(props);
        this.state={
            content: '',
            assignTo: '',
            operator_accept: true
        };
        this.Next = this.Next.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    async componentDidMount() {
        if (this.props.readOnly) {
            const QAreportingresponse = await WorkflowService.getQAReportingTo(this.props.process.qa_reporting_to);
            this.setState({
                content: QAreportingresponse.operator_report,
                operator_accept: QAreportingresponse.operator_accept
            });
        }
    }

    /**
     * Method will trigger on click next buton
     * here onNext props coming from parent, where will handle redirection to other page
     */
     async Next() {
        const currentWorkflowTask = await this.props.getCurrentTaskDetails();
        const promise = [];
        if (currentWorkflowTask && !currentWorkflowTask.fields.owner) {
            promise.push(WorkflowService.updateAssignTo(currentWorkflowTask.pk, { owner: this.state.assignTo }));
        }
        promise.push(WorkflowService.updateQA_Perform(this.props.id, {"operator_report": this.state.content, "operator_accept": this.state.operator_accept}));
        Promise.all(promise).then((responses) => {
            if (responses.indexOf(null)<0) {
                this.props.onNext({ report: this.state.content });
            }   else {
                this.props.onError();
            } 
        });
    }

    /**
     * Method will trigger on change of operator report sun-editor
     */
    handleChange(e) {
        if (e === '<p><br></p>') {
            this.setState({ content: '' });
            return;
        }
        this.setState({ content: e });
    }

    render() {
        return (
        <>
           <div>
            <div className={`p-fluid-grid ${this.props.readOnly ? 'disableContainer' : ''}`}>
                <div className="p-field p-grid" style={{ paddingLeft: '-10px' }}>
                    <label htmlFor="assignTo" className="col-lg-2 col-md-2 col-sm-12">Assign To</label>
                    <div className="col-lg-3 col-md-3 col-sm-12" data-testid="assignTo" >
                    <Dropdown inputId="assignToValue" value={this.state.assignTo} optionLabel="value" optionValue="id" onChange={(e) => this.setState({assignTo: e.value})}
                            options={[{ value: 'User 1', id: 1 }, { value: 'User 2', id: 2 }, { value: 'User 3', id: 3 }]}
                            placeholder="Assign To" />
                    </div>
                </div>                
                <div className="p-field p-grid" style={{ padding: '12px' }}>
                    <label htmlFor="comments" >Comments<span style={{color:'red'}}>*</span></label>
                    <div className="col-lg-12 col-md-12 col-sm-12"></div>
                    <SunEditor enableToolbar={true}
                        setDefaultStyle="min-height: 250px; height: auto;"
                        onChange={ this.handleChange }
                        setContents={this.state.content}
                        setOptions={{
                            buttonList: [
                                ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video', 'italic', 'strike', 'subscript',
                                    'superscript', 'outdent', 'indent', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'removeFormat']
                            ]
                        }} />
                </div>            
                <div className="p-col-12">
                    <Checkbox inputId="operator_accept" onChange={e => this.setState({operator_accept: e.checked})} checked={this.state.operator_accept}></Checkbox>
                    <label htmlFor="operator_accept " style={{paddingLeft:"5px"}}>The data quality adheres to policy (Operator evaluation)</label>
                </div>            
            </div>
            {!this.props.readOnly && <div className="p-grid p-justify-start">
                <div className="p-col-1">
                <Button disabled={!this.state.content || this.props.readOnly} label="Next" className="p-button-primary" icon="pi pi-check" onClick={ this.Next } />
                </div>
                <div className="p-col-1">
                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '88px' }} 
                                onClick={(e) => { this.props.onCancel()}} />
                </div>
            </div>}
        </div>
        </>
    )
};
                   
}
export default QAreporting;