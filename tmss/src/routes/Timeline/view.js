import React, {Component} from 'react';
import { Redirect } from 'react-router-dom/cjs/react-router-dom.min';
import moment from 'moment';
import _ from 'lodash';

// import SplitPane, { Pane }  from 'react-split-pane';
import {InputSwitch} from 'primereact/inputswitch';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import Timeline from '../../components/Timeline';
import ViewTable from '../../components/ViewTable';

import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import UtilService from '../../services/util.service';

import UnitConverter from '../../utils/unit.converter';
import SchedulingUnitSummary from '../Scheduling/summary';
import { Dropdown } from 'primereact/dropdown';

// Color constant for status
const STATUS_COLORS = { "ERROR": "FF0000", "CANCELLED": "#00FF00", "DEFINED": "#00BCD4", 
                        "SCHEDULABLE":"#0000FF", "SCHEDULED": "#abc", "OBSERVING": "#bcd",
                        "OBSERVED": "#cde", "PROCESSING": "#cddc39", "PROCESSED": "#fed",
                        "INGESTING": "#edc", "FINISHED": "#47d53d"};

const RESERVATION_COLORS = {"true-true":{bgColor:"lightgrey", color:"#585859"}, "true-false":{bgColor:'#585859', color:"white"},
                            "false-true":{bgColor:"#9b9999", color:"white"}, "false-false":{bgColor:"black", color:"white"}};

/**
 * Scheduling Unit timeline view component to view SU List and timeline
 */
