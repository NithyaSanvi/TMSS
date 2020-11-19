import React, { Component } from 'react';
import { Button } from 'primereact/button';
import ScheduleService from '../../services/schedule.service';
import SchedulingConstraint from './../Scheduling/Scheduling.Constraints';
import {TimelineView} from './../Timeline/view';
import {WeekTimelineView} from './../Timeline/week.view';

class Scheduled extends Component{
    constructor(props) {
        super(props);
        this.state={};
    }

    componentDidMount() {
        ScheduleService.getSchedulingUnitBlueprintById(this.props.match.params.id)
            .then(schedulingUnit => {
                this.setState({schedulingUnit: schedulingUnit});
            })
    }

    render() {
        return (
            <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                                    <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Start Time</label>
                                    <div className="col-lg-3 col-md-3 col-sm-12">
                                    <span>{this.state.schedulingUnit.start_time}</span>
                                    </div>
                                    <div className="col-lg-1 col-md-1 col-sm-12"></div>
                                    <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">End Time</label>
                                    <div className="col-lg-3 col-md-3 col-sm-12">
                                        <span>{this.state.schedulingUnit.stop_time}</span>
                                    </div>
                        </div>
                                {/* <div className="p-field p-grid">
                               <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Timeline</label>
                               <div className="col-lg-3 col-md-3 col-sm-12">
                               <span>{this.state.schedulingUnit.start_time}</span>
                               </div>
                               <div className="col-lg-1 col-md-1 col-sm-12"></div>
                               <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Week Overview</label>
                               <div className="col-lg-3 col-md-3 col-sm-12">
                                <span>{schedulingUnit.stop_time}</span>
                              </div>
                              </div>
                               <div className="p-field p-grid">
                                <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Scheduling Method</label>
                               <div className="col-lg-3 col-md-3 col-sm-12">
                                <span>{schedulingUnit.start_time}</span>
                               </div>
                              </div> */}
                        </div>
                    
                            <div className="p-grid p-justify-start">
                            <div className="p-col-1">
                                <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.onSave} />
                            </div>
                            <div className="p-col-1">
                                <Button label="Cancel" className="p-button-danger" icon="pi pi-times"  style={{ width : '90px' }} onClick={this.cancelCreate} />
                            </div>
                     </div>
                  </div>
            </>
        )};

}
export default Scheduled;