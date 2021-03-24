import React, { Component } from 'react';
import { Button } from 'primereact/button';
import { Link } from 'react-router-dom';
import moment from 'moment';

class Scheduled extends Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.Next = this.Next.bind(this);
    }

    /**
     * Method will trigger on click Next buton
     * here onNext props coming from parent, where will handle redirection to other page
     */
    Next() {
        this.props.onNext({});
    }

    render() {
        return (
            <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Start Time</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <span>{this.props.schedulingUnit.start_time && moment(this.props.schedulingUnit.start_time).format("YYYY-MMM-DD HH:mm:SS")}</span>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">End Time</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <span>{this.props.schedulingUnit.stop_time && moment(this.props.schedulingUnit.stop_time).format("YYYY-MMM-DD HH:mm:SS")}</span>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Timeline</label>
                            <div className="col-lg-3 col-md-3 col-sm-12 block-list">
                                <Link to={{ pathname: '/su/timelineview' }}>TimeLine View &nbsp; <span class="fas fa-clock"></span></Link>
                                <Link to={{ pathname: '/su/timelineview/week' }}>Week Overview &nbsp; <span class="fas fa-calendar-alt"></span></Link>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Scheduling Method</label>
                            <div className="col-lg-3 col-md-3 col-sm-12 block-list">
                                <span>{this.props.schedulingUnit.scheduling_constraints_doc.scheduler}</span>
                            </div>
                        </div>
                    </div>

                    {!this.props.readOnly && <div className="p-grid p-justify-start">
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times" style={{ width: '90px' }} 
                                onClick={(e) => {this.props.onCancel()}} />
                        </div>
                    </div>}
                </div>
            </>
        )
    };

}
export default Scheduled;