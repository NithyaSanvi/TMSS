import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import { Checkbox } from 'primereact/checkbox';
import WorkflowService from '../../services/workflow.service';
//import {InputTextarea} from 'primereact/inputtextarea';

class PIverification extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content: '',
            comment: '',
            showEditor: false,
            pi_accept: true,
            quality_within_policy: true,
            sos_accept_show_pi: true
        };
        this.Next = this.Next.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onChangePIComment = this.onChangePIComment.bind(this);
        this.getPIVerificationDetails = this.getPIVerificationDetails.bind(this);
    }

    async componentDidMount() {
        if (this.props.readOnly) {
            this.getPIVerificationDetails();
        }
        const response = await WorkflowService.getQAReportingSOS(this.props.process.qa_reporting_sos);
        this.setState({
            content: response.sos_report,
            // quality_within_policy: response.quality_within_policy,
            // sos_accept_show_pi: response.sos_accept_show_pi
        });
    }

    async getPIVerificationDetails() {
        if (!this.props.process.pi_verification) {
            return
        }
        const piVerificationResponse = await WorkflowService.getQAPIverification(this.props.process.pi_verification);
        this.setState({
            comment: piVerificationResponse.pi_report,
            pi_accept: piVerificationResponse.pi_accept,
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

    /**
     * Method will trigger on click save button
     * here onNext props coming from parent, where will handle redirection to other page
     */
    async Next() {
        const currentWorkflowTask = await this.props.getCurrentTaskDetails();
        const promise = [];
        if (currentWorkflowTask && !currentWorkflowTask.fields.owner) {
            promise.push(WorkflowService.updateAssignTo(currentWorkflowTask.pk),{ owner: this.state.assignTo });
        }
        promise.push(WorkflowService.updateQA_Perform(this.props.id,{"pi_report": this.state.comment, "pi_accept": this.state.pi_accept}));
        Promise.all(promise).then((responses) => {
            if (responses.indexOf(null)<0) {
                this.props.onNext({ report:this.state.content, pireport: this.state.comment});
            }   else {
                this.props.onError();
            }
        });
    }

     /**
     * Method wiill triigger on change of pi report sun-editor
     */
    onChangePIComment(a) {
        if (a === '<p><br></p>') {
            this.setState({ comment: '' });
            return;
        }
        this.setState({comment: a  });
    }

    render() {
        return (
            <>
             <div>
                  <div className={`p-fluid-grid ${this.props.readOnly ? 'disableContainer' : ''}`}>
                        <div className="p-fluid-grid">
                            <label htmlFor="operatorReport" style={{ padding: '2px' }} >Operator Report</label>
                            <div className="col-lg-12 col-md-12 col-sm-12"></div>
                            {this.state.showEditor && <SunEditor setDefaultStyle="min-height: 250px; height: auto;" enableToolbar={true}
                                onChange={this.handleChange}
                                setContents={this.state.content}
                                setOptions={{
                                    buttonList: [
                                        ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video', 'italic', 'strike', 'subscript',
                                            'superscript', 'outdent', 'indent', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'removeFormat']
                                    ]
                                }}
                            />}
                             <div className="operator-report" style={{ padding: '5px' }} dangerouslySetInnerHTML={{ __html: this.state.content }}></div>
                        </div>
                        <div className="p-grid" style={{ padding: '10px' }}>
                            <label htmlFor="piReport" >PI Report<span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-12 col-md-12 col-sm-12"></div>
                            <SunEditor setDefaultStyle="min-height: 150px; height: auto;" enableToolbar={true}
                                setContents={this.state.comment}
                                onChange={this.onChangePIComment}
                                setOptions={{
                                    buttonList: [
                                        ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video', 'italic', 'strike', 'subscript',
                                            'superscript', 'outdent', 'indent', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'removeFormat']
                                    ]
                                }} />
                            </div>      
                            <Checkbox disabled inputId="quality_within_policy" checked={this.state.quality_within_policy} onChange={e => this.setState({quality_within_policy: e.checked})} />
                            <label htmlFor="qualityPolicy"  style={{paddingLeft:"5px"}}>The data quality adheres to policy (Operator evaluation)</label>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <Checkbox disabled inputId="sos_accept_show_pi" checked={this.state.sos_accept_show_pi} onChange={e => this.setState({ sos_accept_show_pi: e.checked })} />
                            <label htmlFor="sdcoAccept" style={{paddingLeft:"5px"}}>The data quality adheres to policy (SDCO evaluation)</label>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <Checkbox inputId="binary" checked={this.state.pi_accept} onChange={e => this.setState({ pi_accept: e.checked })} />
                            <label htmlFor="piAccept" style={{paddingLeft:"5px"}} >As PI / contact author I accept this data</label>
                            {!this.props.readOnly && <div className="p-grid" style={{ marginTop: '20px' }}>
                                <div className="p-col-1">
                                    <Button disabled={!this.state.content || this.props.readOnly || !this.state.comment} label="Next" className="p-button-primary" icon="pi pi-check" onClick={ this.Next } />
                                </div>
                                <div className="p-col-1">
                                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '90px' }}
                                        onClick={(e) => { this.props.onCancel()}} />
                                </div>
                            </div>}
                        </div>  
                </div>
            </>
        )
    };
}
export default  PIverification;
