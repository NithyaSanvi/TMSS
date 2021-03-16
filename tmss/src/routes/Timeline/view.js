import React, {Component} from 'react';
import { Redirect } from 'react-router-dom/cjs/react-router-dom.min';
import moment from 'moment';
import _ from 'lodash';
import Websocket from 'react-websocket';

// import SplitPane, { Pane }  from 'react-split-pane';
import {InputSwitch} from 'primereact/inputswitch';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import Timeline from '../../components/Timeline';
import ViewTable from '../../components/ViewTable';

import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import UtilService from '../../services/util.service';
import TaskService from '../../services/task.service';

import UnitConverter from '../../utils/unit.converter';
import Validator from '../../utils/validator';
import SchedulingUnitSummary from '../Scheduling/summary';
import { Dropdown } from 'primereact/dropdown';
import { OverlayPanel } from 'primereact/overlaypanel';
import { RadioButton } from 'primereact/radiobutton';
import { TieredMenu } from 'primereact/tieredmenu';

// Color constant for SU status
const SU_STATUS_COLORS = { "ERROR": "FF0000", "CANCELLED": "#00FF00", "DEFINED": "#00BCD4", 
                            "SCHEDULABLE":"#0000FF", "SCHEDULED": "#abc", "OBSERVING": "#bcd",
                            "OBSERVED": "#cde", "PROCESSING": "#cddc39", "PROCESSED": "#fed",
                            "INGESTING": "#edc", "FINISHED": "#47d53d"};

