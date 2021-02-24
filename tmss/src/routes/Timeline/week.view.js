import React, {Component} from 'react';
import { Redirect } from 'react-router-dom/cjs/react-router-dom.min';
import moment from 'moment';
import _ from 'lodash';

// import SplitPane, { Pane }  from 'react-split-pane';
// import { Dropdown } from 'primereact/dropdown';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import Timeline from '../../components/Timeline';
import ViewTable from '../../components/ViewTable';

import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import UtilService from '../../services/util.service';
import TaskService from '../../services/task.service';

import UnitConverter from '../../utils/unit.converter';
import SchedulingUnitSummary from '../Scheduling/summary';
import UIConstants from '../../utils/ui.constants';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TieredMenu } from 'primereact/tieredmenu';

// Color constant for status
const STATUS_COLORS = { "ERROR": "FF0000", "CANCELLED": "#00FF00", "DEFINED": "#00BCD4", 
                        "SCHEDULABLE":"#0000FF", "SCHEDULED": "#abc", "OBSERVING": "#bcd",
                        "OBSERVED": "#cde", "PROCESSING": "#cddc39", "PROCESSED": "#fed",
                        "INGESTING": "#edc", "FINISHED": "#47d53d"};

/**
 * Scheduling Unit timeline view component to view SU List and timeline
 */
export class WeekTimelineView extends Component {

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
        this.mainStationGroups = {};
        this.optionsMenu = React.createRef();
        this.menuOptions = [ {label:'Add Reservation', icon: "fa fa-", command: () => {this.selectOptionMenu('Add Reservation')}}, 
                            {label:'Reservation List', icon: "fa fa-", command: () => {this.selectOptionMenu('Reservation List')}},
                           ];
        
