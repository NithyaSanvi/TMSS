import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import moment from 'moment';
import AppLoader from "./../../layout/components/AppLoader";
import ViewTable from './../../components/ViewTable';
import UnitConverter from '../../utils/unit.converter';

import ScheduleService from '../../services/schedule.service';

class SchedulingUnitList extends Component{
     
    constructor(props){
       super(props);
       this.defaultcolumns = {
        type:{
            name:"Type",
            filter:"select"
        },
        name:"Name",
        description:"Description",
        project:"Project",
        created_at:{
            name:"Created At",
            filter: "date"
        },
        updated_at:{
            name:"Updated At",
            filter: "date"
        },
        requirements_template_id:{
            name: "Template",
            filter: "select"
        },
        start_time:"Start Time",
        stop_time:"End time",
        duration:"Duration (HH:mm:ss)",
        status:"Status"
        };
        if (props.hideProjectColumn) {
            delete this.defaultcolumns['project'];
        }
        this.state = {
            scheduleunit: [],
            paths: [{
                "View": "/schedulingunit/view",
            }],
            isLoading: true,
            defaultcolumns: [this.defaultcolumns],
            optionalcolumns:  [{
                actionpath:"actionpath",
            }],
            columnclassname: [{
                "Template":"filter-input-50",
                "Duration (HH:mm:ss)":"filter-input-75",
                "Type": "filter-input-75",
                "Status":"filter-input-100"
            }],
            defaultSortColumn: [{id: "Name", desc: false}],
        }
        this.onRowSelection = this.onRowSelection.bind(this);
        this.reloadData = this.reloadData.bind(this);
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
        }   else{ 
            const schedulingSet = await ScheduleService.getSchedulingSets();
            const projects = await ScheduleService.getProjectList();
            const promises = [ScheduleService.getSchedulingUnitsExtended('blueprint'), 
                                ScheduleService.getSchedulingUnitsExtended('draft')];
            Promise.all(promises).then(responses => {
                const blueprints = responses[0];
                let scheduleunits = responses[1];
                const output = [];
                for( const scheduleunit  of scheduleunits){
                    const suSet = schedulingSet.find((suSet) => { return  scheduleunit.scheduling_set_id === suSet.id });
                    const project = projects.find((project) => { return suSet.project_id === project.name});
                    const blueprintdata = blueprints.filter(i => i.draft_id === scheduleunit.id);
                    blueprintdata.map(blueP => { 
                        blueP.duration = moment.utc((blueP.duration || 0)*1000).format('HH:mm:ss');
                        blueP.type="Blueprint"; 
                        blueP['actionpath'] ='/schedulingunit/view/blueprint/'+blueP.id;
                        blueP['created_at'] = moment(blueP['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                        blueP['updated_at'] = moment(blueP['updated_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
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
                    // scheduleunit.links = ['Project'];
                    // scheduleunit.linksURL = {
                    //     'Project': `/project/view/${project.name}`
                    // }
                    output.push(scheduleunit);
                }
                const defaultColumns = this.defaultcolumns;
                let columnclassname = this.state.columnclassname[0];
                output.map(su => {
                    su.taskDetails = su.type==="Draft"?su.task_drafts:su.task_blueprints;
                    const targetObserv = su.taskDetails.find(task => task.specifications_template.type_value==='observation' && task.specifications_doc.station_groups);
                    // Constructing targets in single string to make it clear display 
                    targetObserv.specifications_doc.SAPs.map((target, index) => {
                        su[`target${index}angle1`] = UnitConverter.getAngleInput(target.digital_pointing.angle1);
                        su[`target${index}angle2`] = UnitConverter.getAngleInput(target.digital_pointing.angle2,true);
                        su[`target${index}referenceframe`] = target.digital_pointing.direction_type;
                        defaultColumns[`target${index}angle1`] = `Target ${index + 1} - Angle 1`;
                        defaultColumns[`target${index}angle2`] = `Target ${index + 1} - Angle 2`;
                        defaultColumns[`target${index}referenceframe`] = {
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
                    scheduleunit: output, isLoading: false, defaultColumns: defaultColumns,
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
