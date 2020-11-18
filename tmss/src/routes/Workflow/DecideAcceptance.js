import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';


class Dacceptance extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content: props.report,
            piComment: props.piComment,
            showEditor: false,
            checked: false,

        };
        this.handleChange = this.handleChange.bind(this);
        this.onChangePIComment = this.onChangePIComment.bind(this);
    }

    handleChange(e) {
        this.setState({
            content: e

        });
        localStorage.setItem('report_qa', e);
    }

    onChangePIComment(e) {
        this.setState({
            piComment: e.target.value
        });
        localStorage.setItem('pi_comment', e.target.value);
    }


    render() {
        return (
            <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">PI Report</label>
                            <div className="col-lg-12 col-md-12 col-sm-12">
                                {/* <InputTextarea rows={3} cols={40}
                                    tooltip="PIReport" tooltipOptions={this.tooltipOptions} maxLength="128"
                                    data-testid="PIReport"
                                    value={this.state.piComment}
                                    onChange={this.onChangePIComment}
                                /> */}
                                {this.state.piComment}
                            </div>
                        </div>
                        <div className="p-grid" style={{ padding: '10px' }}>
                            <label htmlFor="comments" >Operator Report</label>
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
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">SDOC After PI</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <div className="p-field-checkbox">
                                    <Checkbox inputId="binary" checked={this.state.checked} onChange={e => this.setState({ checked: e.checked })} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-grid" style={{ marginTop: '20px' }}>
                        <div className="p-col-1">
                            <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={() => this.setState({ showEditor: false })} />
                        </div>
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={() => this.setState({ showEditor: false })} />
                        </div>
                    </div>

                </div>
            </>

        )
    };
}
export default Dacceptance;