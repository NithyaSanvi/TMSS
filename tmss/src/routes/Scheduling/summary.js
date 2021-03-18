import React, {Component} from 'react';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import moment from 'moment';
import _ from 'lodash';
import ViewTable from '../../components/ViewTable';
import { JsonToTable } from "react-json-to-table";
import SchedulingConstraints from './Scheduling.Constraints';
import UIConstants from '../../utils/ui.constants';
// import Stations from './Stations';

/**
 * Component to view summary of the scheduling unit with limited task details
 */
export class SchedulingUnitSummary extends Component {

    constructor(props) {
        super(props);
        this.state = {
            schedulingUnit: props.schedulingUnit || null
        };
        this.constraintsOrder = ['scheduler','time','daily','sky'];
        this.closeSUDets = this.closeSUDets.bind(this);
        this.setConstraintsEditorOutput = this.setConstraintsEditorOutput.bind(this);
    }

    componentDidMount() {}

    /**
     * Function to close the summary panel and call parent callback function to close.
     */
    closeSUDets() {
        if(this.props.closeCallback) {
            this.props.closeCallback();
        }
    }

    /**
     * Order the properties in the constraint object in the predefined order
     * @param {Object} constraintsDoc 
     */
    getOrderedConstraints(constraintsDoc, constraintsOrder) {
        let orderedConstraints = {};
        for(const constraintKey of constraintsOrder) {
            /* Format the object to remove empty values*/
            const constraint = this.getFormattedConstraint(constraintsDoc[constraintKey]);
            if (constraint) {
                orderedConstraints[constraintKey.replace('_',' ')] = constraint;
            }
        }
        return orderedConstraints;
    }

    /**
     * Format the constraint object i.e removes the empty values to show only available values.
     * @param {Object} constraint 
     */
    getFormattedConstraint(constraint) {
        if (constraint) {
            const objectType = typeof constraint;
            switch(objectType) {
                case "string": {
                    try {
                        const dateConstraint = moment.utc(constraint);
                        if (dateConstraint.isValid()) {
                            constraint = dateConstraint.format(UIConstants.CALENDAR_DATETIME_FORMAT);
                        }
                    } catch (error) {}
                    break;
                }
                case "boolean": {
                    constraint = constraint?'Yes':null;
                    break;
                }
                case "object": {
                    if (Array.isArray(constraint)) {
                        let newArray = []
                        for (let arrayObj of constraint) {
                            arrayObj = this.getFormattedConstraint(arrayObj);
                            if (arrayObj) {
                                newArray.push(arrayObj);
                            }
                        }
                        constraint = newArray.length > 0?newArray:null;
                    }   else {
                        let newObject = {};
                        let keys = _.keys(constraint);
                        if (keys.indexOf('from')>=0 & keys.indexOf('to')>=0) {
                            constraint = this.getOrderedConstraints(constraint, ['from', 'to']);
                        }
                        for (const objectKey of _.keys(constraint)) {
                            let object = this.getFormattedConstraint(constraint[objectKey]);
                            if (object) {
                                newObject[objectKey.replace(/_/g, ' ')] = object;
                            }
                        }
                        constraint = (!_.isEmpty(newObject))? newObject:null;
                    }
                    break;
                }
                default: {}
            }
        }
        return constraint;
    }

    /**
     * Gets the output from the SchedulingConstraints editor without output formatting so that the values entered in the 
     * editor can be shown in the summary without any conversion.
     * @param {Object} jsonOutput 
     */
    setConstraintsEditorOutput(jsonOutput) {
        this.setState({constraintsDoc: jsonOutput});
    }

    redirectToSUDetails = () => {
        if (!this.props.redirectNewWindow) {
            this.props.history.push(`/schedulingunit/view/blueprint/${this.props.schedulingUnit.id}`);
        } else {
            window.open(`/schedulingunit/view/blueprint/${this.props.schedulingUnit.id}`, '_blank');
        }
    }


    render() {
        const schedulingUnit = this.props.schedulingUnit;
        const suTaskList = this.props.suTaskList;
        suTaskList.map(task=>task.typeValue = task.specifications_template.type_value);
        const constraintsTemplate = this.props.constraintsTemplate;
        // After receiving output from the SchedulingConstraint editor order and format it to display
        let constraintsDoc = this.state.constraintsDoc?this.getOrderedConstraints(this.state.constraintsDoc, this.constraintsOrder):null;
        return (
            <React.Fragment>
            { schedulingUnit &&
                <div className="p-grid timeline-details-pane" style={{marginTop: '10px'}}>
                    <h6 className="col-lg-10 col-sm-10">Details</h6>
                    <Link onClick={this.redirectToSUDetails} title="View Full Details"><i className="fa fa-eye"></i></Link>
                    <Link to={this.props.location?this.props.location.pathname:"/su/timelineview"} onClick={this.closeSUDets} title="Close Details"><i className="fa fa-times"></i></Link>
                    <div className="col-4"><label>Name:</label></div>
                    <div className="col-8">{schedulingUnit.name}</div>
                    <div className="col-4"><label>Project:</label></div>
                    <div className="col-8">{schedulingUnit.project}</div>
                    <div className="col-4"><label>Start Time:</label></div>
                    <div className="col-8">{moment.utc(schedulingUnit.start_time).format(UIConstants.CALENDAR_DATETIME_FORMAT)}</div>
                    <div className="col-4"><label>Stop Time:</label></div>
                    <div className="col-8">{moment.utc(schedulingUnit.stop_time).format(UIConstants.CALENDAR_DATETIME_FORMAT)}</div>
                    <div className="col-4"><label>Status:</label></div>
                    <div className="col-8">{schedulingUnit.status}</div>
                    {constraintsTemplate && schedulingUnit.suDraft.scheduling_constraints_doc && 
                        <>
                            {/* SchedulingConstraints editor to pass the scheduling_constraints_doc and get the editor output to User entry format and conversions */}
                            <div style={{display: "none"}}>
                            <SchedulingConstraints constraintTemplate={constraintsTemplate} disable 
                                formatOutput={false} initValue={schedulingUnit.suDraft.scheduling_constraints_doc}
                                callback={this.setConstraintsEditorOutput} />
                            </div>
                            {/* Scheduling Constraint Display in table format */}
                            {constraintsDoc &&
                                <>
                                <div className="col-12 constraints-summary">
                                    <label>Constraints:</label>
                                    <JsonToTable json={constraintsDoc} />
                                </div>
                                </>
                            }
                        </>
                    }

                    {/* {<Stations
                        stationGroup={this.props.stationGroup}
                        view
                        isSummary
                    />} */}
                    <div className="col-12"><label>Stations:</label></div>
                    <div className="col-12 station-list">
                        {this.props.stationGroup && this.props.stationGroup.map((station, index) => (
                            <div key={`stn-${index}`}>{station}</div>
                        ))}

                    </div>

                    <div className="col-12 task-summary">
                        <label>Tasks:</label>
                        <ViewTable 
                            data={suTaskList} 
                            defaultcolumns={[{id: "ID", name: "Name", typeValue:"Type", subTaskID: 'Control ID', start_time:"Start Time", stop_time:"End Time", status: "Status", 
                                                antenna_set: "Antenna Set", band: 'Band'}]}
                            optionalcolumns={[{actionpath: "actionpath"}]}
                            columnclassname={[{"ID": "filter-input-50","Name":"filter-input-75","Type":"filter-input-75","Control ID":"filter-input-75", "Start Time": "filter-input-75", "End Time": "filter-input-75",
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