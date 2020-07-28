import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import ViewTable from './../../components/ViewTable';
import {getScheduling_Unit_Draft} from '../../services/ScheduleService';
import Loader from 'react-loader-spinner';

class SchedulingUnitList extends Component{
     
    constructor(props){
        super(props)
        this.state = {
            scheduleunit: [],
            paths: [{
                "View": "/Scheduling/View",
            }],
            isLoading: false,
        }
    }

    componentDidMount(){ 
        this.setState({ isLoading: true });
        getScheduling_Unit_Draft().then(scheduleunit =>{
            this.setState({
                scheduleunit : scheduleunit.data || [] ,isLoading: false
            });
        })
    }

    render(){
        const {isLoading } = this.state;
        if (isLoading) {
      return <div 
      style={{
               width: "100%",
                height: "100",
                display: "flex",
               justifyContent: "center",
               alignItems: "center"
              }}
      >
      <Loader type="ThreeDots" color="#004B93" height={80} width={80} />
      </div>
    }
         
        if(this.state.scheduleunit.results){
            this.state.scheduleunit.results.forEach(item =>{
                delete item['requirements_doc']
            })
        }
        // The default table column value and header to show in UI
        // let defaultcolumns = [ {"name":"Name","description":"Description","created_at":"Created Date","updated_at":"Updated Date","requirements_template_id": "Requirement Temp","scheduling_set_id":" Scheduling Unit"}]
        let defaultcolumns = [ {"name":"Name","description":"Description","created_at":"Created Date","updated_at":"Updated Date","requirements_template_id": "Template"}]
        return(
            <>
            
                {
                
                /*
                    * Call View table to show table data, the parameters are,
                    data - Pass API data
                    defaultcolumns - This colum will be populate by default in table with header mentioned
                    showaction - {true/false} -> to show the action column
                    paths - specify the path for navigation - Table will set "id" value for each row in action button
                */}
                {this.state.scheduleunit.results &&
                    <ViewTable 
                        data={this.state.scheduleunit.results} 
                        defaultcolumns={defaultcolumns} 
                        showaction="true"
                        paths={this.state.paths}
                    />
                 }  
            </>
        )
    }
}

export default SchedulingUnitList