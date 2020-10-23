import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import moment from 'moment';
import AppLoader from "./../../layout/components/AppLoader";
import ViewTable from './../../components/ViewTable';

import ScheduleService from '../../services/schedule.service';

class SchedulingUnitList extends Component{
     
    constructor(props){
        super(props)
        this.state = {
            scheduleunit: [],
            paths: [{
                "View": "/schedulingunit/view",
            }],
            isLoading: true,
            defaultcolumns: [ {
                type:{
                    name:"Type",
                    filter:"select"
                },
                name:"Name",
                description:"Description",
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
                }],
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
    }

    async getSchedulingUnitList () {
        //Get SU Draft/Blueprints for the Project ID. This request is coming from view Project page. Otherwise it will show all SU
        let project = this.props.project;
        if(project){
            let scheduleunits = await ScheduleService.getSchedulingListByProject(project);
            if(scheduleunits){
                this.setState({
                    scheduleunit: scheduleunits, isLoading: false
                });
            }
        }else{
            const bluePrint = await ScheduleService.getSchedulingUnitBlueprint();
            ScheduleService.getSchedulingUnitDraft().then(scheduleunit =>{
                const output = [];
                var scheduleunits = scheduleunit.data.results;
                for( const scheduleunit  of scheduleunits){
                    const blueprintdata = bluePrint.data.results.filter(i => i.draft_id === scheduleunit.id);
                    blueprintdata.map(blueP => { 
                        blueP.duration = moment.utc((blueP.duration || 0)*1000).format('HH:mm:ss'); 
                        blueP.type="Blueprint"; 
                        blueP['actionpath'] ='/schedulingunit/view/blueprint/'+blueP.id;
                        blueP['created_at'] = moment(blueP['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                        blueP['updated_at'] = moment(blueP['updated_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                        return blueP; 
                    });
                    output.push(...blueprintdata);
                    scheduleunit['actionpath']='/schedulingunit/view/draft/'+scheduleunit.id;
                    scheduleunit['type'] = 'Draft';
                    scheduleunit['duration'] = moment.utc((scheduleunit.duration || 0)*1000).format('HH:mm:ss');
                    scheduleunit['created_at'] = moment(scheduleunit['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                    scheduleunit['updated_at'] = moment(scheduleunit['updated_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                    output.push(scheduleunit);
                }
                this.setState({
                    scheduleunit: output, isLoading: false
                });
            })
        }
    }
    
    componentDidMount(){ 
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
                    />
                    :<div>No scheduling unit found </div>
                 }  
            </>
        )
    }
}

export default SchedulingUnitList
