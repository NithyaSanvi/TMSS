import React, { Component } from 'react'
import {Link} from 'react-router-dom'
import 'primeflex/primeflex.css';
import { Chips } from 'primereact/chips';

import AppLoader from "./../../layout/components/AppLoader";

import ViewTable from './../../components/ViewTable';
import ScheduleService from '../../services/schedule.service';
import moment from 'moment';

class ViewSchedulingUnit extends Component{
    constructor(props){
        super(props)
        this.state = {
            scheduleunit: null,
            schedule_unit_task: [],
            isLoading: true,
            paths: [{
                "View": "/task",
            }],

            defaultcolumns: [ {
                "tasktype":"Task Type",
                "id":"ID",
                "name":"Name",
                "description":"Description",
                "created_at":"Created at",
                "updated_at":"Updated at",
                "do_cancel":"Cancelled",
                "start_time":"Start Time",
                "stop_time":"End Time",
                "duration":"Duration",
            }],
            optionalcolumns:  [{
                "relative_start_time":"Relative Start Time",
                "relative_stop_time":"Relative End Time",
                "tags":"Tags",
                "blueprint_draft":"BluePrint / Task Draft link",
                "url":"URL",
                "actionpath":"actionpath",
            }],

            columnclassname: [{
                "Task Type":"filter-input-100",
                "ID":"filter-input-50",
                "Cancelled":"filter-input-50",
                "Duration":"filter-input-50",
                "Template ID":"filter-input-50",
                "BluePrint / Task Draft link":"filter-input-100",
            }]
        }
    }

    componentDidMount(){ 
        let schedule_id = this.props.location.state.id
        if (schedule_id) {
            ScheduleService.getSchedulingUnitDraftById(schedule_id)
            .then(scheduleunit =>{
                ScheduleService.getScheduleTasksBySchedulingUnitId(scheduleunit.data.id)
                .then(tasks =>{
                    this.setState({
                        scheduleunit : scheduleunit.data,
                        schedule_unit_task : tasks,
                        isLoading: false
                    });
				});
			})
		}
    }
	
    render(){
        return(
		   <>   
                <div className="p-grid">
                <div className="p-col-10">
                  <h2>Scheduling Unit - Details </h2>
			    </div>
				<div className="p-col-2">
                    <Link to={{ pathname: '/schedulingunit'}} title="Close" 
                                style={{float:'right'}}>
                        <i className="fa fa-times" style={{marginTop: "10px", marginLeft: '5px'}}></i>
                    </Link>
                    <Link to={{ pathname: '/schedulingunit/edit', state: {id: this.state.scheduleunit?this.state.scheduleunit.id:''}}} title="Edit" 
                            style={{float:'right'}}>
                    <i className="fa fa-edit" style={{marginTop: "10px"}}></i>
                    </Link>
                </div>
                </div>
				{ this.state.isLoading ? <AppLoader/> :this.state.scheduleunit &&
			    <>
		            <div className="p-grid">
                        <label  className="p-col-2">Name</label>
                        <span className="p-col-4">{this.state.scheduleunit.name}</span>
                        <label  className="p-col-2">Description</label>
                        <span className="p-col-4">{this.state.scheduleunit.description}</span>
                    </div>
                    <div className="p-grid">
                        <label className="p-col-2">Created At</label>
                        <span className="p-col-4">{moment(this.state.scheduleunit.created_at).format("YYYY-MMM-DD HH:mm:SS")}</span>
                        <label className="p-col-2">Updated At</label>
                        <span className="p-col-4">{moment(this.state.scheduleunit.updated_at).format("YYYY-MMM-DD HH:mm:SS")}</span>
                    </div>
                    <div className="p-grid">
                        <label className="p-col-2">Start Time</label>
                        <span className="p-col-4">{this.state.scheduleunit.start_time && moment(this.state.scheduleunit.start_time).format("YYYY-MMM-DD HH:mm:SS")}</span>
                        <label className="p-col-2">End Time</label>
                        <span className="p-col-4">{this.state.scheduleunit.stop_time && moment(this.state.scheduleunit.stop_time).format("YYYY-MMM-DD HH:mm:SS")}</span>
                    </div>
                    <div className="p-grid">
                        <label className="p-col-2">Template ID</label>
                        <span className="p-col-4">{this.state.scheduleunit.requirements_template_id}</span>
                        <label  className="p-col-2">Scheduling set</label>
                        <span className="p-col-4">{this.state.scheduleunit.scheduling_set_id}</span>
                    </div>
                    <div className="p-grid">
                        <label className="p-col-2">Duration</label>
                        <span className="p-col-4">{this.state.scheduleunit.duration}</span>
                        <label  className="p-col-2">Tags</label>
                        <Chips className="p-col-4 chips-readonly" disabled value={this.state.scheduleunit.tags}></Chips>
                        <span className="p-col-4">{this.state.scheduleunit.tags}</span>
                    </div>
                </>
			 
                }
                <div>
                    <h3>Tasks Details</h3>
                </div>
                {/*
                    * Call View table to show table data, the parameters are,
                     data - Pass API data
                    defaultcolumns - These columns will be populate by default in table with header mentioned
                    optionalcolumns - These columns will not appear in the table by default, but user can toggle the columns using toggle menu
                    showaction - {true/false} -> to show the action column
                    keyaccessor - This is id column for Action item
                    paths - specify the path for navigation - Table will set "id" value for each row in action button
                    
                */}
                {this.state.isLoading ? <AppLoader/> :this.state.schedule_unit_task.length>0 &&
                    <ViewTable 
                        data={this.state.schedule_unit_task} 
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

export default ViewSchedulingUnit