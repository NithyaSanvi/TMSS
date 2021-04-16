import React, {Component} from 'react';
import { Redirect } from 'react-router-dom/cjs/react-router-dom.min';
import moment from 'moment';
import _ from 'lodash';
import Websocket from 'react-websocket';

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
import Validator from '../../utils/validator';
import SchedulingUnitSummary from '../Scheduling/summary';
import UIConstants from '../../utils/ui.constants';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TieredMenu } from 'primereact/tieredmenu';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import ReservationSummary from '../Reservation/reservation.summary';

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
            isSUListVisible: true,
            isSUDetsVisible: false,
            canExtendSUList: true,
            canShrinkSUList: false,
            selectedItem: null,
            suTaskList:[],
            isSummaryLoading: false,
            stationGroup: [],
            reservationEnabled: true
        }
        this.STATUS_BEFORE_SCHEDULED = ['defining', 'defined', 'schedulable'];  // Statuses before scheduled to get station_group
        this.mainStationGroups = {};
        this.reservations = [];
        this.reservationReasons = [];
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
        this.showSUSummary = this.showSUSummary.bind(this);
        this.showReservationSummary = this.showReservationSummary.bind(this);
        this.dateRangeCallback = this.dateRangeCallback.bind(this);
        this.resizeSUList = this.resizeSUList.bind(this);
        this.suListFilterCallback = this.suListFilterCallback.bind(this);
        this.addWeekReservations = this.addWeekReservations.bind(this);
        this.handleData = this.handleData.bind(this);
        this.addNewData = this.addNewData.bind(this);
        this.updateExistingData = this.updateExistingData.bind(this);
        this.updateSchedulingUnit = this.updateSchedulingUnit.bind(this);
    }

    async componentDidMount() {
        UtilService.getReservationTemplates().then(templates => {
            this.reservationTemplate = templates.length>0?templates[0]:null;
            if (this.reservationTemplate) {
                let reasons = this.reservationTemplate.schema.properties.activity.properties.type.enum;
                for (const reason of reasons) {
                    this.reservationReasons.push({name: reason});
                }
            }
        });
        
        // Fetch all details from server and prepare data to pass to timeline and table components
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingUnitsExtended('blueprint'),
                            ScheduleService.getSchedulingUnitDraft(),
                            ScheduleService.getSchedulingSets(),
                            UtilService.getUTC(),
                            TaskService.getSubtaskTemplates(),
                            UtilService.getReservations()] ;
        Promise.all(promises).then(async(responses) => {
            this.subtaskTemplates = responses[5];
            const projects = responses[0];
            const suBlueprints = _.sortBy(responses[1], 'name');
            const suDrafts = responses[2].data.results;
            const suSets = responses[3]
            let group = [], items = [];
            const currentUTC = moment.utc(responses[4]);
            this.reservations = responses[6];
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
            if (this.state.reservationEnabled) {
                items = this.addWeekReservations(items, defaultStartTime, defaultEndTime, currentUTC);
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
            if (task.specifications_template.type_value.toLowerCase() === "observation" 
                && task.specifications_doc.antenna_set) {
                antennaSet = task.specifications_doc.antenna_set;
            }
        }
        let item = { id: `${suBlueprint.id}-${suBlueprint.start_time}`, 
            suId: suBlueprint.id,
            group: moment.utc(suBlueprint.start_time).format("MMM DD ddd"),
            title: "",
            project: suBlueprint.project,
            name: suBlueprint.name,
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
        if (item.type === "SCHEDULE") { 
            this.showSUSummary(item);
        }   else if (item.type === "RESERVATION") {
            this.showReservationSummary(item);
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
                                if (task.template.type_value.toLowerCase() === "observation"
                                    && task.specifications_doc.antenna_set) {
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
     * To load and show Reservation summary
     * @param {Object} item 
     */
     showReservationSummary(item) {
        this.setState({selectedItem: item, isReservDetsVisible: true, isSUDetsVisible: false});
    }

    /**
     * Closes the SU details section
     */
    closeSUDets() {
        this.setState({isSUDetsVisible: false, isReservDetsVisible: false, canExtendSUList: true, canShrinkSUList: false});
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
        if (item.type === "SCHEDULE") {
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
                item.suStartTime = moment.utc(itemSU.start_time);
                item.suStopTime = moment.utc(itemSU.stop_time);
            }
        }   else {
            const reservation = _.find(this.reservations, {'id': parseInt(item.id.split("-")[1])});
            const reservStations = reservation.specifications_doc.resources.stations;
            // const reservStationGroups = this.groupSUStations(reservStations);
            item.name = reservation.name;
            item.contact = reservation.specifications_doc.activity.contact
            item.activity_type = reservation.specifications_doc.activity.type;
            item.stations = reservStations;
            item.planned = reservation.specifications_doc.activity.planned;
            item.displayStartTime = moment.utc(reservation.start_time);
            item.displayEndTime = reservation.duration?moment.utc(reservation.stop_time):null;
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
                if (this.state.reservationEnabled) {
                    items = this.addWeekReservations(items, startTime, endTime, currentUTC);
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
                this.setState({redirect: `/reservation/list`});
                break;
            }
            case 'Add Reservation': {
                this.setState({redirect: `/reservation/create`});
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
                let suDrafts = this.state.suDrafts;
                let suSets = this.state.suSets;
                ScheduleService.getSchedulingUnitDraftById(id)
                .then(suDraft => {
                    suDrafts.push(suDraft);
                    _.remove(suSets, function(suSet) { return suSet.id === suDraft.scheduling_set_id});
                    suSets.push(suDraft.scheduling_set_object);
                    this.setState({suSet: suSets, suDrafts: suDrafts});
                });
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
     * Fetch the latest SUB object from the backend and format as required for the timeline and pass them to the timeline component
     * to update the timeline view with latest data.
     * @param {Number} id 
     */
    updateSchedulingUnit(id) {
        ScheduleService.getSchedulingUnitExtended('blueprint', id, true)
        .then(async(suBlueprint) => {
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
            // Add Subtask Id as control id for task if subtask type us control. Also add antenna_set & band prpoerties to the task object.
            for (let task of suBlueprint.tasks) {
                const subTaskIds = task.subtasks.filter(subtask => {
                    const template = _.find(this.subtaskTemplates, ['id', subtask.specifications_template_id]);
                    return (template && template.name.indexOf('control')) > 0;
                });
                task.subTaskID = subTaskIds.length ? subTaskIds[0].id : ''; 
                if (task.specifications_template.type_value.toLowerCase() === "observation"
                    && task.specifications_doc.antenna_set) {
                    task.antenna_set = task.specifications_doc.antenna_set;
                    task.band = task.specifications_doc.filter;
                }
            }
            // Get stations involved for this SUB
            let stations = this.getSUStations(suBlueprint);
            suBlueprint.stations = _.uniq(stations);
            // Remove the old SUB object from the existing list and add the newly fetched SUB
            _.remove(suBlueprints, function(suB) { return suB.id === id});
            suBlueprints.push(suBlueprint);
            this.setState({suBlueprints: suBlueprints});
            // Create timeline group and items
            let updatedItemGroupData = await this.dateRangeCallback(this.state.startTime, this.state.endTime, true);
            this.timeline.updateTimeline(updatedItemGroupData);
        });
    }

    async showReservations(e) {
        await this.setState({reservationEnabled: e.value});
        let updatedItemGroupData = await this.dateRangeCallback(this.state.startTime, this.state.endTime, true);
        this.timeline.updateTimeline(updatedItemGroupData);
    }

    /**
     * Add Week Reservations during the visible timeline period
     * @param {Array} items 
     * @param {moment} startTime
     * @param {moment} endTime
     */
     addWeekReservations(items, startTime, endTime, currentUTC) {
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
                reservation.stop_time = reservationEndTime;
                let splitReservations = this.splitReservations(reservation, startTime, endTime, currentUTC);
                for (const splitReservation of splitReservations) {
                    items.push(this.getReservationItem(splitReservation, currentUTC));
                }
                
            }
        }
        return items;
    }

    /**
     * Function to check if a reservation is for more than a day and split it to multiple objects to display in each day
     * @param {Object} reservation - Reservation object
     * @param {moment} startTime - moment object of the start datetime of the week view
     * @param {moment} endTime  - moment object of the end datetime of the week view
     * @returns 
     */
    splitReservations(reservation, startTime, endTime) {
        const reservationStartTime = moment.utc(reservation.start_time);
        let weekStartDate = moment(startTime).add(-1, 'day').startOf('day');
        let weekEndDate = moment(endTime).add(1, 'day').startOf('day');
        let splitReservations = [];
        while(weekStartDate.add(1, 'days').diff(weekEndDate) < 0) {
            const dayStart = weekStartDate.clone().startOf('day');
            const dayEnd = weekStartDate.clone().endOf('day');
            let splitReservation = null;
            if (reservationStartTime.isSameOrBefore(dayStart) && 
                (reservation.stop_time.isBetween(dayStart, dayEnd) ||
                    reservation.stop_time.isSameOrAfter(dayEnd))) {
                splitReservation = _.cloneDeep(reservation);
                splitReservation.start_time = moment.utc(dayStart.format("YYYY-MM-DD HH:mm:ss"));
            }   else if(reservationStartTime.isBetween(dayStart, dayEnd)) {
                splitReservation = _.cloneDeep(reservation);
                splitReservation.start_time = reservationStartTime;                
            }
            if (splitReservation) {
                if (!reservation.stop_time || reservation.stop_time.isSameOrAfter(dayEnd)) {
                    splitReservation.end_time = weekStartDate.clone().hour(23).minute(59).seconds(59);
                }   else if (reservation.stop_time.isSameOrBefore(dayEnd)) {
                    splitReservation.end_time = weekStartDate.clone().hour(reservation.stop_time.hours()).minutes(reservation.stop_time.minutes()).seconds(reservation.stop_time.seconds);
                }
                splitReservations.push(splitReservation);
            }
        }
        return splitReservations;
    }

    /**
     * Get reservation timeline item. If the reservation doesn't have duration, item endtime should be week endtime.
     * @param {Object} reservation 
     * @param {moment} endTime 
     */
    getReservationItem(reservation, displayDate) {
        const reservationSpec = reservation.specifications_doc;
        const group = moment.utc(reservation.start_time).format("MMM DD ddd");
        const blockColor = RESERVATION_COLORS[this.getReservationType(reservationSpec.schedulability)];
        let item = { id: `Res-${reservation.id}-${group}`,
                        start_time: moment.utc(`${displayDate.format('YYYY-MM-DD')} ${reservation.start_time.format('HH:mm:ss')}`),
                        end_time: moment.utc(`${displayDate.format('YYYY-MM-DD')} ${reservation.end_time.format('HH:mm:ss')}`),
                        name: reservationSpec.activity.type, project: reservation.project_id,
                        group: group,
                        type: 'RESERVATION',
                        title: `${reservationSpec.activity.type}${reservation.project_id?("-"+ reservation.project_id):""}`,
                        desc: reservation.description,
                        duration: reservation.duration?UnitConverter.getSecsToHHmmss(reservation.duration):"Unknown",
                        bgColor: blockColor.bgColor, selectedBgColor: blockColor.bgColor, color: blockColor.color
                    };
        return item;
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
    async setReservationFilter(filter) {
        await this.setState({reservationFilter: filter});
        let updatedItemGroupData = await this.dateRangeCallback(this.state.startTime, this.state.endTime, true);
        this.timeline.updateTimeline(updatedItemGroupData);
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        const isSUListVisible = this.state.isSUListVisible;
        const isSUDetsVisible = this.state.isSUDetsVisible;
        const isReservDetsVisible = this.state.isReservDetsVisible;
        const canExtendSUList = this.state.canExtendSUList;
        const canShrinkSUList = this.state.canShrinkSUList;
        let suBlueprint = null, reservation = null;
        if (isSUDetsVisible) {
            suBlueprint = _.find(this.state.suBlueprints, {id: parseInt(this.state.selectedItem.id.split('-')[0])});
        }
        if (isReservDetsVisible) {
            reservation = _.find(this.reservations, {id: parseInt(this.state.selectedItem.id.split('-')[1])});
            reservation.project = this.state.selectedItem.project;
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
                            <div className={isSUListVisible && (isSUDetsVisible || isReservDetsVisible || 
                                                (canExtendSUList && !canShrinkSUList)?"col-lg-4 col-md-4 col-sm-12":
                                                ((canExtendSUList && canShrinkSUList)?"col-lg-5 col-md-5 col-sm-12":"col-lg-6 col-md-6 col-sm-12"))}
                                 style={isSUListVisible?{position: "inherit", borderRight: "5px solid #efefef", paddingTop: "10px"}:{display: "none"}}>
                                <ViewTable viewInNewWindow
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
                            <div className={isSUListVisible?((isSUDetsVisible || isReservDetsVisible)?"col-lg-5 col-md-5 col-sm-12": 
                                                (!canExtendSUList && canShrinkSUList)?"col-lg-6 col-md-6 col-sm-12":
                                                ((canExtendSUList && canShrinkSUList)?"col-lg-7 col-md-7 col-sm-12":"col-lg-8 col-md-8 col-sm-12")):
                                                ((isSUDetsVisible || isReservDetsVisible)?"col-lg-9 col-md-9 col-sm-12":"col-lg-12 col-md-12 col-sm-12")}
                                // style={{borderLeft: "3px solid #efefef"}}
                                >
                                {/* Panel Resize buttons */}
                                {isSUListVisible &&
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
                                }
                                <div className={isSUListVisible?"resize-div su-visible":"resize-div su-hidden"}>
                                    {isSUListVisible &&
                                    <button className="p-link resize-btn" 
                                            title="Hide List"
                                            onClick={(e)=> { this.setState({isSUListVisible: false})}}>
                                        <i className="pi pi-eye-slash"></i>
                                    </button>
                                    }
                                    {!isSUListVisible &&
                                    <button className="p-link resize-btn"
                                            title="Show List"
                                            onClick={(e)=> { this.setState({isSUListVisible: true})}}>
                                        <i className="pi pi-eye"> Show List</i>
                                    </button>
                                    }
                                </div>
                                <div className={`timeline-view-toolbar ${this.state.reservationEnabled && 'alignTimeLineHeader'}`}>
                                    <div  className="sub-header">
                                        <label >Show Reservations</label>
                                        <InputSwitch checked={this.state.reservationEnabled} onChange={(e) => {this.showReservations(e)}} />                                       
                                       
                                    </div>
                                
                                    {this.state.reservationEnabled &&
                                    <div className="sub-header">
                                        <label style={{marginLeft: '20px'}}>Reservation</label>
                                        <Dropdown optionLabel="name" optionValue="name" 
                                                    style={{top:'2px'}}
                                                    value={this.state.reservationFilter} 
                                                    options={this.reservationReasons} 
                                                    filter showClear={true} filterBy="name"
                                                    onChange={(e) => {this.setReservationFilter(e.value)}} 
                                                    placeholder="Reason"/>
                                    
                                    </div>
                                    }
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
                                                viewInNewWindow
                                                constraintsTemplate={this.state.suConstraintTemplate}
                                                closeCallback={this.closeSUDets}
                                                stationGroup={this.state.stationGroup}
                                                location={this.props.location}></SchedulingUnitSummary>
                                    }
                                </div>
                            }  
                            {this.state.isReservDetsVisible &&
                                <div className="col-lg-3 col-md-3 col-sm-12" 
                                     style={{borderLeft: "1px solid #efefef", marginTop: "0px", backgroundColor: "#f2f2f2"}}>
                                    {this.state.isSummaryLoading?<AppLoader /> :
                                        <ReservationSummary reservation={reservation} location={this.props.location} closeCallback={this.closeSUDets}></ReservationSummary>
                                    }
                                </div>
                            }
                        </div>
                    </>
                }
                {/* SU Item Tooltip popover with SU status color */}
                <OverlayPanel className="timeline-popover" ref={(el) => this.popOver = el} dismissable>
                {mouseOverItem  && mouseOverItem.type === "SCHEDULE" &&
                    <div className={`p-grid su-${mouseOverItem.status}`} style={{width: '350px'}}>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Project:</label>
                        <div className="col-7">{mouseOverItem.project}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Scheduling Unit:</label>
                        <div className="col-7">{mouseOverItem.name}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Friends:</label>
                        <div className="col-7">{mouseOverItem.friends?mouseOverItem.friends:"-"}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>Start Time:</label>
                        <div className="col-7">{mouseOverItem.suStartTime.format(UIConstants.CALENDAR_DATETIME_FORMAT)}</div>
                        <label className={`col-5 su-${mouseOverItem.status}-icon`}>End Time:</label>
                        <div className="col-7">{mouseOverItem.suStopTime.format(UIConstants.CALENDAR_DATETIME_FORMAT)}</div>
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
                {(mouseOverItem && mouseOverItem.type === "RESERVATION") &&
                    <div className={`p-grid`} style={{width: '350px', backgroundColor: mouseOverItem.bgColor, color: mouseOverItem.color}}>
                        <h3 className={`col-12`}>Reservation Overview</h3>
                        <hr></hr>
                        <label className={`col-5`} style={{color: mouseOverItem.color}}>Name:</label>
                        <div className="col-7">{mouseOverItem.name}</div>
                        <label className={`col-5`} style={{color: mouseOverItem.color}}>Description:</label>
                        <div className="col-7">{mouseOverItem.desc}</div>
                        <label className={`col-5`} style={{color: mouseOverItem.color}}>Type:</label>
                        <div className="col-7">{mouseOverItem.activity_type}</div>
                        <label className={`col-5`} style={{color: mouseOverItem.color}}>Stations:</label>
                        {/* <div className="col-7"><ListBox options={mouseOverItem.stations} /></div> */}
                        <div className="col-7 station-list">
                            {mouseOverItem.stations.map((station, index) => (
                                <div key={`stn-${index}`}>{station}</div>
                            ))}
                        </div>
                        <label className={`col-5`} style={{color: mouseOverItem.color}}>Project:</label>
                        <div className="col-7">{mouseOverItem.project?mouseOverItem.project:"-"}</div>
                        <label className={`col-5`} style={{color: mouseOverItem.color}}>Start Time:</label>
                        <div className="col-7">{mouseOverItem.displayStartTime.format(UIConstants.CALENDAR_DATETIME_FORMAT)}</div>
                        <label className={`col-5`} style={{color: mouseOverItem.color}}>End Time:</label>
                        <div className="col-7">{mouseOverItem.displayEndTime?mouseOverItem.displayEndTime.format(UIConstants.CALENDAR_DATETIME_FORMAT):'Unknown'}</div>
                        {/* <label className={`col-5`} style={{color: mouseOverItem.color}}>Stations:</label>
                        <div className="col-7">{mouseOverItem.stations.groups}:{mouseOverItem.stations.counts}</div> */}
                        <label className={`col-5`} style={{color: mouseOverItem.color}}>Duration:</label>
                        <div className="col-7">{mouseOverItem.duration}</div>
                        <label className={`col-5`} style={{color: mouseOverItem.color}}>Planned:</label>
                        <div className="col-7">{mouseOverItem.planned?'Yes':'No'}</div>
                    </div>
                }
                </OverlayPanel>
                {/* Open Websocket after loading all initial data */}
                {!this.state.isLoading &&
                    <Websocket url={process.env.REACT_APP_WEBSOCKET_URL} onOpen={this.onConnect} onMessage={this.handleData} onClose={this.onDisconnect} /> }
            </React.Fragment>
        );
    }

}