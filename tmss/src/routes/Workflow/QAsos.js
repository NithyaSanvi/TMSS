import React, { Component } from 'react';
import { Button } from 'primereact/button';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File
import { Checkbox } from 'primereact/checkbox';

class QAreportingSDCO extends Component {
    constructor(props) {
        super(props);
        this.state = {
            content: props.report,
            showEditor: false,
            checked: false,
            pichecked: false

        };
        this.onSave = this.onSave.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    /**
     * Method wiill triigger on change of sun-editor
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
            piChecked: this.state.pichecked
        })
    }

    /**
     * Not using at present
     */
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
                                    <Checkbox inputId="binary" checked={this.state.checked} onChange={e => this.setState({ checked: e.checked })} />
                                </div>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="sdcoAccept" className="col-lg-2 col-md-2 col-sm-12">SDCO Accept</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <div className="p-field-checkbox">
                                    <Checkbox inputId="secondary" pichecked={this.state.pichecked} onChange={e => this.setState({ pichecked: e.pichecked })} />
                                </div>
                            </div>
                        </div>
                        <div className="p-grid" style={{ padding: '10px' }}>
                            <label htmlFor="operatorReport" >Operator Report</label>
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
                            {!this.state.showEditor && <Button onClick={() => this.setState({ showEditor: !this.state.showEditor })} className="tooltip-wrapper" tooltip="Click to Edit" tooltipOptions={{ position: 'top' }}><div dangerouslySetInnerHTML={{ __html: this.state.content }}></div></Button>}
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
            </>
        )
    };

}
export default QAreportingSDCO;