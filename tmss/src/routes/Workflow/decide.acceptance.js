  
import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import { Checkbox } from 'primereact/checkbox';
import WorkflowService from '../../services/workflow.service';

class DecideAcceptance extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content: '',
            comment: '',  
            showEditor: false,           
            sos_accept_after_pi: true,
            pi_accept: true,
            quality_within_policy: true,
            sos_accept_show_pi: true
        };
        this.Next = this.Next.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onChangePIComment = this.onChangePIComment.bind(this);
        this.getQADecideAcceptance = this.getQADecideAcceptance.bind(this);
    }

    async componentDidMount() {
        if (this.props.readOnly) {
            this.getQADecideAcceptance();
        }
        const qaSOSResponse = await WorkflowService.getQAReportingSOS(this.props.process.qa_reporting_sos);
        const piVerificationResponse = await WorkflowService.getQAPIverification(this.props.process.pi_verification);
        this.setState({
            content: qaSOSResponse.sos_report,
            comment: piVerificationResponse.pi_report,
            // pi_accept: piVerificationResponse.pi_accept,
            // quality_within_policy: piVerificationResponse.quality_within_policy,
            // sos_accept_show_pi: piVerificationResponse.sos_accept_show_pi
        });
    }

    async getQADecideAcceptance() {
        if (!this.props.process.decide_acceptance) {
            return
        }
        const decideAcceptanceResponse = await WorkflowService.getQADecideAcceptance(this.props.process.decide_acceptance);
        this.setState({
            sos_accept_after_pi: decideAcceptanceResponse.sos_accept_after_pi
        });
    }

     // Method will trigger on change of operator report sun-editor
     handleChange(e) {
        if (e === '<p><br></p>') {
            this.setState({ content: '' });
            return;
        }
        this.setState({ content: e });
    }

    async Next() {
        const currentWorkflowTask = await this.props.getCurrentTaskDetails();
        const promise = [];
        if (currentWorkflowTask && !currentWorkflowTask.fields.owner) {
            promise.push(WorkflowService.updateAssignTo(currentWorkflowTask.pk, { owner: this.state.assignTo }));
        }
        promise.push(WorkflowService.updateQA_Perform(this.props.id, {"sos_accept_after_pi":this.state.sos_accept_after_pi}));
        Promise.all(promise).then((responses) => {
            if (responses.indexOf(null)<0) {
                this.props.onNext({ report: this.state.content , pireport: this.state.comment});
            }   else {
                this.props.onError();
            } 
        });
       
    }
    

    //PI Comment Editor
    onChangePIComment(a) {
        if (a === '<p><br></p>') {
            this.setState({ comment: '' });
            return;
        }
        this.setState({comment: a});
     }

    render() {
        return (
            <>
                <div className={`p-fluid-grid ${this.props.readOnly ? 'disableContainer' : ''}`}>
                    <label htmlFor="operatorReport" >Operator Report</label>
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
                        <div style={{ padding: '2px' }} dangerouslySetInnerHTML={{ __html: this.state.content }}></div>
                
                        <label htmlFor="piReport">PI Report</label>
                            {this.state.showEditor && <SunEditor setDefaultStyle="min-height: 250px; height: auto;" enableToolbar={true}
                                onChange={this.onChangePIComment}
                                setContents={this.state.comment}
                                setOptions={{
                                    buttonList: [
                                        ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video', 'italic', 'strike', 'subscript',
                                            'superscript', 'outdent', 'indent', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'removeFormat']
                                    ]
                                }}
                            />}
                        <div style={{ padding: '2px' }} dangerouslySetInnerHTML={{ __html: this.state.comment }}></div>                        
                            
                        <div className="p-fluid-grid" style={{ padding: '2px' }}>
                            <Checkbox disabled inputId="quality_within_policy" checked={this.state.quality_within_policy} onChange={e => this.setState({quality_within_policy: e.checked})} />
                            <label htmlFor="qualityPolicy"  style={{paddingLeft:"5px"}}>The data quality adheres to policy (Operator evaluation)</label>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <Checkbox disabled inputId="sos_accept_show_pi" checked={this.state.sos_accept_show_pi} onChange={e => this.setState({ sos_accept_show_pi: e.checked })} />
                            <label htmlFor="sdcoAccept" style={{paddingLeft:"5px"}}>The data quality adheres to policy (SDCO evaluation)</label>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <Checkbox disabled inputId="binary" checked={this.state.pi_accept} onChange={e => this.setState({ pi_accept: e.checked })} />
                            <label htmlFor="piAccept" style={{paddingLeft:"5px"}} >As PI / contact author I accept this data</label>
                            <div className="col-lg-3 col-md-3 col-sm-6"></div>
                            <Checkbox inputId="binary" checked={this.state.sos_accept_after_pi} onChange={e => this.setState({ sos_accept_after_pi: e.checked })} />
                            <label htmlFor="piAccept" style={{paddingLeft:"5px"}}>Final data acceptance (SDCO/TO)</label>
                        </div>

                        <div className="p-fluid-grid" style={{ padding: '2px' }}>
                          <label htmlFor="addline"  style={{paddingLeft:"2px"},{color:"black"}}>Submitting this form will start the ingest (if not auto-ingested) and data removal of unpinned data.</label>
                        </div>                                 
                    </div>
                    {!this.props.readOnly && <div className="p-grid" style={{ marginTop: '20px' }}>
                        <div className="p-col-1">
                            <Button label="Next" className="p-button-primary" icon="pi pi-check" onClick = { this.Next } disabled={!this.state.content || this.props.readOnly}/>
                        </div>
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '90px' }}
                                onClick={(e) => { this.props.onCancel()}} />
                        </div>
                    </div>}
            </>
        )
    };
}
export default DecideAcceptance;