import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import moment from 'moment';
import AppLoader from "./../../layout/components/AppLoader";
import ViewTable from './../../components/ViewTable';
import UnitConverter from '../../utils/unit.converter';
import _ from 'lodash';
import ScheduleService from '../../services/schedule.service';
import { Link } from 'react-router-dom';
import WorkflowService from '../../services/workflow.service';
import UIConstants from '../../utils/ui.constants';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { CustomDialog } from '../../layout/components/CustomDialog';
import { appGrowl } from '../../layout/components/AppGrowl';

class SchedulingUnitList extends Component{
    constructor(props){
       super(props);
       this.defaultcolumns = {
        status: {
            name: "Status",
            filter: "select"
        },
        type:{
            name:"Type",
            filter:"select"
        },
        observation_strategy_template_id:{
            name: "Template ID",
            filter: "select"
        },
        project:"Project",
        name:"Name",
        start_time:{
            name:"Start Time",
            filter:"date",
            format:UIConstants.CALENDAR_DATETIME_FORMAT
        },
        stop_time:{
            name:"End time",
            filter:"date",
            format:UIConstants.CALENDAR_DATETIME_FORMAT
        },
        duration:{
            name:"Duration (HH:mm:ss)",
            format:UIConstants.CALENDAR_TIME_FORMAT
        }
       };
        if (props.hideProjectColumn) {
            delete this.defaultcolumns['project'];
        }
        this.STATUS_BEFORE_SCHEDULED = ['defining', 'defined', 'schedulable'];  // Statuses before scheduled to get station_group
        this.mainStationGroups = {};
        this.state = {
            columnOrders: [ 
                "Status", 
                "Type",
                // "Workflow Status",
                "workflowStatus",
                 "suid",
                 "linked_bp_draft",
                 "Template ID",
                 "template_description",
                  "priority",
                  "Project",
                  "suSet",
                  "Name",
                  "description",
                  "Start Time",
                  "End time", 
                  "Duration (HH:mm:ss)",  
                  "station_group", 
                  "task_content", 
                  "target_observation_sap", 
                  "target0angle1", 
                  "target0angle2", 
                //   "Target 1 - Reference Frame",
                  "target0referenceframe", 
                  "target1angle1", 
                  "target1angle2", 
                //   "Target 2 - Reference Frame",
                  "target1referenceframe",
                  "Cancelled",
                  "created_at", 
                  "updated_at", 
                  ],
            scheduleunit: [],
            paths: [{
                "View": "/schedulingunit/view",
            }],
            isLoading: true,
            defaultcolumns: [this.defaultcolumns],
            optionalcolumns:  [{
                actionpath:"actionpath",
                // workflowStatus: {
                //     name: "Workflow Status",
                //     filter: 'select'
                // },
                workflowStatus: 'Workflow Status',
                suid: "Scheduling Unit ID",
                linked_bp_draft:"Linked Blueprint/ Draft ID",
                template_description: "Template Description",
                priority:"Priority",
                suSet:"Scheduling set",
                description:"Description",           
                station_group: 'Stations (CS/RS/IS)',
                task_content: 'Tasks content (O/P/I)',
                target_observation_sap: "Number of SAPs in the target observation",
                do_cancel: {
                    name: "Cancelled",
                    filter: "switch",
                },
                created_at:{
                    name:"Created_At",
                    format:UIConstants.CALENDAR_DATETIME_FORMAT
                },
                updated_at:{
                    name:"Updated_At",
                    format:UIConstants.CALENDAR_DATETIME_FORMAT
                }
            }],
            columnclassname: [{
                "Scheduling Unit ID":"filter-input-50",
                "Template":"filter-input-50",
                "Project":"filter-input-50",
                "Priority":"filter-input-50",
                "Duration (HH:mm:ss)":"filter-input-75",
                "Linked Blueprint/ Draft ID":"filter-input-50",
                "Type": "filter-input-75",
                "Status":"filter-input-100",
                "Workflow Status":"filter-input-100",
                "Stations (CS/RS/IS)":"filter-input-50",
                "Tasks content (O/P/I)":"filter-input-50",
                "Number of SAPs in the target observation":"filter-input-50"
            }],
            defaultSortColumn: [{id: "Name", desc: false}],
            dialog: {header: 'Confirm', detail: 'Do you want to create a Scheduling Unit Blueprint?'},
            //dialogVisible: false
        }
        this.selectedRows = [];
        this.suDraftsList = []; // List of selected SU Drafts
        this.suBlueprintList = []; // List of selected SU Blueprints
        this.deletableDraftWithBlueprint = []; // List of deletable Scheduling Unit(s)
        this.deletableSUForDialogContent = []; // List of deletable Scheduling Unit Draft/Blueprint to show in dialog 

        this.checkAndDeleteSchedulingUnit = this.checkAndDeleteSchedulingUnit.bind(this);
        this.deleteSchedulingUnit = this.deleteSchedulingUnit.bind(this);
        this.getSchedulingDialogContent = this.getSchedulingDialogContent.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
        this.onRowSelection = this.onRowSelection.bind(this);
        this.reloadData = this.reloadData.bind(this);
        this.addTargetColumns = this.addTargetColumns.bind(this);
    }

