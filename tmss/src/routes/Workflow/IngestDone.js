import React, { Component } from 'react';
import { Button } from 'primereact/button';
import { Link } from 'react-router-dom';

class IngestDone extends Component {
    constructor(props) {
        super(props);
        this.state = { };
        this.onSave = this.onSave.bind(this);
    }

    onSave(){
        this.props.onNext({
            report: this.props.report,
            picomment: this.props.picomment
        });
    }
    
    render(){
        return(
               <>
                
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                        <label htmlFor="ingestTaskStatus" className="col-lg-2 col-md-2 col-sm-12">Ingest Task Status</label>
                        <div className="col-lg-3 col-md-3 col-sm-12">
                                <span>{this.props.task.status}</span>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="ingestTask" className="col-lg-2 col-md-2 col-sm-12">Ingest Task</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <a href={this.props.task.url}>{this.props.task.url}</a>
                            </div>
                            <label htmlFor="ingestMonitoring" className="col-lg-2 col-md-2 col-sm-12">Ingest Monitoring</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <Link to={{ pathname: `http://lexar003.control.lofar:9632/` }}>View Ingest Monitoring &nbsp;<span class="fas fa-desktop"></span></Link>
                            </div>
                        </div>
                    <div className="p-grid p-justify-start">
                    <div className="p-col-1">
                        <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.onSave} />
                    </div>
                    <div className="p-col-1">
                        <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '90px' }} />
                    </div>
                    </div>
                </div>
               </>
        )
    };
    
}
export default IngestDone;