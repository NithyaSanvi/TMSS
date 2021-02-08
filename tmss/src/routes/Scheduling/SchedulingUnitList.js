import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import moment from 'moment';
import AppLoader from "./../../layout/components/AppLoader";
import ViewTable from './../../components/ViewTable';
import UnitConverter from '../../utils/unit.converter';
import _ from 'lodash';
import ScheduleService from '../../services/schedule.service';

class SchedulingUnitList extends Component{
     
    constructor(props){
       super(props);
       this.defaultcolumns = {
        status:"Status",
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
            scheduleunit: [],
            paths: [{
                "View": "/schedulingunit/view",
            }],
            isLoading: true,
            defaultcolumns: [this.defaultcolumns],
            optionalcolumns:  [{
                actionpath:"actionpath",
                id:"Scheduling unit ID",
                template_description: "Template Description",
                priority:"Priority",
                suSet:"Scheduling set",
                description:"Description",           
                station_group: 'Stations (CS/RS/IS)',
                task_content: 'Tasks content (O/P/I)',
                target_observation_sap: "Number of SAPs in the target observation",
                created_at:"Created_At",
                updated_at:"Updated_At"
            }],
            columnclassname: [{
                "Template":"filter-input-50",
                "Project":"filter-input-50",
                "Priority":"filter-input-50",
                "Duration (HH:mm:ss)":"filter-input-75",
                "Type": "filter-input-75",
                "Status":"filter-input-100",
                "Scheduling unit ID":"filter-input-50",
                "Stations (CS/RS/IS)":"filter-input-50",
                "Tasks content (O/P/I)":"filter-input-50",
                "Number of SAPs in the target observation":"filter-input-50"
            }],
            defaultSortColumn: [{id: "Name", desc: false}],
            // // columns: [{
            //     status:"Status",
            //     type:{
            //         name:"Type",
            //         filter:"select"
            //     },
            //     id:"Scheduling unit ID",
            //     requirements_template_id:{
            //         name: "Template ID",
            //         filter: "select"
            //     },
            //     template_description: "Template Description",
            //     priority:"Priority",
            //     project:"Project",
            //     suSet:"Scheduling set",
            //     project:"Project",
            //     name:"Name",
            //     description:"Description", 
            //     start_time:"Start Time",
            //     stop_time:"End time",
            //     duration:"Duration (HH:mm:ss)",
            //     station_group: 'Stations (CS/RS/IS)',
            //     task_content: 'Tasks content (O/P/I)',
            //     target_observation_sap: "Number of SAPs in the target observation",
            //     created_at:"Created_At",
            //     updated_at:"Updated_At"
            // }]
        }
       
        this.onRowSelection = this.onRowSelection.bind(this);
        this.reloadData = this.reloadData.bind(this);
    }

    getNumberOfTaskType(tasks = []) {
        const observation = tasks.filter(task => task.specifications_template.type_value === 'observation');
        const pipeline = tasks.filter(task => task.specifications_template.type_value === 'pipeline');
        const ingest = tasks.filter(task => task.specifications_template.type_value === 'ingest');
        return `${observation.length}/${pipeline.length}/${ingest.length}`;
    }

    /**
     * Get all stations of the SU bleprint from the observation task or subtask based on the SU status.
     * @param {Object} suBlueprint
     */
    getSUStations(suBlueprint) {
        let stations = [];
        /* Get all observation tasks */
        const observationTasks = _.filter(suBlueprint.task_blueprints, (task) => { return task.specifications_template.type_value.toLowerCase() === "observation"});
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

    async getSchedulingUnitList () {
        //Get SU Draft/Blueprints for the Project ID. This request is coming from view Project page. Otherwise it will show all SU
        let project = this.props.project;
        if(project) {
            let scheduleunits = await ScheduleService.getSchedulingListByProject(project);
            if(scheduleunits){
                this.setState({
                    scheduleunit: scheduleunits, isLoading: false
                });
            }
        }   else { 
            const suTemplate = {};
            const schedulingSet = await ScheduleService.getSchedulingSets();
            const projects = await ScheduleService.getProjectList();
            const promises = [ScheduleService.getSchedulingUnitsExtended('blueprint'), 
                                ScheduleService.getSchedulingUnitsExtended('draft'),
                                ScheduleService.getMainGroupStations()];
            Promise.all(promises).then(async responses => {
                const blueprints = responses[0];
                let scheduleunits = responses[1];
                this.mainStationGroups = responses[2];
                const output = [];
                for( const scheduleunit  of scheduleunits){
                    if (!suTemplate[scheduleunit.requirements_template_id]) {
                        const response = await ScheduleService.getSchedulingUnitTemplate(scheduleunit.requirements_template_id);
                        scheduleunit['template_description'] = response.description;
                        suTemplate[scheduleunit.requirements_template_id] = response;
                    } else {
                        scheduleunit['template_description'] = suTemplate[scheduleunit.requirements_template_id].description;
                    }
                    scheduleunit['task_content'] = this.getNumberOfTaskType(scheduleunit['task_drafts']);
                    scheduleunit['station_group'] = '0/0/0';
                    const suSet = schedulingSet.find((suSet) => { return  scheduleunit.scheduling_set_id === suSet.id });
                    const project = projects.find((project) => { return suSet.project_id === project.name});
                    const blueprintdata = blueprints.filter(i => i.draft_id === scheduleunit.id);
                    blueprintdata.map(blueP => { 
                        blueP.duration = moment.utc((blueP.duration || 0)*1000).format('HH:mm:ss');
                        blueP.type="Blueprint"; 
                        blueP['actionpath'] ='/schedulingunit/view/blueprint/'+blueP.id;
                        blueP['created_at'] = moment(blueP['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                        blueP['updated_at'] = moment(blueP['updated_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                        blueP['task_content'] = this.getNumberOfTaskType(scheduleunit['task_blueprints']);
                        blueP['template_description'] = suTemplate[blueP.requirements_template_id].description;
                        blueP['station_group'] = this.getStationGroup(blueP).counts;
                        blueP.project = project.name;
                        blueP.canSelect = false;
                        // blueP.links = ['Project'];
                        // blueP.linksURL = {
                        //     'Project': `/project/view/${project.name}`
                        // }
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
                    // scheduleunit.links = ['Project'];
                    // scheduleunit.linksURL = {
                    //     'Project': `/project/view/${project.name}`
                    // }
                    output.push(scheduleunit);
                }
               // const defaultColumns = this.defaultcolumns;
                let optionalColumns = this.state.optionalcolumns[0];
                let columnclassname = this.state.columnclassname[0];
                output.map(su => {
                    su.taskDetails = su.type==="Draft"?su.task_drafts:su.task_blueprints;
                    const targetObserv = su.taskDetails.find(task => task.specifications_template.type_value==='observation' && task.specifications_doc.SAPs);
                    const targetObservationSAPs = su.taskDetails.find(task => task.specifications_template.name==='target observation');
                    if (targetObservationSAPs.specifications_doc && targetObservationSAPs.specifications_doc.SAPs) {
                        su['target_observation_sap'] = targetObservationSAPs.specifications_doc.SAPs.length;
                    } else {
                        su['target_observation_sap'] = 0;
                    }
                    // Constructing targets in single string to make it clear display 
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
                    return su;
                });
                this.setState({
                    scheduleunit: output, isLoading: false, optionalColumns: [optionalColumns],
                    columnclassname: [columnclassname]
                });
                this.selectedRows = [];
            });
        }
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
                     //   columns = {this.state.columns}
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