    /**
     * Get count of tasks grouped by type (observation, pipeline, ingest)
     * @param {Array} tasks - array of task(draft or blueprint) objects
     */
    getTaskTypeGroupCounts(tasks = []) {
        const observation = tasks.filter(task => task.specifications_template.type_value === 'observation');
        const pipeline = tasks.filter(task => task.specifications_template.type_value === 'pipeline');
        const ingest = tasks.filter(task => task.specifications_template.type_value === 'ingest');
        return `${observation.length}/${pipeline.length}/${ingest.length}`;
    }

    /**
     * Get all stations of the SUs from the observation task or subtask based on the SU status.
     * @param {Object} schedulingUnit
     */
    getSUStations(schedulingUnit) {
        let stations = [];
        let tasks = schedulingUnit.task_blueprints?schedulingUnit.task_blueprints:schedulingUnit.task_drafts;
        /* Get all observation tasks */
        const observationTasks = _.filter(tasks, (task) => { return task.specifications_template.type_value.toLowerCase() === "observation"});
        for (const observationTask of observationTasks) {
            /** If the status of SU is before scheduled, get all stations from the station_groups from the task specification_docs */
            if ((!schedulingUnit.status || this.STATUS_BEFORE_SCHEDULED.indexOf(schedulingUnit.status.toLowerCase()) >= 0)
                && observationTask.specifications_doc.station_groups) {
                for (const grpStations of _.map(observationTask.specifications_doc.station_groups, "stations")) {
                    stations = _.concat(stations, grpStations);
                }
            }   else if (schedulingUnit.status && this.STATUS_BEFORE_SCHEDULED.indexOf(schedulingUnit.status.toLowerCase()) < 0 
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

    getStationGroup(itemSU) {
        const item = {};
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
        return item.stations;
    }

    /**
     * Function to get a component with list of links to a list of ids
     * @param {Array} linkedItems - list of ids
     * @param {String} type - blueprint or draft
     */
    getLinksList = (linkedItems, type) => {
        return (
            <>
                {linkedItems.length>0 && linkedItems.map((item, index) => (
                    <Link style={{paddingRight: '3px'}} to={`/schedulingunit/view/${type}/${item}`}>{item}</Link>
                ))}
            </>
        );                    
    }

    async getSchedulingUnitList () {
        //Get SU Draft/Blueprints for the Project ID. This request is coming from view Project page. Otherwise it will show all SU
        // let project = this.props.project;
        // if(project) {
        //     let scheduleunits = await ScheduleService.getSchedulingListByProject(project);
        //     if(scheduleunits){
        //         this.setState({
        //             scheduleunit: scheduleunits, isLoading: false
        //         });
        //     }
        // }   else { 
            
            const schedulingSet = await ScheduleService.getSchedulingSets();
            const projects = await ScheduleService.getProjectList();
            const promises = [ScheduleService.getSchedulingUnitsExtended('blueprint'), 
                                ScheduleService.getSchedulingUnitsExtended('draft'),
                                ScheduleService.getMainGroupStations(),
                                WorkflowService.getWorkflowProcesses(),
                                ScheduleService.getObservationStrategies()];
            Promise.all(promises).then(async responses => {
                const blueprints = responses[0];
                let scheduleunits = responses[1];
                this.mainStationGroups = responses[2];
                let workflowProcesses = responses[3];
                const suTemplates =  responses[4];
                const output = [];
                for( const scheduleunit  of scheduleunits){
                    const suSet = schedulingSet.find((suSet) => { return  scheduleunit.scheduling_set_id === suSet.id });
                    const project = projects.find((project) => { return suSet.project_id === project.name});
                    if (!this.props.project || (this.props.project && project.name===this.props.project)) {
                        scheduleunit['status'] = null;
                        scheduleunit['workflowStatus'] = null;
                        const obsStrategyTemplate = _.find(suTemplates, ['id',scheduleunit.observation_strategy_template_id]);
                        scheduleunit['template_description'] = obsStrategyTemplate.description;
                        scheduleunit['linked_bp_draft'] = this.getLinksList(scheduleunit.scheduling_unit_blueprints_ids, 'blueprint');
                        scheduleunit['task_content'] = this.getTaskTypeGroupCounts(scheduleunit['task_drafts']);
                        scheduleunit['station_group'] = this.getStationGroup(scheduleunit).counts;
                        const blueprintdata = blueprints.filter(i => i.draft_id === scheduleunit.id);
                        blueprintdata.map(blueP => { 
                            const workflowProcess = _.find(workflowProcesses, ['su', blueP.id]);
                            blueP['workflowStatus'] = workflowProcess?workflowProcess.status: null;
                            blueP.duration = moment.utc((blueP.duration || 0)*1000).format('HH:mm:ss');
                            blueP.type="Blueprint"; 
                            blueP['actionpath'] ='/schedulingunit/view/blueprint/'+blueP.id;
                            // blueP['created_at'] = moment(blueP['created_at'],  moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                            // blueP['updated_at'] = moment(blueP['updated_at'], moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                            // blueP['start_time'] = moment(blueP['start_time'], moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                            // blueP['stop_time'] = moment(blueP['stop_time'], moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                            blueP['task_content'] = this.getTaskTypeGroupCounts(blueP['task_blueprints']);
                            blueP['linked_bp_draft'] = this.getLinksList([blueP.draft_id], 'draft');
                            blueP['template_description'] = obsStrategyTemplate.description;
                            blueP['observation_strategy_template_id'] = obsStrategyTemplate.id;
                            blueP['station_group'] = this.getStationGroup(blueP).counts;
                            blueP.project = project.name;
                            blueP['suid'] =  blueP.id;
                            blueP.canSelect = true;
                            blueP.suSet = suSet.name;
                            blueP.links = ['Project', 'id'];
                            blueP.linksURL = {
                                'Project': `/project/view/${project.name}`,
                                'id': `/schedulingunit/view/blueprint/${blueP.id}`
                            }
                            return blueP; 
                        });
                        output.push(...blueprintdata);
                        scheduleunit['actionpath']='/schedulingunit/view/draft/'+scheduleunit.id;
                        scheduleunit['type'] = 'Draft';
                        scheduleunit['duration'] = moment.utc((scheduleunit.duration || 0)*1000).format('HH:mm:ss');
                        // scheduleunit['created_at'] = moment(scheduleunit['created_at'], moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                        // scheduleunit['updated_at'] = moment(scheduleunit['updated_at'], moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                       // scheduleunit['start_time'] = moment(scheduleunit['start_time'], moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                       // scheduleunit['stop_time'] = moment(scheduleunit['stop_time'], moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                        scheduleunit.project = project.name;
                        scheduleunit.canSelect = true;
                        scheduleunit.suSet = suSet.name;
                        scheduleunit.links = ['Project', 'id'];
                        scheduleunit.linksURL = {
                            'Project': `/project/view/${project.name}`,
                            'id': `/schedulingunit/view/draft/${scheduleunit.id}`
                        };
                        scheduleunit['suid'] =  scheduleunit.id;
                        output.push(scheduleunit);
                    }
                }
               // const defaultColumns = this.defaultcolumns;
                let optionalColumns = this.state.optionalcolumns[0];
                let columnclassname = this.state.columnclassname[0];
                output.map(su => {
                    su.taskDetails = su.type==="Draft"?su.task_drafts:su.task_blueprints;
                    const targetObserv = su.taskDetails.find(task => task.specifications_template.type_value==='observation' && task.specifications_doc.SAPs);
                    // Constructing targets in single string to make it clear display 
                    if (targetObserv && targetObserv.specifications_doc) {
                        targetObserv.specifications_doc.SAPs.map((target, index) => {
                            su[`target${index}angle1`] = UnitConverter.getAngleInput(target.digital_pointing.angle1);
                            su[`target${index}angle2`] = UnitConverter.getAngleInput(target.digital_pointing.angle2,true);
                            su[`target${index}referenceframe`] = target.digital_pointing.direction_type;
                            optionalColumns[`target${index}angle1`] = `Target ${index + 1} - Angle 1`;
                            optionalColumns[`target${index}angle2`] = `Target ${index + 1} - Angle 2`;
                            optionalColumns[`target${index}referenceframe`] = {
                                name: `Target ${index + 1} - Reference Frame`,
                                filter: "select"
                            };
                            columnclassname[`Target ${index + 1} - Angle 1`] = "filter-input-75";
                            columnclassname[`Target ${index + 1} - Angle 2`] = "filter-input-75";
                            return target;
                        });
                    }
                    return su;
                });
                this.setState({
                    scheduleunit: output, isLoading: false, optionalColumns: [optionalColumns],
                    columnclassname: [columnclassname]
                });
                this.addTargetColumns(output);
                this.selectedRows = [];
            });
        // }
    }
    
    addTargetColumns(schedulingUnits) {
        let optionalColumns = this.state.optionalcolumns[0];
        let columnclassname = this.state.columnclassname[0];
        schedulingUnits.map(su => {
            su.taskDetails = su.type==="Draft"?su.task_drafts:su.task_blueprints;
            const targetObserv = su.taskDetails.find(task => task.specifications_template.type_value==='observation' && task.specifications_doc.SAPs);
            // const targetObservationSAPs = su.taskDetails.find(task => task.specifications_template.name==='target observation');
            // if (targetObservationSAPs.specifications_doc && targetObservationSAPs.specifications_doc.SAPs) {
            //     su['target_observation_sap'] = targetObservationSAPs.specifications_doc.SAPs.length;
            // } else {
            //     su['target_observation_sap'] = 0;
            // }
            // Addin target pointing fields as separate column
            // if (targetObserv && targetObserv.specifications_doc) {
            if (targetObserv) {
                su['target_observation_sap'] = targetObserv.specifications_doc.SAPs.length;
                targetObserv.specifications_doc.SAPs.map((target, index) => {
                    su[`target${index}angle1`] = UnitConverter.getAngleInput(target.digital_pointing.angle1);
                    su[`target${index}angle2`] = UnitConverter.getAngleInput(target.digital_pointing.angle2,true);
                    su[`target${index}referenceframe`] = target.digital_pointing.direction_type;
                    optionalColumns[`target${index}angle1`] = `Target ${index + 1} - Angle 1`;
                    optionalColumns[`target${index}angle2`] = `Target ${index + 1} - Angle 2`;
                    /*optionalColumns[`target${index}referenceframe`] = {
                        name: `Target ${index + 1} - Reference Frame`,
                        filter: "select"
                    };*/ //TODO: Need to check why this code is not working
                    optionalColumns[`target${index}referenceframe`] = `Target ${index + 1} - Reference Frame`;
                    columnclassname[`Target ${index + 1} - Angle 1`] = "filter-input-75";
                    columnclassname[`Target ${index + 1} - Angle 2`] = "filter-input-75";
                    columnclassname[`Target ${index + 1} - Reference Frame`] = "filter-input-75";
                    return target;
                });
            }   else {
                su['target_observation_sap'] = 0;
            }
            return su;
        });
        this.setState({
            scheduleunit: schedulingUnits, isLoading: false, optionalColumns: [optionalColumns],
            columnclassname: [columnclassname]
        });
    }

    componentDidMount(){ 
       this.getSchedulingUnitList();
    }

    /**
     * Callback function passed to ViewTable component to pass back the selected rows.
     * @param {Array} selectedRows - Subset of data passed to the ViewTable component based on selection.
     */
    onRowSelection(selectedRows) {
        this.selectedRows = selectedRows;
    }

    /**
     * Funtion to reload data. This function can be called from the implementing component.
     */
    reloadData() {
        this.setState({isLoading: true});
        this.getSchedulingUnitList();
    }

    /**
     * Check and delete the selected Scheduling Unit(s)
     */
    checkAndDeleteSchedulingUnit() {
        this.suDraftsList = [];
        this.suBlueprintList = [];
        this.deletableDraftWithBlueprint = [];
        this.deletableSUForDialogContent = [];
        let tmpTotalSUBList = [];
        let hasInvalidSUD = false;
        if(this.selectedRows.length === 0) {
            appGrowl.show({severity: 'info', summary: 'Select Row', detail: 'Select Scheduling Unit Draft/Blueprint to delete.'});
        }   else {
            //Filter SUB
            this.suBlueprintList = _.filter(this.selectedRows, (schedulingUnit) => { return schedulingUnit.type.toLowerCase() === "blueprint" });
            //Filter SUD
            if (this.suBlueprintList && this.suBlueprintList.length > 0) {
                this.suDraftsList = _.difference(this.selectedRows, this.suBlueprintList);
            }   else {
                this.suDraftsList = this.selectedRows;
            }
            //Find Deletable SU Drafts
            if (this.suDraftsList && this.suDraftsList.length > 0) {
                this.suDraftsList.map(sud => {
                    if (sud.scheduling_unit_blueprints_ids && sud.scheduling_unit_blueprints_ids.length === 0) {
                        this.deletableDraftWithBlueprint.push(sud);
                        this.deletableSUForDialogContent.push(sud);
                    }   else if (this.suBlueprintList && this.suBlueprintList.length > 0) {
                        let tmpSUBList = _.filter(this.suBlueprintList, (sub => { return sub.draft_id === sud.id}));
                        tmpTotalSUBList = (tmpSUBList && tmpSUBList.length > 0)?[...tmpTotalSUBList, ...tmpSUBList]: tmpTotalSUBList;
                        if (sud.scheduling_unit_blueprints_ids && tmpSUBList && tmpSUBList.length === sud.scheduling_unit_blueprints_ids.length) {
                            this.deletableDraftWithBlueprint.push(sud);
                            this.deletableSUForDialogContent.push(sud);
                            this.deletableSUForDialogContent = [...this.deletableSUForDialogContent, ...tmpSUBList];
                        }   else {
                            hasInvalidSUD = true;
                            this.deletableSUForDialogContent = [...this.deletableSUForDialogContent, ...tmpSUBList];
                        }
                    }   else {
                        hasInvalidSUD = true;
                    }
                });
            }
           // Find SUB which is not blongs to the selected SUD
            if (this.suBlueprintList && this.suBlueprintList.length !== tmpTotalSUBList.length) {
                this.deletableDraftWithBlueprint = [...this.deletableDraftWithBlueprint, ..._.difference(this.suBlueprintList, tmpTotalSUBList)];
                this.deletableSUForDialogContent = [...this.deletableSUForDialogContent, ..._.difference(this.suBlueprintList, tmpTotalSUBList)];
            }
           
            if (this.deletableDraftWithBlueprint.length === 0 && this.deletableSUForDialogContent.length === 0) {
                appGrowl.show({severity: 'info', summary: 'Blueprint Exists', detail: "Blueprint(s) exist(s) for the selected Scheduling Unit Draft(s) and can not be deleted."});
            }   else {
                let dialog = this.state.dialog;
                dialog.type = "confirmation";
                dialog.header= "Confirm to Delete Scheduling Unit(s)";
                if (hasInvalidSUD) {
                    dialog.detail = "One or more selected Scheduling Unit Draft(s) having Blueprint(s) cannot be deleted. Do you want to ignore them and delete others?";
                }   else {
                    dialog.detail = "Do you want to delete the selected Scheduling Unit Draft/Blueprint?";
                }
                dialog.content = this.getSchedulingDialogContent;
                dialog.actions = [{id: 'yes', title: 'Yes', callback: this.deleteSchedulingUnit, className:(this.props.project)?"dialog-btn": ""},
                {id: 'no', title: 'No', callback: this.closeDialog, className:(this.props.project)?"dialog-btn": ""}];
                dialog.onSubmit = this.deleteSchedulingUnit;
                dialog.width = '55vw';
                dialog.showIcon = false;
                this.setState({dialog: dialog, dialogVisible: true});
            }
        }
    }
    
    /**
     * Prepare Scheduling Unit(s) details to show on confirmation dialog
     */
    getSchedulingDialogContent() {
        let selectedSchedulingUnits = [];
        let unselectedSchedulingUnits = [];
        for(const su of this.deletableSUForDialogContent) {
            selectedSchedulingUnits.push({suId: su.id, suName: su.name, 
                suType: su.type,
                sudbid: su.type.toLowerCase() === 'draft'? su.scheduling_unit_blueprints_ids.join(', '): su.draft_id});
        }
        let unselectedSUList = _.difference(this.selectedRows, this.deletableSUForDialogContent);
        for(const su of unselectedSUList) {
            unselectedSchedulingUnits.push({suId: su.id, suName: su.name, 
                suType: su.type,
                sudbid: su.type.toLowerCase() === 'draft'? su.scheduling_unit_blueprints_ids.join(', '): su.draft_id});
        }

        return  <> 
                     {selectedSchedulingUnits.length > 0 &&
                        <div style={{marginTop: '1em'}}>
                            <b>Scheduling Unit(s) that can be deleted</b>
                            <DataTable value={selectedSchedulingUnits} resizableColumns columnResizeMode="expand" className="card" style={{paddingLeft: '0em'}}>
                                <Column field="suId" header="Id"></Column>
                                <Column field="suName" header="Name"></Column>
                                <Column field="suType" header="Type"></Column>
                                <Column field="sudbid" header="Draft/Blueprint ID(s)"></Column>
                            </DataTable>
                        </div>
                    }
                    {unselectedSchedulingUnits.length > 0 &&
                        <div style={{marginTop: '1em'}}>
                            <b>Scheduling Unit(s) that will be ignored</b>
                            <DataTable value={unselectedSchedulingUnits} resizableColumns columnResizeMode="expand" className="card" style={{paddingLeft: '0em'}}>
                                <Column field="suId" header="Id"></Column>
                                <Column field="suName" header="Name"></Column>
                                <Column field="suType" header="Type"></Column>
                                <Column field="sudbid" header="Draft/Blueprint ID(s)"></Column>
                            </DataTable>
                        </div>
                    }
                    
                </>
    }

    /**
     * Delete selected Scheduling Unit(s)
     */
    deleteSchedulingUnit() {
        this.suDraftsWithBlueprintList = [];
        let hasError = false;
        for(const schedulingUnit of this.deletableDraftWithBlueprint) {
            if( !ScheduleService.deleteSchedulingUnit(schedulingUnit.type, schedulingUnit.id)){
                hasError = true;
            }
        }
        if(hasError){
            appGrowl.show({severity: 'error', summary: 'error', detail: 'Error while deleting scheduling Unit(s)'});
        }   else {
            appGrowl.show({severity: 'success', summary: 'Success', detail: 'Selected Scheduling Unit(s) deleted successfully'});
        }
        this.selectedRows = [];
        this.setState({dialogVisible: false, isLoading: true});
        this.componentDidMount();
    }

    /**
     * Callback function to close the dialog prompted.
     */
    closeDialog() {
        this.setState({dialogVisible: false});
    }
    
    render(){
        if (this.state.isLoading) {
            return <AppLoader/>
        }
        return(
            <>
                
               {
                /*
                    * Call View table to show table data, the parameters are,
                    data - Pass API data
                    defaultcolumns - These columns will be populate by default in table with header mentioned
                    optionalcolumns - These columns will not appear in the table by default, but user can toggle the columns using toggle menu
                    showaction - {true/false} -> to show the action column
                    keyaccessor - This is id column for Action item
                    paths - specify the path for navigation - Table will set "id" value for each row in action button
                    
                */}
               <div className="delete-option">
                    <div >
                        <span className="p-float-label">
                            {this.state.scheduleunit && this.state.scheduleunit.length > 0 &&
                                <a href="#" onClick={this.checkAndDeleteSchedulingUnit}  title="Delete selected Scheduling Unit(s)">
                                    <i class="fa fa-trash" aria-hidden="true" ></i>
                                </a>
                            }
                        </span>
                    </div>                           
                </div>

                {   (this.state.scheduleunit && this.state.scheduleunit.length>0)?
                    <ViewTable 
                        data={this.state.scheduleunit} 
                        defaultcolumns={this.state.defaultcolumns} 
                        optionalcolumns={this.state.optionalcolumns}
                        columnclassname={this.state.columnclassname}
                        columnOrders={this.state.columnOrders}
                        defaultSortColumn={this.state.defaultSortColumn}
                        showaction="true"
                        keyaccessor="id"
                        paths={this.state.paths}
                        unittest={this.state.unittest}
                        tablename="scheduleunit_list"
                        allowRowSelection={this.props.allowRowSelection}
                        onRowSelection = {this.onRowSelection}
                    />
                    :<div>No Scheduling Unit found</div>
                 }  
                  <CustomDialog type="confirmation" visible={this.state.dialogVisible}
                        header={this.state.dialog.header} message={this.state.dialog.detail} actions={this.state.dialog.actions}
                        content={this.state.dialog.content} width={this.state.dialog.width} showIcon={this.state.dialog.showIcon}
                        onClose={this.closeDialog} onCancel={this.closeDialog} onSubmit={this.state.dialog.onSubmit}/>
            </>
        )
    }
}

export default SchedulingUnitList
