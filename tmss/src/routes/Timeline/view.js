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

// Color constant for status
const STATUS_COLORS = { "ERROR": "FF0000", "CANCELLED": "#00FF00", "DEFINED": "#00BCD4", 
                        "SCHEDULABLE":"#0000FF", "SCHEDULED": "#abc", "OBSERVING": "#bcd",
                        "OBSERVED": "#cde", "PROCESSING": "#cddc39", "PROCESSED": "#fed",
                        "INGESTING": "#edc", "FINISHED": "#47d53d"};

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
            stationGroup: []
        }
        this.STATUS_BEFORE_SCHEDULED = ['defining', 'defined', 'schedulable'];  // Statuses before scheduled to get station_group

        this.onItemClick = this.onItemClick.bind(this);
        this.closeSUDets = this.closeSUDets.bind(this);
        this.dateRangeCallback = this.dateRangeCallback.bind(this);
        this.resizeSUList = this.resizeSUList.bind(this);
        this.suListFilterCallback = this.suListFilterCallback.bind(this);
    }

    async componentDidMount() {
        // Fetch all details from server and prepare data to pass to timeline and table components
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingUnitBlueprint(),
                            ScheduleService.getSchedulingUnitDraft(),
                            ScheduleService.getSchedulingSets(),
                            UtilService.getUTC()] ;
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

            this.setState({suBlueprints: suBlueprints, suDrafts: suDrafts, group: group, suSets: suSets,
                            projects: projects, suBlueprintList: suList, 
                            items: items, currentUTC: currentUTC, isLoading: false});
        });
    }

    /**
     * Function to get/prepare Item object to be passed to Timeline component
     * @param {Object} suBlueprint 
     */
    getTimelineItem(suBlueprint) {
        // Temporary for testing
        const diffOfCurrAndStart = moment().diff(moment(suBlueprint.stop_time), 'seconds');
        // suBlueprint.status = diffOfCurrAndStart>=0?"FINISHED":"DEFINED";
        let item = { id: suBlueprint.id, 
            group: suBlueprint.suDraft.id,
            title: `${suBlueprint.project} - ${suBlueprint.suDraft.name} - ${(suBlueprint.durationInSec/3600).toFixed(2)}Hrs`,
            project: suBlueprint.project,
            name: suBlueprint.suDraft.name,
            duration: suBlueprint.durationInSec?`${(suBlueprint.durationInSec/3600).toFixed(2)}Hrs`:"",
            start_time: moment.utc(suBlueprint.start_time),
            end_time: moment.utc(suBlueprint.stop_time),
            bgColor: suBlueprint.status? STATUS_COLORS[suBlueprint.status.toUpperCase()]:"#2196f3",
            selectedBgColor: suBlueprint.status? STATUS_COLORS[suBlueprint.status.toUpperCase()]:"#2196f3"}; 
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
                ScheduleService.getTaskSubTaskBlueprintsBySchedulingUnit(suBlueprint, true)
                    .then(taskList => {
                        const targetObservation = _.find(taskList, (task)=> {return task.template.type_value==='observation' && task.tasktype.toLowerCase()==="blueprint" && task.specifications_doc.station_groups});
                        for (let task of taskList) {
                            const subTaskIds = (task.subTasks || []).filter(sTask => sTask.subTaskTemplate.name.indexOf('control') > 1);
                            task.subTakskID = subTaskIds.length ? subTaskIds[0].id : ''; 
                            if (task.template.type_value.toLowerCase() === "observation") {
                                task.antenna_set = task.specifications_doc.antenna_set;
                                task.band = task.specifications_doc.filter;
                            }
                        }
                        this.setState({suTaskList: _.sortBy(taskList, "id"), isSummaryLoading: false, stationGroup: targetObservation?targetObservation.specifications_doc.station_groups:[]})
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
                        this.getStationItemGroups(suBlueprint, timelineItem, group, items);
                    }   else {
                        items.push(timelineItem);
                        if (!_.find(group, {'id': suBlueprint.suDraft.id})) {
                            group.push({'id': suBlueprint.suDraft.id, title: suBlueprint.suDraft.name});
                        }
                    }
                    suBlueprintList.push(suBlueprint);
                } 
            }
        }   else {
            suBlueprintList = _.clone(this.state.suBlueprints);
            group = this.state.group;
            items = this.state.items;
        }
        this.setState({suBlueprintList: _.filter(suBlueprintList, (suBlueprint) => {return suBlueprint.start_time!=null})});
        // On range change close the Details pane
        // this.closeSUDets();
        return {group: _.sortBy(group,'id'), items: items};
    }

    /**
     * To get items and groups for station view
     * @param {Object} suBlueprint 
     * @param {Object} timelineItem 
     * @param {Array} group 
     * @param {Array} items 
     */
    getStationItemGroups(suBlueprint, timelineItem, group, items) {
        /** Get all observation tasks */
        const observtionTasks = _.filter(suBlueprint.tasks, (task) => { return task.template.type_value.toLowerCase() === "observation"});
        let stations = [];
        for (const observtionTask of observtionTasks) {
            /** If the status of SU is before scheduled, get all stations from the station_groups from the task specification_docs */
            if (this.STATUS_BEFORE_SCHEDULED.indexOf(suBlueprint.status.toLowerCase()) >= 0
                && observtionTask.specifications_doc.station_groups) {
                for (const grpStations of _.map(observtionTask.specifications_doc.station_groups, "stations")) {
                    stations = _.concat(stations, grpStations);
                }
            }   else if (this.STATUS_BEFORE_SCHEDULED.indexOf(suBlueprint.status.toLowerCase()) < 0 
                            && observtionTask.subTasks) {
                /** If the status of SU is scheduled or after get the stations from the subtask specification tasks */
                for (const subtask of observtionTask.subTasks) {
                    if (subtask.specifications_doc.stations) {
                        stations = _.concat(stations, subtask.specifications_doc.stations.station_list);
                    }
                }
            }
        }
        stations = _.uniq(stations);
        /** Group the items by station */
        for (const station of stations) {
            let stationItem = _.cloneDeep(timelineItem);
            stationItem.id = `${stationItem.id}-${station}`;
            stationItem.group = station;
            items.push(stationItem);
            if (!_.find(group, {'id': station})) {
                group.push({'id': station, title: station});
            }
        }
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
                this.getStationItemGroups(suBlueprint, timelineItem, group, items);
            }   else {
                items.push(timelineItem);
                if (!_.find(group, {'id': suBlueprint.suDraft.id})) {
                    group.push({'id': suBlueprint.suDraft.id, title: suBlueprint.suDraft.name});
                }
            }
        }
        if (this.timeline) {
            this.timeline.updateTimeline({group: _.sortBy(group,"id"), items: items});
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
                                </div>
                                <Timeline ref={(tl)=>{this.timeline=tl}} 
                                        group={this.state.group} 
                                        items={this.state.items}
                                        currentUTC={this.state.currentUTC}
                                        rowHeight={30} itemClickCallback={this.onItemClick}
                                        dateRangeCallback={this.dateRangeCallback}
                                        showSunTimings={!this.state.stationView}
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