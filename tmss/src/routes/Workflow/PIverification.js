import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import { Checkbox } from 'primereact/checkbox';
//import {InputTextarea} from 'primereact/inputtextarea';


class PIverification extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content: props.report,
            showEditor: false,

        };
        this.onSave = this.onSave.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onChangePIComment = this.onChangePIComment.bind(this);
    }

    /**
     * Method wiill triigger on change of operator report sun-editor
     */
    handleChange(e) {
        this.setState({
            content: e
        });
        localStorage.setItem('report_qa', e);
    }

    /**
     * Method will trigger on click save buton
     * here onNext props coming from parent, where will handle redirection to other page
     */
    onSave() {
        this.props.onNext({
            report: this.state.content,
            picomment: this.state.comment
        });
    }

    /**
     * Method wiill triigger on change of pi report sun-editor
     */
    onChangePIComment(a) {
        this.setState({
            comment: a
        });
        localStorage.setItem('comment_pi', a);
    }

    // Not using at present
    cancelCreate() {
        this.props.history.goBack();
    }

    render() {
        return (
            <>
                <div>
                    <div className="p-fluid">
                        <div className="p-grid" style={{ padding: '10px' }}>
                            <label htmlFor="operatorReport" >Operator Report</label>
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
                            <div dangerouslySetInnerHTML={{ __html: this.state.content }}></div>
                        </div>
                        <div className="p-grid" style={{ padding: '10px' }}>
                            <label htmlFor="piReport" >PI Report</label>
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
                            {/* <InputTextarea rows={3} cols={30}
                                    tooltip="PIReport" tooltipOptions={this.tooltipOptions} maxLength="128"
                                    data-testid="PIReport"
                                    value={this.state.piComment}
                                    onChange={this.onChangePIComment}
                            /> */}
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="piAccept" className="col-lg-2 col-md-2 col-sm-12">PI Accept</label>
                            <div className="p-field-checkbox">
                                <Checkbox inputId="binary" checked={this.state.checked} onChange={e => this.setState({ checked: e.checked })} />
                            </div>
                        </div>
                        <div className="p-grid" style={{ marginTop: '20px' }}>
                            <div className="p-col-1">
                                <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.onSave} />
                            </div>
                            <div className="p-col-1">
                                <Button label="Cancel" className="p-button-danger" icon="pi pi-times" style={{ width: '90px' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    };
}
export default PIverification;