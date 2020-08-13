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
                "name":"Name",
                "description":"Description",
                "created_at":"Created Date",
                "updated_at":"Updated Date",
                "requirements_template_id": "Template",
                "start_time":"Start Time",
                "stop_time":"End time",
                "duration":"Duration (H:mm:ss)"
                }],
            optionalcolumns:  [{
                "actionpath":"actionpath",
            }],
            columnclassname: [{
                "Template":"filter-input-50",
                "Duration":"filter-input-50",
            }]
        }
    }

    async getSchedulingUnitList () {
        const bluePrint = await ScheduleService.getSchedulingUnitBlueprint();
        ScheduleService.getSchedulingUnitDraft().then(scheduleunit =>{
            var scheduleunits = scheduleunit.data.results;
            for( const scheduleunit  of scheduleunits){
                const blueprintdata = bluePrint.data.results.find(i => i.draft_id === scheduleunit.id);
                scheduleunit['actionpath']='/schedulingunit/view';
                scheduleunit['start_time'] = blueprintdata.start_time;
                scheduleunit['stop_time'] = blueprintdata.stop_time;
                scheduleunit['duration'] = moment(scheduleunit.duration).format('H:mm:ss');
            }
            this.setState({
                scheduleunit : scheduleunit.data ,isLoading:false
            });
        })
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
                {this.state.scheduleunit.results &&
                    <ViewTable 
                        data={this.state.scheduleunit.results} 
                        defaultcolumns={this.state.defaultcolumns} 
                        optionalcolumns={this.state.optionalcolumns}
                        columnclassname={this.state.columnclassname}
                        showaction="true"
                        keyaccessor="id"
                        paths={this.state.paths}
                        unittest={this.state.unittest}
                    />
                 }  
            </>
        )
    }
}

export default SchedulingUnitList