export class TimelineView extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            suBlueprints: [],       // Scheduling Unit Blueprints
            suDrafts: [],           // Scheduling Unit Drafts
            suBlueprintList: [],    // SU Blueprints filtered to view
            group:[],               // Timeline group from scheduling unit draft name
            items:[],               // Timeline items from scheduling unit blueprints grouped by scheduling unit draft
            isSUDetsVisible: false,
            canExtendSUList: true,
            canShrinkSUList: false,
            selectedItem: null,
            suTaskList:[],
            isSummaryLoading: false,
            stationGroup: [],
            reservationFilter: null,
        }
        this.STATUS_BEFORE_SCHEDULED = ['defining', 'defined', 'schedulable'];  // Statuses before scheduled to get station_group
        this.allStationsGroup = [];
        this.reservations = [];
        this.reservationReasons = [];

        this.onItemClick = this.onItemClick.bind(this);
        this.closeSUDets = this.closeSUDets.bind(this);
        this.dateRangeCallback = this.dateRangeCallback.bind(this);
        this.resizeSUList = this.resizeSUList.bind(this);
        this.suListFilterCallback = this.suListFilterCallback.bind(this);
        this.addStationReservations = this.addStationReservations.bind(this);
    }

    async componentDidMount() {
        // Fetch all details from server and prepare data to pass to timeline and table components
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingUnitBlueprint(),
                            ScheduleService.getSchedulingUnitDraft(),
                            ScheduleService.getSchedulingSets(),
                            UtilService.getUTC(),
                            ScheduleService.getStations('All')] ;
        Promise.all(promises).then(async(responses) => {
            const projects = responses[0];
            const suBlueprints = _.sortBy(responses[1].data.results, 'name');
            const suDrafts = responses[2].data.results;
            const suSets = responses[3];
            const group = [], items = [];
            const currentUTC = moment.utc(responses[4]);
            const defaultStartTime = currentUTC.clone().add(-24, 'hours');      // Default start time, this should be updated if default view is changed.
            const defaultEndTime = currentUTC.clone().add(24, 'hours');         // Default end time, this should be updated if default view is changed.
            let suList = [];
            for (const suDraft of suDrafts) {
                const suSet = suSets.find((suSet) => { return suDraft.scheduling_set_id===suSet.id});
                const project = projects.find((project) => { return suSet.project_id===project.name});
                if (suDraft.scheduling_unit_blueprints.length > 0) {
                    for (const suBlueprintId of suDraft.scheduling_unit_blueprints_ids) {
                        const suBlueprint = _.find(suBlueprints, {'id': suBlueprintId});
                        suBlueprint['actionpath'] = `/schedulingunit/view/blueprint/${suBlueprintId}`;
                        suBlueprint.suDraft = suDraft;
                        suBlueprint.project = project.name;
                        suBlueprint.suSet = suSet;
                        suBlueprint.durationInSec = suBlueprint.duration;
                        suBlueprint.duration = UnitConverter.getSecsToHHmmss(suBlueprint.duration);
                        // Load subtasks also to get stations from subtask if status is before scheduled
                        const loadSubtasks = this.STATUS_BEFORE_SCHEDULED.indexOf(suBlueprint.status.toLowerCase()) < 0 ;
                        // Select only blueprints with start_time and stop_time in the default time limit
                        if (suBlueprint.start_time && 
                            (moment.utc(suBlueprint.start_time).isBetween(defaultStartTime, defaultEndTime) ||
                             moment.utc(suBlueprint.stop_time).isBetween(defaultStartTime, defaultEndTime))) {
                            // suBlueprint.tasks = await ScheduleService.getTaskBlueprintsBySchedulingUnit(suBlueprint, true);
                            suBlueprint.tasks = await ScheduleService.getTaskBlueprintsBySchedulingUnit(suBlueprint, true, loadSubtasks);
                            items.push(this.getTimelineItem(suBlueprint));
                            if (!_.find(group, {'id': suDraft.id})) {
                                group.push({'id': suDraft.id, title: suDraft.name});
                            }
                            suList.push(suBlueprint);
                        }   else if (suBlueprint.start_time) {  // For other SUs with start_time load details asynchronously
                            ScheduleService.getTaskBlueprintsBySchedulingUnit(suBlueprint, true, loadSubtasks)
                                .then(tasks => {
                                    suBlueprint.tasks = tasks;
                            })
                        }
                    }
                }
            }
            for (const station of responses[5]['stations']) {
                this.allStationsGroup.push({id: station, title: station});
            }
            // Fetch Reservations and keep ready to use in station view
            UtilService.getReservations().then(reservations => {
                this.reservations = reservations;
            });
            UtilService.getReservationTemplates().then(templates => {
                this.reservationTemplate = templates.length>0?templates[0]:null;
                if (this.reservationTemplate) {
                    let reasons = this.reservationTemplate.schema.properties.activity.properties.type.enum;
                    for (const reason of reasons) {
                        this.reservationReasons.push({name: reason});
                    }
                }
            });
            this.setState({suBlueprints: suBlueprints, suDrafts: suDrafts, group: group, suSets: suSets,
                            projects: projects, suBlueprintList: suList,
                            items: items, currentUTC: currentUTC, isLoading: false,
                            currentStartTime: defaultStartTime, currentEndTime: defaultEndTime});
        });
    }

    /**
     * Function to get/prepare Item object to be passed to Timeline component
     * @param {Object} suBlueprint 
     */
    getTimelineItem(suBlueprint) {
        let item = { id: suBlueprint.id, 
            group: suBlueprint.suDraft.id,
            title: `${suBlueprint.project} - ${suBlueprint.suDraft.name} - ${(suBlueprint.durationInSec/3600).toFixed(2)}Hrs`,
            project: suBlueprint.project, type: 'SCHEDULE',
            name: suBlueprint.suDraft.name,
            duration: suBlueprint.durationInSec?`${(suBlueprint.durationInSec/3600).toFixed(2)}Hrs`:"",
            start_time: moment.utc(suBlueprint.start_time),
            end_time: moment.utc(suBlueprint.stop_time),
            bgColor: suBlueprint.status? STATUS_COLORS[suBlueprint.status.toUpperCase()]:"#2196f3",
            // selectedBgColor: suBlueprint.status? STATUS_COLORS[suBlueprint.status.toUpperCase()]:"#2196f3"}; 
            selectedBgColor: "none",
            status: suBlueprint.status.toLowerCase()};
        return item;
    }

    /**
     * Callback function to pass to Timeline component for item click.
     * @param {Object} item 
     */
    onItemClick(item) {
        if (this.state.isSUDetsVisible && item.id===this.state.selectedItem.id) {
            this.closeSUDets();
        }   else {
            const fetchDetails = !this.state.selectedItem || item.id!==this.state.selectedItem.id
            this.setState({selectedItem: item, isSUDetsVisible: true, 
                isSummaryLoading: fetchDetails,
                suTaskList: !fetchDetails?this.state.suTaskList:[],
                canExtendSUList: false, canShrinkSUList:false});
            if (fetchDetails) {
                const suBlueprint = _.find(this.state.suBlueprints, {id: (this.state.stationView?parseInt(item.id.split('-')[0]):item.id)});
                ScheduleService.getTaskBPWithSubtaskTemplateOfSU(suBlueprint)
                    .then(taskList => {
                        for (let task of taskList) {
                            //Control Task Id
                            const subTaskIds = (task.subTasks || []).filter(sTask => sTask.subTaskTemplate.name.indexOf('control') > 1);
                            task. subTaskID = subTaskIds.length ? subTaskIds[0].id : ''; 
                            if (task.template.type_value.toLowerCase() === "observation") {
                                task.antenna_set = task.specifications_doc.antenna_set;
                                task.band = task.specifications_doc.filter;
                            }
                        }
                        this.setState({suTaskList: _.sortBy(taskList, "id"), isSummaryLoading: false,
                                        stationGroup: this.getSUStations(suBlueprint)});
                    });
                // Get the scheduling constraint template of the selected SU block
                ScheduleService.getSchedulingConstraintTemplate(suBlueprint.suDraft.scheduling_constraints_template_id)
                    .then(suConstraintTemplate => {
                        this.setState({suConstraintTemplate: suConstraintTemplate});
                    });
            }
        }
    }

    /**
     * Closes the SU details section
     */
    closeSUDets() {
        this.setState({isSUDetsVisible: false, canExtendSUList: true, canShrinkSUList: false});
    }

    /**
     * Callback function to pass to timeline component which is called on date range change to fetch new item and group records
     * @param {moment} startTime 
     * @param {moment} endTime 
     */
    async dateRangeCallback(startTime, endTime) {
        let suBlueprintList = [], group=[], items = [];
        if (startTime && endTime) {
            for (const suBlueprint of this.state.suBlueprints) {
                if (moment.utc(suBlueprint.start_time).isBetween(startTime, endTime) 
                        || moment.utc(suBlueprint.stop_time).isBetween(startTime, endTime)) {
                    let timelineItem = this.getTimelineItem(suBlueprint);
                    if (this.state.stationView) {
                        const loadSubtasks = this.STATUS_BEFORE_SCHEDULED.indexOf(suBlueprint.status.toLowerCase()) < 0 ;
                        suBlueprint.tasks = await ScheduleService.getTaskBlueprintsBySchedulingUnit(suBlueprint, true, loadSubtasks);
                        this.getStationItemGroups(suBlueprint, timelineItem, this.allStationsGroup, items);
                    }   else {
                        items.push(timelineItem);
                        if (!_.find(group, {'id': suBlueprint.suDraft.id})) {
                            group.push({'id': suBlueprint.suDraft.id, title: suBlueprint.suDraft.name});
                        }
                    }
                    suBlueprintList.push(suBlueprint);
                } 
            }
            if (this.state.stationView) {
                items = this.addStationReservations(items, startTime, endTime);
            }
        }   else {
            suBlueprintList = _.clone(this.state.suBlueprints);
            group = this.state.group;
            items = this.state.items;
        }
        
        this.setState({suBlueprintList: _.filter(suBlueprintList, (suBlueprint) => {return suBlueprint.start_time!=null}),
                        currentStartTime: startTime, currentEndTime: endTime});
        // On range change close the Details pane
        // this.closeSUDets();
        return {group: this.stationView?this.allStationsGroup:_.sortBy(group,'id'), items: items};
    }

    /**
     * To get items and groups for station view
     * @param {Object} suBlueprint 
     * @param {Object} timelineItem 
     * @param {Array} group 
     * @param {Array} items 
     */
    getStationItemGroups(suBlueprint, timelineItem, group, items) {
        /* Get stations based on SU status */
        let stations = this.getSUStations(suBlueprint);
        
        /* Group the items by station */
        for (const station of stations) {
            let stationItem = _.cloneDeep(timelineItem);
            stationItem.id = `${stationItem.id}-${station}`;
            stationItem.group = station;
            items.push(stationItem);
        }
    }

    /**
     * Get all stations of the SU bleprint from the observation task or subtask bases on the SU status.
     * @param {Object} suBlueprint
     */
    getSUStations(suBlueprint) {
        let stations = [];
        /* Get all observation tasks */
        const observationTasks = _.filter(suBlueprint.tasks, (task) => { return task.template.type_value.toLowerCase() === "observation"});
        for (const observationTask of observationTasks) {
            /** If the status of SU is before scheduled, get all stations from the station_groups from the task specification_docs */
            if (this.STATUS_BEFORE_SCHEDULED.indexOf(suBlueprint.status.toLowerCase()) >= 0
                && observationTask.specifications_doc.station_groups) {
                for (const grpStations of _.map(observationTask.specifications_doc.station_groups, "stations")) {
                    stations = _.concat(stations, grpStations);
                }
            }   else if (this.STATUS_BEFORE_SCHEDULED.indexOf(suBlueprint.status.toLowerCase()) < 0 
                            && observationTask.subTasks) {
                /** If the status of SU is scheduled or after get the stations from the subtask specification tasks */
                for (const subtask of observationTask.subTasks) {
                    if (subtask.specifications_doc.stations) {
                        stations = _.concat(stations, subtask.specifications_doc.stations.station_list);
                    }
                }
            }
        }
        return _.uniq(stations);
    }

    /**
     * Add Station Reservations during the visible timeline period
     * @param {Array} items 
     * @param {moment} startTime
     * @param {moment} endTime
     */
    addStationReservations(items, startTime, endTime) {
        let reservations = this.reservations;
        for (const reservation of reservations) {
            const reservationStartTime = moment.utc(reservation.start_time);
            const reservationSpec = reservation.specifications_doc;
            if ( (reservationStartTime.isSameOrAfter(startTime)                                
                    || reservationStartTime.isSameOrBefore(endTime))
                    && (!this.state.reservationFilter ||                                        // No reservation filter added
                        reservationSpec.activity.type === this.state.reservationFilter) ) {     // Reservation reason == Filtered reaseon
                if (reservationSpec.resources.stations) {
                    items = items.concat(this.getReservationItems(reservation, endTime));
                }
            }
        }
        return items;
    }

    /**
     * Get reservation timeline items. If the reservation doesn't have duration, item endtime should be timeline endtime.
     * @param {Object} reservation 
     * @param {moment} endTime 
     */
    getReservationItems(reservation, endTime) {
        const reservationSpec = reservation.specifications_doc;
        let items = [];
        const start_time = moment.utc(reservation.start_time);
        const end_time = reservation.duration?start_time.clone().add(reservation.duration, 'seconds'):endTime;
        for (const station of reservationSpec.resources.stations) {
            const blockColor = RESERVATION_COLORS[this.getReservationType(reservationSpec.schedulability)];
            let item = { id: `Res-${reservation.id}-${station}`,
                            start_time: start_time, end_time: end_time,
                            name: reservationSpec.activity.type, project: reservation.project_id,
                            group: station, type: 'RESERVATION',
                            title: `${reservationSpec.activity.type}${reservation.project_id?("-"+ reservation.project_id):""}`,
                            desc: reservation.description,
                            duration: reservation.duration?UnitConverter.getSecsToHHmmss(reservation.duration):"Unknown",
                            bgColor: blockColor.bgColor, selectedBgColor: blockColor.bgColor, color: blockColor.color
                        };
            items.push(item);
        }
        return items;
    }

    /**
     * Get the schedule type from the schedulability object. It helps to get colors of the reservation blocks
     * according to the type.
     * @param {Object} schedulability 
     */
    getReservationType(schedulability) {
        if (schedulability.manual && schedulability.dynamic) {
            return 'true-true';
        }   else if (!schedulability.manual && !schedulability.dynamic) {
            return 'false-false';
        }   else if (schedulability.manual && !schedulability.dynamic) {
            return 'true-false';
        }   else {
            return 'false-true';
        }
    }

    /**
     * Set reservation filter
     * @param {String} filter 
     */
    setReservationFilter(filter) {
        this.setState({reservationFilter: filter});
    }

    /**
     * Function called to shrink or expand the SU list section width
     * @param {number} step - (-1) to shrink and (+1) to expand
     */
    resizeSUList(step) {
        let canExtendSUList = this.state.canExtendSUList;
        let canShrinkSUList = this.state.canShrinkSUList;
        if (step === 1) {
            // Can Extend when fully shrunk and still extendable
            canExtendSUList = (!canShrinkSUList && canExtendSUList)?true:false;
            canShrinkSUList = true;
        }   else {
            // Can Shrink when fully extended and still shrinkable
            canShrinkSUList = (canShrinkSUList && !canExtendSUList)?true:false;
            canExtendSUList = true;
        }
        this.setState({canExtendSUList: canExtendSUList, canShrinkSUList: canShrinkSUList});
    }

    /**
     * Callback function to pass to the ViewTable component to pass back filtered data
     * @param {Array} filteredData 
     */
    suListFilterCallback(filteredData) {
        let group=[], items = [];
        const suBlueprints = this.state.suBlueprints;
        for (const data of filteredData) {
            const suBlueprint = _.find(suBlueprints, {actionpath: data.actionpath});
            let timelineItem = this.getTimelineItem(suBlueprint);
            if (this.state.stationView) {
                this.getStationItemGroups(suBlueprint, timelineItem, this.allStationsGroup, items);
            }   else {
                items.push(timelineItem);
                if (!_.find(group, {'id': suBlueprint.suDraft.id})) {
                    group.push({'id': suBlueprint.suDraft.id, title: suBlueprint.suDraft.name});
                }
            }
        }
        if (this.state.stationView) {
            items = this.addStationReservations(items, this.state.currentStartTime, this.state.currentEndTime);
        }
        if (this.timeline) {
            this.timeline.updateTimeline({group: this.state.stationView?this.allStationsGroup:_.sortBy(group,"id"), items: items});
        }
    }

    setStationView(e) {
        this.closeSUDets();
        this.setState({stationView: e.value});
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        const isSUDetsVisible = this.state.isSUDetsVisible;
        const canExtendSUList = this.state.canExtendSUList;
        const canShrinkSUList = this.state.canShrinkSUList;
        let suBlueprint = null;
        if (isSUDetsVisible) {
            suBlueprint = _.find(this.state.suBlueprints, {id:  this.state.stationView?parseInt(this.state.selectedItem.id.split('-')[0]):this.state.selectedItem.id});
        }
        return (
            <React.Fragment>
                <PageHeader location={this.props.location} title={'Scheduling Units - Timeline View'} 
                    actions={[{icon: 'fa-calendar-alt',title:'Week View', props : { pathname: `/su/timelineview/week`}}]}/>
                { this.state.isLoading ? <AppLoader /> :
                        <div className="p-grid">
                            {/* SU List Panel */}
                            <div className={isSUDetsVisible || (canExtendSUList && !canShrinkSUList)?"col-lg-4 col-md-4 col-sm-12":((canExtendSUList && canShrinkSUList)?"col-lg-5 col-md-5 col-sm-12":"col-lg-6 col-md-6 col-sm-12")}
                                 style={{position: "inherit", borderRight: "5px solid #efefef", paddingTop: "10px"}}>
                                <ViewTable 
                                    data={this.state.suBlueprintList} 
                                    defaultcolumns={[{name: "Name",
                                                        start_time:"Start Time", stop_time:"End Time"}]}
                                    optionalcolumns={[{project:"Project",description: "Description", duration:"Duration (HH:mm:ss)", actionpath: "actionpath"}]}
                                    columnclassname={[{"Start Time":"filter-input-50", "End Time":"filter-input-50",
                                                        "Duration (HH:mm:ss)" : "filter-input-50",}]}
                                    defaultSortColumn= {[{id: "Start Time", desc: false}]}
                                    showaction="true"
                                    tablename="timeline_scheduleunit_list"
                                    showTopTotal={false}
                                    filterCallback={this.suListFilterCallback}
                                />
                            </div>
                            {/* Timeline Panel */}
                            <div className={isSUDetsVisible || (!canExtendSUList && canShrinkSUList)?"col-lg-5 col-md-5 col-sm-12":((canExtendSUList && canShrinkSUList)?"col-lg-7 col-md-7 col-sm-12":"col-lg-8 col-md-8 col-sm-12")}>
                                {/* Panel Resize buttons */}
                                <div className="resize-div">
                                    <button className="p-link resize-btn" disabled={!this.state.canShrinkSUList} 
                                            title="Shrink List/Expand Timeline"
                                            onClick={(e)=> { this.resizeSUList(-1)}}>
                                        <i className="pi pi-step-backward"></i>
                                    </button>
                                    <button className="p-link resize-btn" disabled={!this.state.canExtendSUList} 
                                            title="Expandd List/Shrink Timeline"
                                            onClick={(e)=> { this.resizeSUList(1)}}>
                                        <i className="pi pi-step-forward"></i>
                                    </button>
                                </div> 
                                <div className="timeline-view-toolbar">
                                    <label>Station View</label>
                                    <InputSwitch checked={this.state.stationView} onChange={(e) => {this.setStationView(e)}} />
                                    {this.state.stationView &&
                                    <>
                                        <label style={{marginLeft: '10px'}}>Reservation</label>
                                        <Dropdown optionLabel="name" optionValue="name" 
                                                    style={{fontSize: '10px', top: '-5px'}}
                                                    value={this.state.reservationFilter} 
                                                    options={this.reservationReasons} 
                                                    filter showClear={true} filterBy="name"
                                                    onChange={(e) => {this.setReservationFilter(e.value)}} 
                                                    placeholder="Reason"/>
                                    </>
                                    }
                                </div>
                                <Timeline ref={(tl)=>{this.timeline=tl}} 
                                        group={this.state.group} 
                                        items={this.state.items}
                                        currentUTC={this.state.currentUTC}
                                        rowHeight={this.state.stationView?30:30} itemClickCallback={this.onItemClick}
                                        dateRangeCallback={this.dateRangeCallback}
                                        showSunTimings={!this.state.stationView}
                                        stackItems ={this.state.stationView}
                                        className="timeline-toolbar-margin-top-0"></Timeline>
                            </div>
                            {/* Details Panel */}
                            {this.state.isSUDetsVisible &&
                                <div className="col-lg-3 col-md-3 col-sm-12" 
                                     style={{borderLeft: "1px solid #efefef", marginTop: "0px", backgroundColor: "#f2f2f2"}}>
                                    {this.state.isSummaryLoading?<AppLoader /> :
                                        <SchedulingUnitSummary schedulingUnit={suBlueprint} suTaskList={this.state.suTaskList}
                                                constraintsTemplate={this.state.suConstraintTemplate}
                                                stationGroup={this.state.stationGroup}
                                                closeCallback={this.closeSUDets}></SchedulingUnitSummary>
                                    }
                                </div>
                            }  
                        
                        </div>
                    
                }
            </React.Fragment>
        );
    }

}