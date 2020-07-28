
import React, { Component } from 'react'
import {Link} from 'react-router-dom'
import 'primeflex/primeflex.css';
import { Chips } from 'primereact/chips';
import ViewTable from './../../components/ViewTable';
import {getScheduling_Unit_Draft_By_Id, getTasks_Draft_By_scheduling_Unit_Id} from '../../services/ScheduleService';
import Loader from 'react-loader-spinner';

class ViewSchedulingUnit extends Component{
     
    constructor(props){
        super(props)
        this.state = {
            scheduleunit: null,
			schedule_unit_task: [],
            paths: [{
                "View": "/Task",
            }],
			
        }
    }

    componentDidMount(){
	    
          this.setState({ isLoading: true });
        let schedule_id = this.props.location.state.id;
		
		if (schedule_id) {
			                
							getScheduling_Unit_Draft_By_Id(schedule_id).then(scheduleunit =>{
							getTasks_Draft_By_scheduling_Unit_Id(scheduleunit.data.id).then(tasks =>{
							this.setState({
									       
									        scheduleunit : scheduleunit.data,
											schedule_unit_task : tasks.data.results,
											isLoading:false
											
											
											
										});
										
									});
									
									
								})
								
         }
    }
	

    render(){
       const {isLoading } = this.state;
	   
	    
        

       if (this.state.schedule_unit_task.length>0) {
			
            this.state.schedule_unit_task.forEach(item =>{
				   delete item['specifications_doc']
              });
        }
        
 
        
         // Default column for Schedule Unit-Task Details
        // let defaultcolumns = [ {"id":"Task Identifier","name":"Task Name","description":"Task Description","created_at":"Created Date","updated_at":"Updated Date","requirements_template_id": "Requirement Temp"}]
        let defaultcolumns = [ {"id":"Task Identifier","name":"Task Name","description":"Task Description","created_at":"Created Date","updated_at":"Updated Date"}]

        
    
        return(
		
            <>
		
                <div className="p-grid">
                    <div className="p-col-5">
                        <h2>Scheduling Unit - Details </h2>
						
                    </div>
					
                    <div className="p-col-1">
					 
                        <Link to={{ pathname: '/Scheduling/edit', state: {id: this.state.scheduleunit?this.state.scheduleunit.id:''}}} tooltip="Edit" >
                            <i className="fa fa-edit" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                </div>
				 
    
		 { isLoading ?  <div 
      style={{
               width: "100%",
                height: "100",
                display: "flex",
               justifyContent: "center",
               alignItems: "center"
              }}
      >
      <Loader type="ThreeDots" color="#004B93" height={80} width={80} />
      </div>:this.state.scheduleunit 
			 
			
    
			 &&
			  <Loader type="ThreeDots" color="#004B93" height={80} width={80} /> &&
			<>
		            <div className="p-grid">
                        <label  className="p-col-2">Name</label>
                        <span className="p-col-4">{this.state.scheduleunit.name}</span>
                        <label  className="p-col-2">Description</label>
                        <span className="p-col-4">{this.state.scheduleunit.description}</span>
                    </div>
                    <div className="p-grid">
                        <label className="p-col-2">Created At</label>
                        <span className="p-col-4">{this.state.scheduleunit.created_at}</span>
                        <label className="p-col-2">Updated At</label>
                        <span className="p-col-4">{this.state.scheduleunit.updated_at}</span>
                    </div>
                    <div className="p-grid">
                        <label  className="p-col-2">Tags</label>
                        <Chips className="p-col-4 chips-readonly" disabled value={this.state.scheduleunit.tags}></Chips>
                        <span className="p-col-4">{this.state.scheduleunit.tags}</span>
                    </div>
                </>
			 
                }
				 
                <div   style={{marginTop: '20px'}}>
                    <h3>Tasks Details</h3>
                </div>
                {/*
                    * Call View table to show table data, the parameters are,
                    data - Pass API data
                    defaultcolumns - This colum will be populate by default in table with header mentioned
                    showaction - {true/false} -> to show the action column
                    paths - specify the path for navigation - Table will set "id" value for each row in action button
                */}
				
		        
		
				
                {isLoading ?  <div 
      style={{
               width: "100%",
                height: "100",
                display: "flex",
               justifyContent: "center",
               alignItems: "center"
              }}
      >
      <Loader type="ThreeDots" color="#004B93" height={80} width={80} />
      </div>:this.state.schedule_unit_task.length>0
				
				&&
				<ViewTable 
                     
                    data ={this.state.schedule_unit_task} 
                        defaultcolumns={defaultcolumns}
                        showaction="true"
                        paths={this.state.paths}
						
                    />
                 } 
            </>
            
        )
    }
}

export default ViewSchedulingUnit