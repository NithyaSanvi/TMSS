import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import { Checkbox } from 'primereact/checkbox';
import WorkflowService from '../../services/workflow.service';

class QAreportingSDCO extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content: '',
            showEditor: false,
            quality_within_policy: false,
            sos_accept_show_pi: false
        };
        this.Next = this.Next.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    async componentDidMount() {
        const response = await WorkflowService.getQAReportingTo(this.props.process.qa_reporting_to);
        this.setState({
            content: response.operator_report
        });
    }

    /**
     * Method will trigger on change of sun-editor
     */
    handleChange(e) {
        if (e === '<p><br></p>') {
            this.setState({ content: '' });
            return;
        }
        this.setState({ content: e });
    }

     /**
     * Method will trigger on click Next buton
     * here onNext props coming from parent, where will handle redirection to other page
     */
    async Next() {
        const currentWorkflowTask = await this.props.getCurrentTaskDetails();
        const promise = [];
        if (currentWorkflowTask && !currentWorkflowTask.fields.owner) {
            promise.push(WorkflowService.updateAssignTo(currentWorkflowTask.pk, { owner: this.state.assignTo }));
        }
        promise.push(WorkflowService.updateQA_Perform(this.props.id, {"sos_report": this.state.content, "sos_accept_show_pi": this.state.sos_accept_show_pi, "quality_within_policy": this.state.quality_within_policy}));
        Promise.all(promise).then((responses) => {
            if (responses.indexOf(null)<0) {
                this.props.onNext({ report: this.state.content });
            }   else {
                this.props.onError();
            }
        });
    }
  
    //Not using at present
    cancelCreate() {
        this.props.history.goBack();
    }

    render() {
        return (
            <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="qualityPolicy" className="col-lg-2 col-md-2 col-sm-12">Quality Policy</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <div className="p-field-checkbox">
                                <Checkbox inputId="quality_within_policy" checked={this.state.quality_within_policy} onChange={e => this.setState({quality_within_policy: e.checked})} />
                                </div>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="sdcoAccept" className="col-lg-2 col-md-2 col-sm-12">SDCO Accept</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <div className="p-field-checkbox">
                                    <Checkbox inputId="sos_accept_show_pi" checked={this.state.sos_accept_show_pi} onChange={e => this.setState({ sos_accept_show_pi: e.checked })} />
                                </div>
                            </div>
                        </div>
                        <div className="p-grid" style={{ padding: '10px' }}>
                        <label htmlFor="operatorReport" >
                               Operator Report {!this.state.showEditor && <span className="con-edit">(Click content to edit)</span>}
                               <span style={{color:'red'}}>*</span>
                            </label>
                           <div className="col-lg-12 col-md-12 col-sm-12"></div>
                           {this.state.showEditor && <SunEditor setDefaultStyle="min-height: 250px; height: auto" enableToolbar={true}
                                onChange={this.handleChange}
                                setContents={this.state.content}
                                setOptions={{
                                    buttonList: [
                                        ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video', 'italic', 'strike', 'subscript',
                                            'superscript', 'outdent', 'indent', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'removeFormat']
                                    ]
                                }}
                            />}
                            {!this.state.showEditor && <div onClick={() => this.setState({ showEditor: !this.state.showEditor })} className="operator-report" dangerouslySetInnerHTML={{ __html: this.state.content }}></div>}
                        </div>
                    </div>
                    <div className="p-grid" style={{ marginTop: '20px' }}>
                        <div className="p-col-1">
                            <Button label="Next" disabled= {!this.state.content} className="p-button-primary" icon="pi pi-check" onClick={ this.Next } />
                        </div>
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '90px' }} 
                                onClick={(e) => { this.props.onCancel()}} />
                        </div>
                    </div>
                </div>
            </>
        )
    };
}
export default QAreportingSDCO;