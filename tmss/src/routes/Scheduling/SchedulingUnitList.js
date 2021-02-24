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
        requirements_template_id:{
            name: "Template ID",
            filter: "select"
        },
        project:"Project",
        name:"Name",
        start_time:"Start Time",
        stop_time:"End time",
        duration:"Duration (HH:mm:ss)",
       
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
                 "id",
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
                id: "Scheduling Unit ID",
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
                created_at:"Created_At",
                updated_at:"Updated_At"
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
                "Scheduling unit ID":"filter-input-50",
                "Stations (CS/RS/IS)":"filter-input-50",
                "Tasks content (O/P/I)":"filter-input-50",
                "Number of SAPs in the target observation":"filter-input-50"
            }],
            defaultSortColumn: [{id: "Name", desc: false}],
        }
       
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
            const suTemplate = {};
            const schedulingSet = await ScheduleService.getSchedulingSets();
            const projects = await ScheduleService.getProjectList();
            const promises = [ScheduleService.getSchedulingUnitsExtended('blueprint'), 
                                ScheduleService.getSchedulingUnitsExtended('draft'),
                                ScheduleService.getMainGroupStations(),
                                WorkflowService.getWorkflowProcesses()];
            Promise.all(promises).then(async responses => {
                const blueprints = responses[0];
                let scheduleunits = responses[1];
                this.mainStationGroups = responses[2];
                let workflowProcesses = responses[3];
                const output = [];
                for( const scheduleunit  of scheduleunits){
                    const suSet = schedulingSet.find((suSet) => { return  scheduleunit.scheduling_set_id === suSet.id });
                    const project = projects.find((project) => { return suSet.project_id === project.name});
                    if (!this.props.project || (this.props.project && project.name===this.props.project)) {
                        scheduleunit['status'] = null;
                        scheduleunit['workflowStatus'] = null;
                        if (!suTemplate[scheduleunit.requirements_template_id]) {
                            const response = await ScheduleService.getSchedulingUnitTemplate(scheduleunit.requirements_template_id);
                            scheduleunit['template_description'] = response.description;
                            suTemplate[scheduleunit.requirements_template_id] = response;
                        } else {
                            scheduleunit['template_description'] = suTemplate[scheduleunit.requirements_template_id].description;
                        }
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
                            blueP['created_at'] = moment(blueP['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                            blueP['updated_at'] = moment(blueP['updated_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                            blueP['task_content'] = this.getTaskTypeGroupCounts(blueP['task_blueprints']);
                            blueP['linked_bp_draft'] = this.getLinksList([blueP.draft_id], 'draft');
                            blueP['template_description'] = suTemplate[blueP.requirements_template_id].description;
                            blueP['station_group'] = this.getStationGroup(blueP).counts;
                            blueP.project = project.name;
                            blueP.canSelect = false;
                            blueP.suSet = suSet.name;
                            // blueP.links = ['Project'];
                            // blueP.linksURL = {
                            //     'Project': `/project/view/${project.name}`
                            // }
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
                        scheduleunit['created_at'] = moment(scheduleunit['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                        scheduleunit['updated_at'] = moment(scheduleunit['updated_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                        scheduleunit.project = project.name;
                        scheduleunit.canSelect = true;
                        scheduleunit.suSet = suSet.name;
                        scheduleunit.links = ['Project', 'id'];
                        scheduleunit.linksURL = {
                            'Project': `/project/view/${project.name}`,
                            'id': `/schedulingunit/view/draft/${scheduleunit.id}`
                        }
                        output.push(scheduleunit);
                    }
                }
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
                    :<div>No scheduling unit found </div>
                 }  
            </>
        )
    }
}

export default SchedulingUnitList