        this.showOptionMenu = this.showOptionMenu.bind(this);
        this.selectOptionMenu = this.selectOptionMenu.bind(this);
        this.onItemClick = this.onItemClick.bind(this);
        this.closeSUDets = this.closeSUDets.bind(this);
        this.onItemMouseOver = this.onItemMouseOver.bind(this);
        this.onItemMouseOut = this.onItemMouseOut.bind(this);
        this.dateRangeCallback = this.dateRangeCallback.bind(this);
        this.resizeSUList = this.resizeSUList.bind(this);
        this.suListFilterCallback = this.suListFilterCallback.bind(this);
    }

    async componentDidMount() {
        // Fetch all details from server and prepare data to pass to timeline and table components
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingUnitsExtended('blueprint'),
                            ScheduleService.getSchedulingUnitDraft(),
                            ScheduleService.getSchedulingSets(),
                            UtilService.getUTC(),
                            TaskService.getSubtaskTemplates()] ;
        Promise.all(promises).then(async(responses) => {
            this.subtaskTemplates = responses[5];
            const projects = responses[0];
            const suBlueprints = _.sortBy(responses[1], 'name');
            const suDrafts = responses[2].data.results;
            const suSets = responses[3]
            const group = [], items = [];
            const currentUTC = moment.utc(responses[4]);
            const defaultStartTime = moment.utc().day(-2).hour(0).minutes(0).seconds(0);
            const defaultEndTime = moment.utc().day(8).hour(23).minutes(59).seconds(59);
            for (const count of _.range(11)) {
                const groupDate = defaultStartTime.clone().add(count, 'days');
                group.push({'id': groupDate.format("MMM DD ddd"), title: groupDate.format("MMM DD  - ddd"), value: groupDate});
            }
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
                        suBlueprint.tasks = suBlueprint.task_blueprints;
                        // Select only blueprints with start_time and stop_time in the default time limit
                        if (suBlueprint.start_time && 
                            ((moment.utc(suBlueprint.start_time).isBetween(defaultStartTime, defaultEndTime) ||
                             moment.utc(suBlueprint.stop_time).isBetween(defaultStartTime, defaultEndTime))	 
                             || (moment.utc(suBlueprint.start_time).isSameOrBefore(defaultStartTime, defaultEndTime) && 
                                 moment.utc(suBlueprint.stop_time).isSameOrAfter(defaultStartTime, defaultEndTime)))) {

                            const startTime = moment.utc(suBlueprint.start_time);
                            const endTime = moment.utc(suBlueprint.stop_time);
                            if (startTime.format("MM-DD-YYYY") !== endTime.format("MM-DD-YYYY")) {
                               let suBlueprintStart = _.cloneDeep(suBlueprint);
                                let suBlueprintEnd = _.cloneDeep(suBlueprint);
                                suBlueprintStart.stop_time = startTime.hour(23).minutes(59).seconds(59).format('YYYY-MM-DDTHH:mm:ss.00000');
                                suBlueprintEnd.start_time = endTime.hour(0).minutes(0).seconds(0).format('YYYY-MM-DDTHH:mm:ss.00000');
                                items.push(await this.getTimelineItem(suBlueprintStart, currentUTC));
                                items.push(await this.getTimelineItem(suBlueprintEnd, currentUTC));
                            
                            }   else {
                                items.push(await this.getTimelineItem(suBlueprint, currentUTC));
                            }
                            suList.push(suBlueprint);
                        }
                        // Add Subtask Id as control id for task if subtask type us control. Also add antenna_set & band prpoerties to the task object.
                        for (let task of suBlueprint.tasks) {
                            const subTaskIds = task.subtasks.filter(subtask => {
                                const template = _.find(this.subtaskTemplates, ['id', subtask.specifications_template_id]);
                                return (template && template.name.indexOf('control')) > 0;
                            });
                            task.subTaskID = subTaskIds.length ? subTaskIds[0].id : ''; 
                            if (task.specifications_template.type_value.toLowerCase() === "observation") {
                                task.antenna_set = task.specifications_doc.antenna_set;
                                task.band = task.specifications_doc.filter;
                            }
                        }
                        // Get stations involved for this SUB
                        let stations = this.getSUStations(suBlueprint);
                        suBlueprint.stations = _.uniq(stations);
                    }
                }
            }
            // Get all scheduling constraint templates
            ScheduleService.getSchedulingConstraintTemplates()
                .then(suConstraintTemplates => {
                    this.suConstraintTemplates = suConstraintTemplates;
            });
            this.setState({suBlueprints: suBlueprints, suDrafts: suDrafts, group: _.sortBy(group, ['value']), suSets: suSets,
                            projects: projects, suBlueprintList: suList, 
                            items: items, currentUTC: currentUTC, isLoading: false,
                            startTime: defaultStartTime, endTime: defaultEndTime
                        });
        });
        // Get maingroup and its stations. This grouping is used to show count of stations used against each group.
        ScheduleService.getMainGroupStations()
            .then(stationGroups => {this.mainStationGroups = stationGroups});
    }

    /**
     * Function to get/prepare Item object to be passed to Timeline component
     * @param {Object} suBlueprint 
     */
    async getTimelineItem(suBlueprint, displayDate) {
        let antennaSet = "";
        for (let task of suBlueprint.tasks) {
            if (task.specifications_template.type_value.toLowerCase() === "observation") {
                antennaSet = task.specifications_doc.antenna_set;
            }
        }
        let item = { id: `${suBlueprint.id}-${suBlueprint.start_time}`, 
            suId: suBlueprint.id,
            group: moment.utc(suBlueprint.start_time).format("MMM DD ddd"),
            title: "",
            project: suBlueprint.project,
            name: suBlueprint.suDraft.name,
            band: antennaSet?antennaSet.split("_")[0]:"",
            antennaSet: antennaSet,
            duration: suBlueprint.durationInSec?`${(suBlueprint.durationInSec/3600).toFixed(2)}Hrs`:"",
            start_time: moment.utc(`${displayDate.format('YYYY-MM-DD')} ${suBlueprint.start_time.split('T')[1]}`),
            end_time: moment.utc(`${displayDate.format('YYYY-MM-DD')} ${suBlueprint.stop_time.split('T')[1]}`),
            bgColor: suBlueprint.status? STATUS_COLORS[suBlueprint.status.toUpperCase()]:"#2196f3",
            selectedBgColor: 'none',
            type: 'SCHEDULE',
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
                const suBlueprint = _.find(this.state.suBlueprints, {id: parseInt(item.id.split('-')[0])});
                const suConstraintTemplate = _.find(this.suConstraintTemplates, {id: suBlueprint.suDraft.scheduling_constraints_template_id});
                /* If tasks are not loaded on component mounting fetch from API */
                if (suBlueprint.tasks) {
                    this.setState({suTaskList: _.sortBy(suBlueprint.tasks, "id"), suConstraintTemplate: suConstraintTemplate, 
                                    stationGroup: suBlueprint.stations, isSummaryLoading: false})
                }   else {
                    ScheduleService.getTaskBPWithSubtaskTemplateOfSU(suBlueprint)
                        .then(taskList => {
                            for (let task of taskList) {
                                //Control Task ID
                                const subTaskIds = (task.subTasks || []).filter(sTask => sTask.subTaskTemplate.name.indexOf('control') > 1);
                                task.subTaskID = subTaskIds.length ? subTaskIds[0].id : ''; 
                                if (task.template.type_value.toLowerCase() === "observation") {
                                    task.antenna_set = task.specifications_doc.antenna_set;
                                    task.band = task.specifications_doc.filter;
                                }
                            }
                            this.setState({suTaskList: _.sortBy(taskList, "id"), isSummaryLoading: false, 
                                            stationGroup: this.getSUStations(suBlueprint)})
                        });
                }
                // Get the scheduling constraint template of the selected SU block
                // ScheduleService.getSchedulingConstraintTemplate(suBlueprint.suDraft.scheduling_constraints_template_id)
                //     .then(suConstraintTemplate => {
                //         this.setState({suConstraintTemplate: suConstraintTemplate, isSummaryLoading: false});
                //     });
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
     * Hide Tooltip popover on item mouseout event.
     * @param {Event} evt 
     */
    onItemMouseOut(evt) {
        this.popOver.toggle(evt);
    }

    /**
     * Show Tooltip popover on item mouseover event. Item & SU content formatted to show in Popover.
     * @param {Event} evt 
     * @param {Object} item
     */
    onItemMouseOver(evt, item) {
        const itemSU = _.find(this.state.suBlueprints, {id: parseInt(item.id.split("-")[0])});
        const itemStations = itemSU.stations;
        const itemStationGroups = this.groupSUStations(itemStations);
        item.stations = {groups: "", counts: ""};
        for (const stationgroup of _.keys(itemStationGroups)) {
            let groups = item.stations.groups;
            let counts = item.stations.counts;
            if (groups) {
                groups = groups.concat("/");
                counts = counts.concat("/");
            }
            groups = groups.concat(stationgroup.substring(0,1).concat('S'));
            counts = counts.concat(itemStationGroups[stationgroup].length);
            item.stations.groups = groups;
            item.stations.counts = counts;
        }
        this.popOver.toggle(evt);
        this.setState({mouseOverItem: item});
    }

    /**
     * Group the SU stations to main groups Core, Remote, International
     * @param {Object} stationList 
     */
    groupSUStations(stationList) {
        let suStationGroups = {};
        for (const group in this.mainStationGroups) {
            suStationGroups[group] = _.intersection(this.mainStationGroups[group], stationList);
        }
        return suStationGroups;
    }

    /**
     * Get all stations of the SU bleprint from the observation task or subtask based on the SU status.
     * @param {Object} suBlueprint
     */
    getSUStations(suBlueprint) {
        let stations = [];
        /* Get all observation tasks */
        const observationTasks = _.filter(suBlueprint.tasks, (task) => { return task.specifications_template.type_value.toLowerCase() === "observation"});
        for (const observationTask of observationTasks) {
            /** If the status of SU is before scheduled, get all stations from the station_groups from the task specification_docs */
            if (this.STATUS_BEFORE_SCHEDULED.indexOf(suBlueprint.status.toLowerCase()) >= 0
                && observationTask.specifications_doc.station_groups) {
                for (const grpStations of _.map(observationTask.specifications_doc.station_groups, "stations")) {
                    stations = _.concat(stations, grpStations);
                }
            }   else if (this.STATUS_BEFORE_SCHEDULED.indexOf(suBlueprint.status.toLowerCase()) < 0 
                            && observationTask.subtasks) {
                /** If the status of SU is scheduled or after get the stations from the subtask specification tasks */
                for (const subtask of observationTask.subtasks) {
                    if (subtask.specifications_doc.stations) {
                        stations = _.concat(stations, subtask.specifications_doc.stations.station_list);
                    }
                }
            }
        }
        return _.uniq(stations);
    }

    /**
     * Callback function to pass to timeline component which is called on week change to fetch new item and group records
     * @param {moment} startTime 
     * @param {moment} endTime 
     */
    async dateRangeCallback(startTime, endTime, refreshData) {
        let suBlueprintList = [], group=[], items = [];
        let currentUTC = this.state.currentUTC;
        if (refreshData) {
            for (const count of _.range(11)) {
                const groupDate = startTime.clone().add(count, 'days');
                group.push({'id': groupDate.format("MMM DD ddd"), title: groupDate.format("MMM DD  - ddd"), value: groupDate});
            }
            let direction = startTime.week() - this.state.startTime.week();
            currentUTC = this.state.currentUTC.clone().add(direction * 7, 'days');
            if (startTime && endTime) {
                for (const suBlueprint of this.state.suBlueprints) {
                    if (moment.utc(suBlueprint.start_time).isBetween(startTime, endTime) 
                            || moment.utc(suBlueprint.stop_time).isBetween(startTime, endTime)
                            || (moment.utc(suBlueprint.start_time).isSameOrBefore(startTime, endTime) && 
                                 moment.utc(suBlueprint.stop_time).isSameOrAfter(startTime, endTime))) {
                        suBlueprintList.push(suBlueprint);
                        const suStartTime = moment.utc(suBlueprint.start_time);
                        const suEndTime = moment.utc(suBlueprint.stop_time);
                        if (suStartTime.format("MM-DD-YYYY") !== suEndTime.format("MM-DD-YYYY")) {
                            let suBlueprintStart = _.cloneDeep(suBlueprint);
                            let suBlueprintEnd = _.cloneDeep(suBlueprint);
                            suBlueprintStart.stop_time = suStartTime.hour(23).minutes(59).seconds(59).format('YYYY-MM-DDTHH:mm:ss.00000');
                            suBlueprintEnd.start_time = suEndTime.hour(0).minutes(0).seconds(0).format('YYYY-MM-DDTHH:mm:ss.00000');
                            items.push(await this.getTimelineItem(suBlueprintStart, currentUTC));
                            items.push(await this.getTimelineItem(suBlueprintEnd, currentUTC));
                        
                        }   else {
                            items.push(await this.getTimelineItem(suBlueprint, currentUTC));
                        }
                    } 
                }
            }   else {
                suBlueprintList = _.clone(this.state.suBlueprints);
                group = this.state.group;
                items = this.state.items;
            }
            this.setState({suBlueprintList: _.filter(suBlueprintList, (suBlueprint) => {return suBlueprint.start_time!=null}),
                            group: group, items: items, currentUTC: currentUTC, startTime: startTime, endTime: endTime});
            // On range change close the Details pane
            // this.closeSUDets();
        }   else {
            group = this.state.group;
            items = this.state.items;
        }
        return {group: group, items: items};
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
        /*let group=[], items = [];
        const suBlueprints = this.state.suBlueprints;
        for (const data of filteredData) {
            const suBlueprint = _.find(suBlueprints, {actionpath: data.actionpath});
            items.push(this.getTimelineItem(suBlueprint));
            if (!_.find(group, {'id': suBlueprint.suDraft.id})) {
                group.push({'id': suBlueprint.suDraft.id, title: suBlueprint.suDraft.name});
            }
        }
        if (this.timeline) {
            this.timeline.updateTimeline({group: group, items: items});
        }*/
    }

    filterByProject(project) {
        this.setState({selectedProject: project});
    }

    showOptionMenu(event) {
        this.optionsMenu.toggle(event);
    }

    selectOptionMenu(menuName) {
        switch(menuName) {
            case 'Reservation List': {
                this.setState({redirect: `/su/timelineview/reservation/reservation/list`});
                break;
            }
            case 'Add Reservation': {
                this.setState({redirect: `/su/timelineview/reservation/create`});
                break;
            }
            default: {
                break;
            }
        }
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
            suBlueprint = _.find(this.state.suBlueprints, {id: parseInt(this.state.selectedItem.id.split('-')[0])});
        }
        const mouseOverItem = this.state.mouseOverItem;
        return (
            <React.Fragment>
                 <TieredMenu className="app-header-menu" model={this.menuOptions} popup ref={el => this.optionsMenu = el} />
                <PageHeader location={this.props.location} title={'Scheduling Units - Week View'} 
                    actions={[
                        {icon:'fa-bars',title: '', type:'button', actOn:'mouseOver', props : { callback: this.showOptionMenu},},
                        {icon: 'fa-clock',title:'View Timeline', props : { pathname: `/su/timelineview`}}]}/>
                { this.state.isLoading ? <AppLoader /> :
                    <>
                        {/* <div className="p-field p-grid">
                            <div className="col-lg-6 col-md-6 col-sm-12" data-testid="project" >
                                <Dropdown inputId="project" optionLabel="name" optionValue="name" 
                                        value={this.state.selectedProject} options={this.state.projects} 
                                        onChange={(e) => {this.filterByProject(e.value)}} 
                                        placeholder="Filter by Project" />
                            </div>
                        </div> */}
                        <div className="p-grid">
                            {/* SU List Panel */}
                            <div className={isSUDetsVisible || (canExtendSUList && !canShrinkSUList)?"col-lg-4 col-md-4 col-sm-12":((canExtendSUList && canShrinkSUList)?"col-lg-5 col-md-5 col-sm-12":"col-lg-6 col-md-6 col-sm-12")}
                                 style={{position: "inherit", borderRight: "5px solid #efefef", paddingTop: "10px"}}>
                                <ViewTable 
                                    data={this.state.suBlueprintList} 
                                    defaultcolumns={[{name: "Name",
                                                        start_time:"Start Time", stop_time:"End Time"}]}
                                    optionalcolumns={[{project:"Project",description: "Description", duration:"Duration (HH:mm:ss)",actionpath: "actionpath"}]}
                                    columnclassname={[{"Name":"filter-input-100", "Start Time":"filter-input-50", "End Time":"filter-input-50",
                                                        "Duration (HH:mm:ss)" : "filter-input-50",}]}
                                    defaultSortColumn= {[{id: "Start Time", desc: false}]}
                                    showaction="true"
                                    tablename="timeline_scheduleunit_list"
                                    showTopTotal={false}
                                    showGlobalFilter={false}
                                    showColumnFilter={false}
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
                                <Timeline ref={(tl)=>{this.timeline=tl}} 
                                        group={this.state.group} 
                                        items={this.state.items}
                                        currentUTC={this.state.currentUTC}
                                        rowHeight={50} 
                                        itemClickCallback={this.onItemClick}
                                        itemMouseOverCallback={this.onItemMouseOver}
                                        itemMouseOutCallback={this.onItemMouseOut}
                                        sidebarWidth={150}
                                        stackItems={true}
                                        startTime={moment.utc(this.state.currentUTC).hour(0).minutes(0).seconds(0)}
                                        endTime={moment.utc(this.state.currentUTC).hour(23).minutes(59).seconds(59)}
                                        zoomLevel="1 Day"
                                        showLive={false} showDateRange={false} viewType={UIConstants.timeline.types.WEEKVIEW}
                                        dateRangeCallback={this.dateRangeCallback}
                                    ></Timeline>
                            </div>
                            {/* Details Panel */}
                            {this.state.isSUDetsVisible &&
                                <div className="col-lg-3 col-md-3 col-sm-12" 
                                     style={{borderLeft: "1px solid #efefef", marginTop: "0px", backgroundColor: "#f2f2f2"}}>
                                    {this.state.isSummaryLoading?<AppLoader /> :
                                        <SchedulingUnitSummary schedulingUnit={suBlueprint} suTaskList={this.state.suTaskList}
                                                constraintsTemplate={this.state.suConstraintTemplate}
                                                closeCallback={this.closeSUDets}
                                                stationGroup={this.state.stationGroup}
                                                location={this.props.location}></SchedulingUnitSummary>
                                    }
                                </div>
                            }  
                        
                        </div>
                    </>
                }
                {/* SU Item Tooltip popover with SU status color */}
                <OverlayPanel className="timeline-popover" ref={(el) => this.popOver = el} dismissable>
                {mouseOverItem &&
                    <div className={`p-grid su-${mouseOverItem.status}`} style={{width: '350px'}}>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Project:</label>
                        <div className="col-7">{mouseOverItem.project}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Scheduling Unit:</label>
                        <div className="col-7">{mouseOverItem.name}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Friends:</label>
                        <div className="col-7">{mouseOverItem.friends?mouseOverItem.friends:"-"}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Start Time:</label>
                        <div className="col-7">{mouseOverItem.start_time.format("YYYY-MM-DD HH:mm:ss")}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>End Time:</label>
                        <div className="col-7">{mouseOverItem.end_time.format("YYYY-MM-DD HH:mm:ss")}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Antenna Set:</label>
                        <div className="col-7">{mouseOverItem.antennaSet}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Stations:</label>
                        <div className="col-7">{mouseOverItem.stations.groups}:{mouseOverItem.stations.counts}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Status:</label>
                        <div className="col-7">{mouseOverItem.status}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Duration:</label>
                        <div className="col-7">{mouseOverItem.duration}</div>
                    </div>
                }
                </OverlayPanel>
            </React.Fragment>
        );
    }

}