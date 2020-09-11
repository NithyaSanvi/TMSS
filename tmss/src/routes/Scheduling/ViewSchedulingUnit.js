import React, { Component } from 'react'
// import {Link} from 'react-router-dom'
import 'primeflex/primeflex.css';
import { Chips } from 'primereact/chips';

import AppLoader from "./../../layout/components/AppLoader";
import PageHeader from '../../layout/components/PageHeader';

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
                "tasktype":"Type",
                "id":"ID",
                "name":"Name",
                "description":"Description",
                "created_at":"Created at",
                "updated_at":"Updated at",
                "do_cancel":"Cancelled",
                "start_time":"Start Time",
                "stop_time":"End Time",
                "duration":"Duration (HH:mm:ss)",
            }],
            optionalcolumns:  [{
                "relative_start_time":"Relative Start Time (HH:mm:ss)",
                "relative_stop_time":"Relative End Time (HH:mm:ss)",
                "tags":"Tags",
                "blueprint_draft":"BluePrint / Task Draft link",
                "url":"URL",
                "actionpath":"actionpath",
            }],
            columnclassname: [{
                "Type":"filter-input-75",
                "ID":"filter-input-50",
                "Cancelled":"filter-input-50",
                "Duration (HH:mm:ss)":"filter-input-75",
                "Template ID":"filter-input-50",
                "BluePrint / Task Draft link": "filter-input-100",
                "Relative Start Time (HH:mm:ss)": "filter-input-75",
                "Relative End Time (HH:mm:ss)": "filter-input-75",
            }]
        }
        if (this.props.match.params.id) {
            this.state.scheduleunitId  = this.props.match.params.id;
        }
        if (this.props.match.params.type) {
            this.state.scheduleunitType = this.props.match.params.type;
        }
    }

    componentDidMount(){ 
        let schedule_id = this.state.scheduleunitId;
        let schedule_type = this.state.scheduleunitType;
        if (schedule_type && schedule_id) {
            this.getScheduleUnit(schedule_type, schedule_id)
            .then(schedulingUnit =>{
                if (schedulingUnit) {
                    this.getScheduleUnitTasks(schedule_type, schedulingUnit)
                        .then(tasks =>{
                    /* tasks.map(task => {
                            task.duration = moment.utc(task.duration*1000).format('HH:mm:ss'); 
                            task.relative_start_time = moment.utc(task.relative_start_time*1000).format('HH:mm:ss'); 
                            task.relative_stop_time = moment.utc(task.relative_stop_time*1000).format('HH:mm:ss'); 
                            return task;
                        });*/
                        this.setState({
                            scheduleunit : schedulingUnit,
                            schedule_unit_task : tasks,
                            isLoading: false,
                        });
                    });
                }   else {
                    this.setState({
                        isLoading: false,
                    });
                }
            });
		}
    }
    
    getScheduleUnitTasks(type, scheduleunit){
        if(type === 'draft')
            return ScheduleService.getTasksBySchedulingUnit(scheduleunit.id);
        else
            return ScheduleService.getTaskBlueprintsBySchedulingUnit(scheduleunit);
    }
    getScheduleUnit(type, id){
        if(type === 'draft')
            return ScheduleService.getSchedulingUnitDraftById(id)
        else
            return ScheduleService.getSchedulingUnitBlueprintById(id)
    }

    render(){
        return(
		   <>   
                {/*}  <div className="p-grid">
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
                </div> */}
                <PageHeader location={this.props.location} title={'Scheduling Unit - Details'} 
                            actions={[{icon: 'fa-edit',title:'Click to Edit Scheduling Unit View', type:'link',
                            props : { pathname: `/schedulingunit/edit/${this.props.match.params.id}` }},
                                    {icon: 'fa-window-close',title:'Click to Close Scheduling Unit View', props : { pathname: '/schedulingunit'}}]}/>
				{ this.state.isLoading ? <AppLoader/> :this.state.scheduleunit &&
			    <>
		            <div className="main-content">
                    <div className="p-grid">
                        <label  className="col-lg-2 col-md-2 col-sm-12">Name</label>
                        <span className="p-col-lg-4 col-md-4 col-sm-12">{this.state.scheduleunit.name}</span>
                        <label  className="col-lg-2 col-md-2 col-sm-12">Description</label>
                        <span className="col-lg-4 col-md-4 col-sm-12">{this.state.scheduleunit.description}</span>
                    </div>
                    <div className="p-grid">
                        <label className="col-lg-2 col-md-2 col-sm-12">Created At</label>
                        <span className="col-lg-4 col-md-4 col-sm-12">{moment(this.state.scheduleunit.created_at).format("YYYY-MMM-DD HH:mm:SS")}</span>
                        <label className="col-lg-2 col-md-2 col-sm-12">Updated At</label>
                        <span className="col-lg-4 col-md-4 col-sm-12">{moment(this.state.scheduleunit.updated_at).format("YYYY-MMM-DD HH:mm:SS")}</span>
                    </div>
                    <div className="p-grid">
                        <label className="col-lg-2 col-md-2 col-sm-12">Start Time</label>
                        <span className="col-lg-4 col-md-4 col-sm-12">{this.state.scheduleunit.start_time && moment(this.state.scheduleunit.start_time).format("YYYY-MMM-DD HH:mm:SS")}</span>
                        <label className="col-lg-2 col-md-2 col-sm-12">End Time</label>
                        <span className="col-lg-4 col-md-4 col-sm-12">{this.state.scheduleunit.stop_time && moment(this.state.scheduleunit.stop_time).format("YYYY-MMM-DD HH:mm:SS")}</span>
                    </div>
                    <div className="p-grid">
                        <label className="col-lg-2 col-md-2 col-sm-12">Template ID</label>
                        <span className="col-lg-4 col-md-4 col-sm-12">{this.state.scheduleunit.requirements_template_id}</span>
                        <label  className="col-lg-2 col-md-2 col-sm-12">Scheduling set</label>
                        <span className="col-lg-4 col-md-4 col-sm-12">{this.state.scheduleunit.scheduling_set_object.name}</span>
                    </div>
                    <div className="p-grid">
                        <label className="col-lg-2 col-md-2 col-sm-12">Duration (HH:mm:ss)</label>
                        <span className="col-lg-4 col-md-4 col-sm-12">{moment.utc(this.state.scheduleunit.duration*1000).format('HH:mm:ss')}</span>
                        <label  className="col-lg-2 col-md-2 col-sm-12">Tags</label>
                        <Chips className="p-col-4 chips-readonly" disabled value={this.state.scheduleunit.tags}></Chips>
                    </div>
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
                        defaultSortColumn={this.state.defaultSortColumn}
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