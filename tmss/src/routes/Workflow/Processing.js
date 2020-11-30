import React, { Component } from 'react';
import { Button } from 'primereact/button';

class ProcessingDone extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onSave = this.onSave.bind(this);
    }

    /**
     * Method will trigger on click save buton
     * here onNext props coming from parent, where will handle redirection to other page
     */
    onSave() {
        this.props.onNext({
            report: this.props.report,
            picomment: this.props.picomment
        });
    }

    render() {
        return (
            <div className="p-grid p-justify-start">
                <div className="p-col-1">
                    <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.onSave} />
                </div>
                <div className="p-col-1">
                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times" style={{ width: '90px' }} />
                </div>
            </div>
        )
    };
}
export default ProcessingDone;