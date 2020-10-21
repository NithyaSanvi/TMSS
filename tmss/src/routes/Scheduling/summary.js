import React, {Component} from 'react';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import moment from 'moment';
import ViewTable from '../../components/ViewTable';

/**
 * Component to view summary of the scheduling unit with limited task details
 */
export class SchedulingUnitSummary extends Component {

    constructor(props) {
        super(props);
        this.state = {
            schedulingUnit: props.schedulingUnit || null
        }
        this.closeSUDets = this.closeSUDets.bind(this);
    }

    componentDidMount() {}

    closeSUDets() {
        if(this.props.closeCallback) {
            this.props.closeCallback();
        }
    }

    render() {
        const schedulingUnit = this.props.schedulingUnit;
        const suTaskList = this.props.suTaskList;
        return (
            <React.Fragment>
            { schedulingUnit &&
                <div className="p-grid timeline-details-pane" style={{marginTop: '10px'}}>
                    <h6 className="col-lg-10 col-sm-10">Details</h6>
                    <Link to={`/schedulingunit/view/blueprint/${schedulingUnit.id}`} title="View Full Details"><i className="fa fa-eye"></i></Link>
                    <Link to={`/su/timelineview`} onClick={this.closeSUDets} title="Close Details"><i className="fa fa-times"></i></Link>
                    <div className="col-4"><label>Name:</label></div>
                    <div className="col-8">{schedulingUnit.name}</div>
                    <div className="col-4"><label>Project:</label></div>
                    <div className="col-8">{schedulingUnit.project.name}</div>
                    <div className="col-4"><label>Start Time:</label></div>
                    <div className="col-8">{moment.utc(schedulingUnit.start_time).format("DD-MMM-YYYY HH:mm:ss")}</div>
                    <div className="col-4"><label>Stop Time:</label></div>
                    <div className="col-8">{moment.utc(schedulingUnit.stop_time).format("DD-MMM-YYYY HH:mm:ss")}</div>
                    <div className="col-4"><label>Status:</label></div>
                    <div className="col-8">{schedulingUnit.status}</div>
                    <div className="col-12">
                        <ViewTable 
                            data={suTaskList} 
                            defaultcolumns={[{id: "ID", start_time:"Start Time", stop_time:"End Time", status: "Status", 
                                                antenna_set: "Antenna Set", band: 'Band'}]}
                            optionalcolumns={[{actionpath: "actionpath"}]}
                            columnclassname={[{"ID": "filter-input-50", "Start Time": "filter-input-75", "End Time": "filter-input-75",
                                                "Status": "filter-input-75", "Antenna Set": "filter-input-75", "Band": "filter-input-75"}]}
                            defaultSortColumn= {[{id: "ID", desc: false}]}
                            showaction="false"
                            tablename="timeline_su_taskslist"
                            showTopTotal={false}
                            showGlobalFilter={false}
                            showColumnFilter={false}
                            allowColumnSelection={false}
                        />
                    </div>
                </div>
            }
            </React.Fragment>
        );
    }
}

export default SchedulingUnitSummary;