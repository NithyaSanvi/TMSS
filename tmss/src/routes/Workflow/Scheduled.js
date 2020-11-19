import React, { Component } from 'react';
import { Button } from 'primereact/button';
import { Link } from 'react-router-dom';

class Scheduled extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.onSave = this.onSave.bind(this);
    }

    onSave(){
        this.props.onNext({
            report: this.props.report,
            picomment: this.props.picomment
        });
    }

    render() {
        return (
            <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Start Time</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <span>{this.props.schedulingUnit.start_time}</span>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">End Time</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <span>{this.props.schedulingUnit.stop_time}</span>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Timeline</label>
                            <div className="col-lg-3 col-md-3 col-sm-12 block-list">
                                <Link to={{ pathname: '/su/timelineview'}}>SU TimeLine View</Link>
                                <Link to={{ pathname: '/su/timelineview/week'}}>SU Weekly Timeline View</Link>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Scheduling Method</label>
                            <div className="col-lg-3 col-md-3 col-sm-12 block-list">
                                <span>{this.props.schedulingUnit.scheduling_constraints_doc.scheduler}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-grid p-justify-start">
                        <div className="p-col-1">
                            <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.onSave} />
                        </div>
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times" style={{ width: '90px' }} onClick={this.cancelCreate} />
                        </div>
                    </div>
                </div>
            </>
        )
    };

}
export default Scheduled;