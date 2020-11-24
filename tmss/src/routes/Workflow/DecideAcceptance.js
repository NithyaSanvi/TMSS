import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import { Checkbox } from 'primereact/checkbox';

class DecideAcceptance extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content: props.report,
            picomment: props.picomment,  //PI Comment Field
            showEditor: false,           //Sun Editor
            checked: false,              //Checkbox

        };
        this.onSave = this.onSave.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onChangePIComment = this.onChangePIComment.bind(this);
    }

    handleChange(e) {
        this.setState({
            content: e
        });
        localStorage.setItem('report_qa', e);
    }

    onSave(){
        this.props.onNext({
            report: this.state.content,
            picomment: this.state.picomment
           
        });
    }
     
    //PI Comment Editor
    onChangePIComment(e) {
        this.setState({
            picomment: e.target.value
        });
        localStorage.setItem('pi_comment', e.target.value);
    }

    cancelCreate() {
        this.props.history.goBack();
    }


    render() {
        return (
            <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="piReport" className="col-lg-2 col-md-2 col-sm-12">PI Report</label>
                            <div className="col-lg-12 col-md-12 col-sm-12">
                            {this.state.showEditor && <SunEditor height="250" enableToolbar={true}
                                onChange={this.onChangePIComment}
                                setContents={this.state.picomment}
                                setOptions={{
                                    buttonList: [
                                        ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video', 'italic', 'strike', 'subscript',
                                            'superscript', 'outdent', 'indent', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'removeFormat']
                                    ]
                                }}
                            />}
                            <div dangerouslySetInnerHTML={{ __html: this.state.picomment }}></div>
                        </div>
                         </div>
                        <div className="p-grid" style={{ padding: '15px' }}>
                            <label htmlFor="operatorReport" >Operator Report</label>
                            <div className="col-lg-12 col-md-12 col-sm-12"></div>
                            {this.state.showEditor && <SunEditor height="250" enableToolbar={true}
                                onChange={this.handleChange}
                                setContents={this.state.content}
                                setOptions={{
                                    buttonList: [
                                        ['undo', 'redo', 'bold', 'underline', 'fontColor', 'table', 'link', 'image', 'video', 'italic', 'strike', 'subscript',
                                            'superscript', 'outdent', 'indent', 'fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'removeFormat']
                                    ]
                                }}
                            />}
                            <div dangerouslySetInnerHTML={{ __html: this.state.content }}></div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="operatorAccept" className="col-lg-2 col-md-2 col-sm-12">Operator Accept</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                             <Checkbox inputId="binary" checked={this.state.checked} onChange={e => this.setState({ checked: e.checked })} />
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="sdcoAccept" className="col-lg-2 col-md-2 col-sm-12">SDCO Accept</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                            <Checkbox inputId="binary" checked={this.state.checked} onChange={e => this.setState({ checked: e.checked })} />
                           </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="piAccept" className="col-lg-2 col-md-2 col-sm-12">PI Accept</label>
                            <div className="col-lg-3 col-md-3 col-sm-6">
                                <div className="p-field-checkbox">
                                    <Checkbox inputId="binary" checked={this.state.checked} onChange={e => this.setState({ checked: e.checked })} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-grid" style={{ marginTop: '20px' }}>
                        <div className="p-col-1">
                            <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.onSave} />
                        </div>
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '90px' }} onClick={this.cancelCreate} />
                        </div>
                    </div>

                </div>
            </>

        )
    };
}
export default DecideAcceptance;