// Color constant for Task status
const TASK_STATUS_COLORS = { "ERROR": "FF0000", "CANCELLED": "#00FF00", "DEFINED": "#00BCD4", 
                            "SCHEDULABLE":"#0000FF", "SCHEDULED": "#abc", "STARTED": "#bcd",
                            "OBSERVED": "#cde", "FINISHED": "#47d53d"};

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
            isTaskDetsVisible: false,
            canExtendSUList: true,
            canShrinkSUList: false,
            selectedItem: null,
            mouseOverItem: null,
            suTaskList:[],
            isSummaryLoading: false,
            stationGroup: [],
            reservationFilter: null,
            showSUs: true,
            showTasks: false
        }
        this.STATUS_BEFORE_SCHEDULED = ['defining', 'defined', 'schedulable'];  // Statuses before scheduled to get station_group
        this.allStationsGroup = [];
        this.mainStationGroups = {};    // To group the stations under CS,RS,IS to show the count in Popover
        this.reservations = [];
        this.reservationReasons = [];
        this.optionsMenu = React.createRef();
        this.menuOptions = [ {label:'Add Reservation', icon: "fa fa-", command: () => {this.selectOptionMenu('Add Reservation')}}, 
                            {label:'Reservation List', icon: "fa fa-", command: () => {this.selectOptionMenu('Reservation List')}},
                           ];
        
        this.showOptionMenu = this.showOptionMenu.bind(this);
        this.selectOptionMenu = this.selectOptionMenu.bind(this);
        this.onItemClick = this.onItemClick.bind(this);
        this.onItemMouseOver = this.onItemMouseOver.bind(this);
        this.onItemMouseOut = this.onItemMouseOut.bind(this);
        this.showSUSummary = this.showSUSummary.bind(this);
        this.showTaskSummary = this.showTaskSummary.bind(this);
        this.closeSUDets = this.closeSUDets.bind(this);
        this.dateRangeCallback = this.dateRangeCallback.bind(this);
        this.resizeSUList = this.resizeSUList.bind(this);
        this.suListFilterCallback = this.suListFilterCallback.bind(this);
        this.addStationReservations = this.addStationReservations.bind(this);
        this.handleData = this.handleData.bind(this);
        this.addNewData = this.addNewData.bind(this);
        this.updateExistingData = this.updateExistingData.bind(this);
        this.updateSchedulingUnit = this.updateSchedulingUnit.bind(this);
    }

    async componentDidMount() {
        // Fetch all details from server and prepare data to pass to timeline and table components
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingUnitsExtended('blueprint'),
                            ScheduleService.getSchedulingUnitDraft(),
                            ScheduleService.getSchedulingSets(),
                            UtilService.getUTC(),
                            ScheduleService.getStations('All'),
                            TaskService.getSubtaskTemplates()] ;
        Promise.all(promises).then(async(responses) => {
            this.subtaskTemplates = responses[6];
            const projects = responses[0];
            const suBlueprints = _.sortBy(responses[1], 'name');
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
                        suBlueprint.tasks = suBlueprint.task_blueprints;
                        // Select only blueprints with start_time and stop_time in the default time limit
                        if (suBlueprint.start_time && 
                            ((moment.utc(suBlueprint.start_time).isBetween(defaultStartTime, defaultEndTime) ||
                             moment.utc(suBlueprint.stop_time).isBetween(defaultStartTime, defaultEndTime))	 
                             || (moment.utc(suBlueprint.start_time).isSameOrBefore(defaultStartTime) && 
                                 moment.utc(suBlueprint.stop_time).isSameOrAfter(defaultEndTime)))) {
                            items.push(this.getTimelineItem(suBlueprint));
                            if (!_.find(group, {'id': suDraft.id})) {
                                group.push({'id': suDraft.id, title: suDraft.name});
                            }
                            suList.push(suBlueprint);
                        }
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
            // Get all scheduling constraint templates
            ScheduleService.getSchedulingConstraintTemplates()
                .then(suConstraintTemplates => {
                    this.suConstraintTemplates = suConstraintTemplates;
            });
            this.setState({suBlueprints: suBlueprints, suDrafts: suDrafts, group: group, suSets: suSets,
                            projects: projects, suBlueprintList: suList,
                            items: items, currentUTC: currentUTC, isLoading: false,
                            currentStartTime: defaultStartTime, currentEndTime: defaultEndTime});
        });
        // Get maingroup and its stations
        ScheduleService.getMainGroupStations()
            .then(stationGroups => {this.mainStationGroups = stationGroups});
    }

    /**
     * Function to get/prepare Item object to be passed to Timeline component
     * @param {Object} suBlueprint 
     */
    getTimelineItem(suBlueprint) {
        let antennaSet = "";
        for (let task of suBlueprint.tasks) {
            if (task.specifications_template.type_value.toLowerCase() === "observation"
                    && task.specifications_doc.antenna_set) {
                antennaSet = task.specifications_doc.antenna_set;
            }
        }
        let item = { id: suBlueprint.id, 
            group: suBlueprint.suDraft.id,
            //title: `${suBlueprint.project} - ${suBlueprint.suDraft.name} - ${(suBlueprint.durationInSec/3600).toFixed(2)}Hrs`,
            title: "",
            project: suBlueprint.project, type: 'SCHEDULE',
            name: suBlueprint.suDraft.name,
            band: antennaSet?antennaSet.split("_")[0]:"",
            antennaSet: antennaSet,
            duration: suBlueprint.durationInSec?`${(suBlueprint.durationInSec/3600).toFixed(2)}Hrs`:"",
            start_time: moment.utc(suBlueprint.start_time),
            end_time: moment.utc(suBlueprint.stop_time),
            bgColor: suBlueprint.status? SU_STATUS_COLORS[suBlueprint.status.toUpperCase()]:"#2196f3",
            // selectedBgColor: suBlueprint.status? SU_STATUS_COLORS[suBlueprint.status.toUpperCase()]:"#2196f3"}; 
            selectedBgColor: "none",
            status: suBlueprint.status.toLowerCase()};
        return item;
    }

    /**
     * Get Timeline items for obsercation tasks of the SU Bluprint. Task Items are grouped to the SU draft and Task draft IDs
     * @param {Object} suBlueprint 
     */
    getTaskItems(suBlueprint, startTime, endTime) {
        let taskItems = {};
        if (suBlueprint.tasks) {
            let items = [], itemGroup = [];
            const subtaskTemplates = this.subtaskTemplates;
            for (let task of suBlueprint.tasks) {
                if (task.specifications_template.type_value.toLowerCase() === "observation" && task.start_time && task.stop_time) {
                    const antennaSet = task.specifications_doc.antenna_set;
                    const start_time = moment.utc(task.start_time);
                    const end_time = moment.utc(task.stop_time);
                    if ((start_time.isBetween(startTime, endTime) ||
                         end_time.isBetween(startTime, endTime))	 
                         || (start_time.isSameOrBefore(startTime) && end_time.isSameOrAfter(endTime))) {
                        const subTaskIds = task.subtasks.filter(subtask => {
                                                const template = _.find(subtaskTemplates, ['id', subtask.specifications_template_id]);
                                                return (template && template.name.indexOf('control')) > 0;
                        });
                        const controlId = subTaskIds.length>0 ? subTaskIds[0].id : ''; 
                        let item = { id: `${suBlueprint.id}_${task.id}`, 
                                    suId: suBlueprint.id,
                                    taskId: task.id,
                                    controlId: controlId,
                                    group: `${suBlueprint.suDraft.id}_${task.draft_id}`,
                                    // group: `${suBlueprint.suDraft.id}_Tasks`,    // For single row task grouping
                                    title: '',
                                    project: suBlueprint.project, type: 'TASK',
                                    name: task.name,
                                    typeValue:task.specifications_template.type_value,
                                    band: antennaSet?antennaSet.split("_")[0]:"",
                                    antennaSet: antennaSet?antennaSet:"",
                                    duration: `${(end_time.diff(start_time, 'seconds')/3600).toFixed(2)}Hrs`,
                                    start_time: start_time,
                                    end_time: end_time,
                                    bgColor: task.status? TASK_STATUS_COLORS[task.status.toUpperCase()]:"#2196f3",
                                    selectedBgColor: "none",
                                    status: task.status.toLowerCase()};
                        items.push(item);
                        if (!_.find(itemGroup, ['id', `${suBlueprint.suDraft.id}_${task.draft_id}`])) {
                            itemGroup.push({'id': `${suBlueprint.suDraft.id}_${task.draft_id}`, parent: suBlueprint.suDraft.id, 
                                            start: start_time, title: `${!this.state.showSUs?suBlueprint.suDraft.name:""} -- ${task.name}`});
                        }
                        /* >>>>>> If all tasks should be shown in single row remove the above 2 lines and uncomment these lines
                        if (!_.find(itemGroup, ['id', `${suBlueprint.suDraft.id}_Tasks`])) {
                            itemGroup.push({'id': `${suBlueprint.suDraft.id}_Tasks`, parent: suBlueprint.suDraft.id, 
                                            start_time: start_time, title: `${!this.state.showSUs?suBlueprint.suDraft.name:""} -- Tasks`});
                        }
                        <<<<<<*/
                    }
                }
            }
            taskItems['items'] = items;
            taskItems['group'] = itemGroup
        }
        return taskItems;
    }

    /**
     * Callback function to pass to Timeline component for item click.
     * @param {Object} item 
     */
    onItemClick(item) {
        if (item.type === "SCHEDULE") { 
            this.showSUSummary(item);
        }   else {
            this.showTaskSummary(item);
        }
    }

    /**
     * To load SU summary and show
     * @param {Object} item - Timeline SU item object.
     */
    showSUSummary(item) {
        if (this.state.isSUDetsVisible && item.id===this.state.selectedItem.id) {
            this.closeSUDets();
        }   else {
            const fetchDetails = !this.state.selectedItem || item.id!==this.state.selectedItem.id
            this.setState({selectedItem: item, isSUDetsVisible: true, isTaskDetsVisible: false,
                isSummaryLoading: fetchDetails,
                suTaskList: !fetchDetails?this.state.suTaskList:[],
                canExtendSUList: false, canShrinkSUList:false});
            if (fetchDetails) {
                const suBlueprint = _.find(this.state.suBlueprints, {id: (this.state.stationView?parseInt(item.id.split('-')[0]):item.id)});
                const suConstraintTemplate = _.find(this.suConstraintTemplates, {id: suBlueprint.suDraft.scheduling_constraints_template_id});
                /* If tasks are not loaded on component mounting fetch from API */
                if (suBlueprint.tasks) {
                    this.setState({suTaskList: _.sortBy(suBlueprint.tasks, "id"), suConstraintTemplate: suConstraintTemplate,
                                    stationGroup: this.getSUStations(suBlueprint), isSummaryLoading: false});
                }   else {
                    ScheduleService.getTaskBPWithSubtaskTemplateOfSU(suBlueprint)
                        .then(taskList => {
                            for (let task of taskList) {
                                //Control Task Id
                                // const subTaskIds = (task.subTasks || []).filter(sTask => sTask.subTaskTemplate.name.indexOf('control') > 1);
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
                            this.setState({suTaskList: _.sortBy(taskList, "id"), isSummaryLoading: false,
                                            stationGroup: this.getSUStations(suBlueprint)});
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
     * To load task summary and show
     * @param {Object} item - Timeline task item object 
     */
    showTaskSummary(item) {
        this.setState({isTaskDetsVisible: !this.state.isTaskDetsVisible, isSUDetsVisible: false});
    }

    /**
     * Closes the SU details section
     */
    closeSUDets() {
        this.setState({isSUDetsVisible: false, isTaskDetsVisible: false, canExtendSUList: true, canShrinkSUList: false});
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
        const itemSU = _.find(this.state.suBlueprints, {id: (item.suId?item.suId:item.id)});
        const itemStations = this.getSUStations(itemSU);
        const itemStationGroups = this.groupSUStations(itemStations);
        item.stations = {groups: "", counts: ""};
        item.suName = itemSU.name;
        for (const stationgroup of _.keys(itemStationGroups)) {
            let groups = item.stations.groups;
            let counts = item.stations.counts;
            if (groups) {
                groups = groups.concat("/");
                counts = counts.concat("/");
            }
            // Get station group 1st character and append 'S' to get CS,RS,IS 
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
     * Callback function to pass to timeline component which is called on date range change to fetch new item and group records
     * @param {moment} startTime 
     * @param {moment} endTime 
     */
    async dateRangeCallback(startTime, endTime) {
        let suBlueprintList = [], group=[], items = [];
        if (startTime && endTime) {
            for (const suBlueprint of this.state.suBlueprints) {
                if (moment.utc(suBlueprint.start_time).isBetween(startTime, endTime) 
                    || moment.utc(suBlueprint.stop_time).isBetween(startTime, endTime)
                    || (moment.utc(suBlueprint.start_time).isSameOrBefore(startTime) && 
                         moment.utc(suBlueprint.stop_time).isSameOrAfter(endTime))) {
                    // Get timeline item for station view noramlly and in timeline view only if SU to be shown
                    let timelineItem = (this.state.showSUs || this.state.stationView)?this.getTimelineItem(suBlueprint):null;
                    if (this.state.stationView) {
                        this.getStationItemGroups(suBlueprint, timelineItem, this.allStationsGroup, items);
                    }   else {
                        // Add timeline SU item
                        if (timelineItem) {
                            items.push(timelineItem);
                            if (!_.find(group, {'id': suBlueprint.suDraft.id})) {
                                /* parent and start properties are added to order and display task rows below the corresponding SU row */
                                group.push({'id': suBlueprint.suDraft.id, parent: suBlueprint.suDraft.id, 
                                            start: moment.utc("1900-01-01", "YYYY-MM-DD"), title: suBlueprint.suDraft.name});
                            }
                        }
                        // Add task item only in timeline view and when show task is enabled
                        if (this.state.showTasks && !this.state.stationView) {
                            const taskItems = this.getTaskItems(suBlueprint, startTime, endTime);
                            items = items.concat(taskItems.items);
                            group = group.concat(taskItems.group);
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
        // console.log(_.orderBy(group, ["parent", "id"], ['asc', 'desc']));
        return {group: this.stationView?this.allStationsGroup:_.orderBy(_.uniqBy(group, 'id'),["parent", "start"], ['asc', 'asc']), items: items};
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
            stationItem.suId = timelineItem.id;
            items.push(stationItem);
        }
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
     * Add Station Reservations during the visible timeline period
     * @param {Array} items 
     * @param {moment} startTime
     * @param {moment} endTime
     */
    addStationReservations(items, startTime, endTime) {
        let reservations = this.reservations;
        for (const reservation of reservations) {
            const reservationStartTime = moment.utc(reservation.start_time);
            const reservationEndTime = reservation.duration?reservationStartTime.clone().add(reservation.duration, 'seconds'):endTime;
            const reservationSpec = reservation.specifications_doc;
            if ( (reservationStartTime.isSame(startTime) 
                    || reservationStartTime.isSame(endTime)                       
                    || reservationStartTime.isBetween(startTime, endTime)
                    || reservationEndTime.isSame(startTime) 
                    || reservationEndTime.isSame(endTime)                       
                    || reservationEndTime.isBetween(startTime, endTime)
                    || (reservationStartTime.isSameOrBefore(startTime)
                    && reservationEndTime.isSameOrAfter(endTime)))
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
     * To enable displaying SU or Task or Both items in timeline.
     * @param {String} value 
     */
    showTimelineItems(value) {
        this.setState({showSUs: value==='su' || value==="suTask",
                        showTasks: value==='task' || value==="suTask"});
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
            let timelineItem = (this.state.showSUs || this.state.stationView)?this.getTimelineItem(suBlueprint):null;
            if (this.state.stationView) {
                this.getStationItemGroups(suBlueprint, timelineItem, this.allStationsGroup, items);
            }   else {
                if (timelineItem) {
                    items.push(timelineItem);
                    if (!_.find(group, {'id': suBlueprint.suDraft.id})) {
                        /* parent and start properties are added to order and list task rows below the SU row */
                        group.push({'id': suBlueprint.suDraft.id, parent: suBlueprint.suDraft.id, 
                                    start: moment.utc("1900-01-01", "YYYY-MM-DD"), title: suBlueprint.suDraft.name});
                    }
                }
                if (this.state.showTasks && !this.state.stationView) {
                    const taskItems = this.getTaskItems(suBlueprint, this.state.currentStartTime, this.state.currentEndTime);
                    items = items.concat(taskItems.items);
                    group = group.concat(taskItems.group);
                }
            }
        }
        if (this.state.stationView) {
            items = this.addStationReservations(items, this.state.currentStartTime, this.state.currentEndTime);
        }
        if (this.timeline) {
            this.timeline.updateTimeline({group: this.state.stationView?this.allStationsGroup:_.orderBy(_.uniqBy(group, 'id'),["parent", "start"], ['asc', 'asc']), items: items});
        }
    }

    setStationView(e) {
        this.closeSUDets();
        this.setState({stationView: e.value});
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

    /**
     * Function to call wnen websocket is connected
     */
    onConnect() {
        console.log("WS Opened")
    }

    /**
     * Function to call when websocket is disconnected
     */
    onDisconnect() {
        console.log("WS Closed")
    }

    /**
     * Handles the message received through websocket
     * @param {String} data - String of JSON data
     */
    handleData(data) {
        if (data) {
            const jsonData = JSON.parse(data);
            if (jsonData.action === 'create') {
                this.addNewData(jsonData.object_details.id, jsonData.object_type, jsonData.object_details);
            }   else if (jsonData.action === 'update') {
                this.updateExistingData(jsonData.object_details.id, jsonData.object_type, jsonData.object_details);
            }
        }
    }

    /**
     * If any new object that is relevant to the timeline view, load the data to the existing state variable.
     * @param {Number} id  - id of the object created
     * @param {String} type  - model name of the object like scheduling_unit_draft, scheduling_unit_blueprint, task_blueprint, etc.,
     * @param {Object} object - model object with certain properties
     */
    addNewData(id, type, object) {
        switch(type) {
            /* When a new scheduling_unit_draft is created, it should be added to the existing list of suDraft. */
            case 'scheduling_unit_draft': {
                this.updateSUDraft(id);
                // let suDrafts = this.state.suDrafts;
                // let suSets = this.state.suSets;
                // ScheduleService.getSchedulingUnitDraftById(id)
                // .then(suDraft => {
                //     suDrafts.push(suDraft);
                //     _.remove(suSets, function(suSet) { return suSet.id === suDraft.scheduling_set_id});
                //     suSets.push(suDraft.scheduling_set_object);
                //     this.setState({suSet: suSets, suDrafts: suDrafts});
                // });
                break;
            }
            case 'scheduling_unit_blueprint': {
                this.updateSchedulingUnit(id);
                break;
            }
            case 'task_blueprint': {
                // this.updateSchedulingUnit(object.scheduling_unit_blueprint_id);
                break;
            }
            default: { break; }
        }
    }

    /**
     * If any if the given properties of the object is modified, update the schedulingUnit object in the list of the state.
     * It is validated for both scheduling_unit_blueprint and task_blueprint objects
     * @param {Number} id 
     * @param {String} type 
     * @param {Object} object 
     */
    updateExistingData(id, type, object) {
        const objectProps = ['status', 'start_time', 'stop_time', 'duration'];
        switch(type) {
            case 'scheduling_unit_draft': {
                this.updateSUDraft(id);
                // let suDrafts = this.state.suDrafts;
                // _.remove(suDrafts, function(suDraft) { return suDraft.id === id});
                // suDrafts.push(object);
                // this.setState({suDrafts: suDrafts});
                break;
            }
            case 'scheduling_unit_blueprint': {
                let suBlueprints = this.state.suBlueprints;
                let existingSUB = _.find(suBlueprints, ['id', id]);
                if (Validator.isObjectModified(existingSUB, object, objectProps)) {
                    this.updateSchedulingUnit(id);
                }
                break;
            }
            case 'task_blueprint': {
                // let suBlueprints = this.state.suBlueprints;
                // let existingSUB = _.find(suBlueprints, ['id', object.scheduling_unit_blueprint_id]);
                // let existingTask = _.find(existingSUB.tasks, ['id', id]);
                // if (Validator.isObjectModified(existingTask, object, objectProps)) {
                //     this.updateSchedulingUnit(object.scheduling_unit_blueprint_id);
                // }
                break;
            }
            default: { break;}
        }
    }

    /**
     * Add or update the SUDraft object in the state suDraft list after fetching through API call
     * @param {Number} id 
     */
    updateSUDraft(id) {
        let suDrafts = this.state.suDrafts;
        let suSets = this.state.suSets;
        ScheduleService.getSchedulingUnitDraftById(id)
        .then(suDraft => {
            _.remove(suDrafts, function(suDraft) { return suDraft.id === id});
            suDrafts.push(suDraft);
            _.remove(suSets, function(suSet) { return suSet.id === suDraft.scheduling_set_id});
            suSets.push(suDraft.scheduling_set_object);
            this.setState({suSet: suSets, suDrafts: suDrafts});
        });
    }

    /**
     * Fetch the latest SUB object from the backend and format as required for the timeline and pass them to the timeline component
     * to update the timeline view with latest data.
     * @param {Number} id 
     */
    updateSchedulingUnit(id) {
        ScheduleService.getSchedulingUnitExtended('blueprint', id, true)
        .then(suBlueprint => {
            const suDraft = _.find(this.state.suDrafts, ['id', suBlueprint.draft_id]);
            const suSet = this.state.suSets.find((suSet) => { return suDraft.scheduling_set_id===suSet.id});
            const project = this.state.projects.find((project) => { return suSet.project_id===project.name});
            let suBlueprints = this.state.suBlueprints;
            suBlueprint['actionpath'] = `/schedulingunit/view/blueprint/${id}`;
            suBlueprint.suDraft = suDraft;
            suBlueprint.project = project.name;
            suBlueprint.suSet = suSet;
            suBlueprint.durationInSec = suBlueprint.duration;
            suBlueprint.duration = UnitConverter.getSecsToHHmmss(suBlueprint.duration);
            suBlueprint.tasks = suBlueprint.task_blueprints;
            _.remove(suBlueprints, function(suB) { return suB.id === id});
            suBlueprints.push(suBlueprint);
            // Set updated suBlueprints in the state and call the dateRangeCallback to create the timeline group and items
            this.setState({suBlueprints: suBlueprints});
            this.dateRangeCallback(this.state.currentStartTime, this.state.currentEndTime);
        });
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        const isSUDetsVisible = this.state.isSUDetsVisible;
        const isTaskDetsVisible = this.state.isTaskDetsVisible;
        const canExtendSUList = this.state.canExtendSUList;
        const canShrinkSUList = this.state.canShrinkSUList;
        let suBlueprint = null;
        if (isSUDetsVisible) {
            suBlueprint = _.find(this.state.suBlueprints, {id:  this.state.stationView?parseInt(this.state.selectedItem.id.split('-')[0]):this.state.selectedItem.id});
        }
        let mouseOverItem = this.state.mouseOverItem;
        return (
            <React.Fragment>
                <TieredMenu className="app-header-menu" model={this.menuOptions} popup ref={el => this.optionsMenu = el} />
                <PageHeader location={this.props.location} title={'Scheduling Units - Timeline View'} 
                    actions={[
                        {icon:'fa-bars',title: '', type:'button', actOn:'mouseOver', props : { callback: this.showOptionMenu},},
                        {icon: 'fa-calendar-alt',title:'Week View', props : { pathname: `/su/timelineview/week`}}
                    ]}
                />
                                        
                { this.state.isLoading ? <AppLoader /> :
                        <div className="p-grid">
                            {/* SU List Panel */}
                            <div className={isSUDetsVisible || isTaskDetsVisible || (canExtendSUList && !canShrinkSUList)?"col-lg-4 col-md-4 col-sm-12":((canExtendSUList && canShrinkSUList)?"col-lg-5 col-md-5 col-sm-12":"col-lg-6 col-md-6 col-sm-12")}
                                 style={{position: "inherit", borderRight: "5px solid #efefef", paddingTop: "10px"}}>
                                <ViewTable 
                                    redirectNewWindow
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
                            <div className={isSUDetsVisible || isTaskDetsVisible || (!canExtendSUList && canShrinkSUList)?"col-lg-5 col-md-5 col-sm-12":((canExtendSUList && canShrinkSUList)?"col-lg-7 col-md-7 col-sm-12":"col-lg-8 col-md-8 col-sm-12")}>
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
                                        <label style={{marginLeft: '15px'}}>Reservation</label>
                                        <Dropdown optionLabel="name" optionValue="name" 
                                                    style={{fontSize: '10px', top: '-5px'}}
                                                    value={this.state.reservationFilter} 
                                                    options={this.reservationReasons} 
                                                    filter showClear={true} filterBy="name"
                                                    onChange={(e) => {this.setReservationFilter(e.value)}} 
                                                    placeholder="Reason"/>
                                    </>
                                    }
                                    {!this.state.stationView &&
                                    <>
                                        <label style={{marginLeft: '15px'}}>Show :</label>
                                        <RadioButton value="su" name="Only SUs" inputId="suOnly" onChange={(e) => this.showTimelineItems(e.value)} checked={this.state.showSUs && !this.state.showTasks} />
                                        <label htmlFor="suOnly">Only SU</label>
                                        <RadioButton value="task" name="Only Tasks" inputId="taskOnly" onChange={(e) => this.showTimelineItems(e.value)} checked={!this.state.showSUs && this.state.showTasks} />
                                        <label htmlFor="suOnly">Only Task</label>
                                        <RadioButton value="suTask" name="Both" inputId="bothSuTask" onChange={(e) => this.showTimelineItems(e.value)} checked={this.state.showSUs && this.state.showTasks} />
                                        <label htmlFor="suOnly">Both</label>
                                    </>
                                    }
                                </div>
                                <Timeline ref={(tl)=>{this.timeline=tl}} 
                                        group={this.state.group} 
                                        items={this.state.items}
                                        currentUTC={this.state.currentUTC}
                                        rowHeight={this.state.stationView?50:50} 
                                        itemClickCallback={this.onItemClick}
                                        itemMouseOverCallback={this.onItemMouseOver}
                                        itemMouseOutCallback={this.onItemMouseOut}
                                        dateRangeCallback={this.dateRangeCallback}
                                        showSunTimings={!this.state.stationView}
                                        // stackItems ={this.state.stationView}
                                        stackItems
                                        className="timeline-toolbar-margin-top-0"></Timeline>
                            </div>
                            {/* Details Panel */}
                            {this.state.isSUDetsVisible &&
                                <div className="col-lg-3 col-md-3 col-sm-12" 
                                     style={{borderLeft: "1px solid #efefef", marginTop: "0px", backgroundColor: "#f2f2f2"}}>
                                    {this.state.isSummaryLoading?<AppLoader /> :
                                        <SchedulingUnitSummary schedulingUnit={suBlueprint} suTaskList={this.state.suTaskList}
                                                constraintsTemplate={this.state.suConstraintTemplate}
                                                redirectNewWindow
                                                stationGroup={this.state.stationGroup}
                                                closeCallback={this.closeSUDets}></SchedulingUnitSummary>
                                    }
                                </div>
                            }  
                            {this.state.isTaskDetsVisible &&
                                <div className="col-lg-3 col-md-3 col-sm-12" 
                                     style={{borderLeft: "1px solid #efefef", marginTop: "0px", backgroundColor: "#f2f2f2"}}>
                                    {this.state.isSummaryLoading?<AppLoader /> :
                                        <div>Yet to be developed <i className="fa fa-times" onClick={this.closeSUDets}></i></div>
                                    }
                                </div>
                            }
                        </div>
                    
                }
                {/* SU Item Tooltip popover with SU status color */}
                <OverlayPanel className="timeline-popover" ref={(el) => this.popOver = el} dismissable>
                {mouseOverItem &&
                    <div className={`p-grid su-${mouseOverItem.status}`} style={{width: '350px'}}>
                        <h3 className={`col-12 su-${mouseOverItem.status}-icon`}>{mouseOverItem.type==='SCHEDULE'?'Scheduling Unit ':'Task '}Overview</h3>
                        <hr></hr>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Project:</label>
                        <div className="col-7">{mouseOverItem.project}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Scheduling Unit:</label>
                        <div className="col-7">{mouseOverItem.suName}</div>
                        {mouseOverItem.type==='SCHEDULE' &&
                        <>
                            <label className={`col-5 su-${mouseOverItem.status}-icon`}>Friends:</label>
                            <div className="col-7">{mouseOverItem.friends?mouseOverItem.friends:"-"}</div>
                        </>}
                        {mouseOverItem.type==='TASK' &&
                        <>
                            <label className={`col-5 su-${mouseOverItem.status}-icon`}>Task Name:</label>
                            <div className="col-7">{mouseOverItem.name}</div>
                        </>}
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Start Time:</label>
                        <div className="col-7">{mouseOverItem.start_time.format("YYYY-MM-DD HH:mm:ss")}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>End Time:</label>
                        <div className="col-7">{mouseOverItem.end_time.format("YYYY-MM-DD HH:mm:ss")}</div>
                        {mouseOverItem.type==='SCHEDULE' &&
                        <>
                            <label className={`col-5 su-${mouseOverItem.status}-icon`}>Antenna Set:</label>
                            <div className="col-7">{mouseOverItem.antennaSet}</div>
                        </>}
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Stations:</label>
                        <div className="col-7">{mouseOverItem.stations.groups}:{mouseOverItem.stations.counts}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Status:</label>
                        <div className="col-7">{mouseOverItem.status}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Duration:</label>
                        <div className="col-7">{mouseOverItem.duration}</div>
                    </div>
                }
                </OverlayPanel>
                {!this.state.isLoading &&
                    <Websocket url={process.env.REACT_APP_WEBSOCKET_URL} onOpen={this.onConnect} onMessage={this.handleData} onClose={this.onDisconnect} /> }
            </React.Fragment>
        );
    }

}