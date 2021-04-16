import React, {Component} from 'react';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import moment from 'moment';
import _ from 'lodash';
import { JsonToTable } from "react-json-to-table";
import UIConstants from '../../utils/ui.constants';
import UnitConverter from '../../utils/unit.converter';

/**
 * Component to view summary of the Reservation
 */
export class ReservationSummary extends Component {

    constructor(props) {
        super(props);
        this.closeSUDets = this.closeSUDets.bind(this);
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
     * Function to order or format all specifications to readable values
     * @param {Object} specifications 
     */
    getOrderedSpecifications(specifications) {
        for (const specKey of _.keys(specifications)) {
            let specification = this.getFormattedSpecification(specifications[specKey]);
            specifications[specKey] = specification;
        }
        return specifications;
    }

    /**
     * Function to format date, boolean, array object to readable values
     * @param {Object} specification 
     */
    getFormattedSpecification(specification) {
        if (specification !== null) {
            const objectType = typeof specification;
            switch(objectType) {
                case "string": {
                    try {
                        const dateValue = moment.utc(specification);
                        if (dateValue.isValid()) {
                            specification = dateValue.format(UIConstants.CALENDAR_DATETIME_FORMAT);
                        }
                    } catch (error) {}
                    break;
                }
                case "boolean": {
                    specification = specification?'True':'False';
                    break;
                }
                case "object": {
                    if (Array.isArray(specification)) {
                        let newArray = [], isStringArray = false;
                        for (let arrayObj of specification) {
                            arrayObj = this.getFormattedSpecification(arrayObj);
                            if (arrayObj) {
                                if ((typeof arrayObj) === "string") {
                                    isStringArray = true;
                                }
                                newArray.push(arrayObj);
                            }
                        }
                        specification = newArray.length > 0?(isStringArray?newArray.join(", "):newArray):null;
                    }   else {
                        let newObject = {};
                        let keys = _.keys(specification);
                        for (const objectKey of _.keys(specification)) {
                            let object = this.getFormattedSpecification(specification[objectKey]);
                            if (object) {
                                newObject[objectKey.replace(/_/g, ' ')] = object;
                            }
                        }
                        specification = (!_.isEmpty(newObject))? newObject:null;
                    }
                    break;
                }
                default: {}
            }
        }
        return specification;
    }

    render() {
        const reservation = this.props.reservation;
        let specifications = reservation?_.cloneDeep(reservation.specifications_doc):null;
        if (specifications) {
            // Remove $schema variable
            delete specifications['$schema'];
        }
        return (
            <React.Fragment>
            { reservation &&
                <div className="p-grid timeline-details-pane" style={{marginTop: '10px'}}>
                    <h6 className="col-lg-10 col-sm-10">Reservation Details</h6>
                    {/* TODO: Enable the link once Reservation view page is created */}
                    {/* <Link to={`/su/timeline/reservation/view/${reservation.id}`} title="View Full Details" ><i className="fa fa-eye"></i></Link> */}
                    <i className="fa fa-eye" style={{color: 'grey'}}></i>
                    <Link to={this.props.location?this.props.location.pathname:"/su/timelineview"} onClick={this.closeSUDets} title="Close Details"><i className="fa fa-times"></i></Link>
                    <div className="col-4"><label>Name:</label></div>
                    <div className="col-8">{reservation.name}</div>
                    <div className="col-4"><label>Description:</label></div>
                    <div className="col-8">{reservation.description}</div>
                    <div className="col-4"><label>Project:</label></div>
                    <div className="col-8">{reservation.project}</div>
                    <div className="col-4"><label>Start Time:</label></div>
                    <div className="col-8">{moment.utc(reservation.start_time).format(UIConstants.CALENDAR_DATETIME_FORMAT)}</div>
                    <div className="col-4"><label>Stop Time:</label></div>
                    <div className="col-8">{moment.utc(reservation.stop_time).format(UIConstants.CALENDAR_DATETIME_FORMAT)}</div>
                    <div className="col-4"><label>Duration (HH:mm:ss):</label></div>
                    <div className="col-8">{UnitConverter.getSecsToHHmmss(reservation.duration)}</div>
                    {/* Reservation parameters Display in table format */}
                    {reservation.specifications_doc &&
                        <>
                        <div className="col-12 constraints-summary">
                            <label>Parameters:</label>
                            <JsonToTable json={this.getOrderedSpecifications(specifications)} />
                        </div>
                        </>
                    }
                </div>
            }
            </React.Fragment>
        );
    }
}

export default ReservationSummary;