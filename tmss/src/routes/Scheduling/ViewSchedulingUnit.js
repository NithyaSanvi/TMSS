import React, { Component } from 'react'
// import {Link} from 'react-router-dom'
import 'primeflex/primeflex.css';
import { Chips } from 'primereact/chips';

import AppLoader from "./../../layout/components/AppLoader";
import PageHeader from '../../layout/components/PageHeader';

import ViewTable from './../../components/ViewTable';
import ScheduleService from '../../services/schedule.service';
import moment from 'moment';
import _ from 'lodash';
import SchedulingConstraint from './Scheduling.Constraints';
import { Dialog } from 'primereact/dialog';
import TaskStatusLogs from '../Task/state_logs';
import Stations from './Stations';

class ViewSchedulingUnit extends Component{
    constructor(props){
        super(props)
        this.state = {
            scheduleunit: null,
            schedule_unit_task: [],
            isLoading: true,
            showStatusLogs: false,
            paths: [{
                "View": "/task",
            }],
           missingStationFieldsErrors: [],
            defaultcolumns: [ {
                status_logs: "Status Logs",
                tasktype:{
                    name:"Type",
                    filter:"select"
                },
                subTakskID: 'Sub Taksk ID',
                id: "ID",
                name:"Name",
                description:"Description",
                created_at:{
                    name: "Created at",
                    filter: "date"
                },
                updated_at:{
                    name: "Updated at",
                    filter: "date"
                },
                do_cancel:{
                    name: "Cancelled",
                    filter: "switch"
                },
                start_time:"Start Time",
                stop_time:"End Time",
                duration:"Duration (HH:mm:ss)",
                status:"Status"
            }],
            optionalcolumns:  [{
                relative_start_time:"Relative Start Time (HH:mm:ss)",
                relative_stop_time:"Relative End Time (HH:mm:ss)",
                tags:"Tags",
                blueprint_draft:"BluePrint / Task Draft link",
                url:"URL",
                actionpath:"actionpath"
            }],
            columnclassname: [{
                "Status Logs": "filter-input-0",
                "Type":"filter-input-75",
                "ID":"filter-input-50",
                "Cancelled":"filter-input-50",
                "Duration (HH:mm:ss)":"filter-input-75",
                "Template ID":"filter-input-50",
                "BluePrint / Task Draft link": "filter-input-100",
                "Relative Start Time (HH:mm:ss)": "filter-input-75",
                "Relative End Time (HH:mm:ss)": "filter-input-75",
                "Status":"filter-input-100"
            }],
            stationGroup: []
        }
        this.actions = [
            {icon: 'fa-window-close',title:'Click to Close Scheduling Unit View', link: this.props.history.goBack} 
        ];
        this.stations = [];
        this.constraintTemplates = [];
        if (this.props.match.params.type === 'draft') {
            this.actions.unshift({icon: 'fa-edit', title: 'Click to edit',  props : { pathname:`/schedulingunit/edit/${ this.props.match.params.id}`}
            });
        } else {
            this.actions.unshift({icon: 'fa-sitemap',title :'View Workflow',props :{pathname:`/schedulingunit/${this.props.match.params.id}/workflow`}});
            this.actions.unshift({icon: 'fa-lock', title: 'Cannot edit blueprint'});
        }
        if (this.props.match.params.id) {
            this.state.scheduleunitId  = this.props.match.params.id;
        }
        if (this.props.match.params.type) {
            this.state.scheduleunitType = this.props.match.params.type;
        }
       }

    async componentDidMount(){ 
        let schedule_id = this.state.scheduleunitId;
        let schedule_type = this.state.scheduleunitType;
        if (schedule_type && schedule_id) {
            const subtaskComponent = (task)=> {
                return (
                    <button className="p-link" onClick={(e) => {this.setState({showStatusLogs: true, task: task})}}>
                        <i className="fa fa-history"></i>
                    </button>
                );
            };
            this.stations = await ScheduleService.getStationGroup();
            this.setState({stationOptions: this.stations});
            this.getScheduleUnit(schedule_type, schedule_id)
            .then(schedulingUnit =>{
                if (schedulingUnit) {
                    ScheduleService.getSchedulingConstraintTemplates().then((response) => {
                        this.constraintTemplates = response;
                        this.setState({ constraintSchema:  this.constraintTemplates.find(i => i.id === schedulingUnit.scheduling_constraints_template_id) })
                    });
                    this.getScheduleUnitTasks(schedule_type, schedulingUnit)
                        .then(tasks =>{
                        tasks.map(task => {
                            task.status_logs = task.tasktype === "Blueprint"?subtaskComponent(task):"";
                            const subTaskIds = task.subTasks.filter(sTask => sTask.subTaskTemplate.name.indexOf('control') > 1);
                            task.subTakskID = subTaskIds.length ? subTaskIds[0].id : ''; 
                            return task;
                        });
                        const targetObservation = _.find(tasks, (task)=> {return task.template.type_value==='observation' && task.tasktype.toLowerCase()===schedule_type && task.specifications_doc.station_groups});
                        this.setState({
                            scheduleunit : schedulingUnit,
                            schedule_unit_task : tasks,
                            isLoading: false,
                            stationGroup: targetObservation?targetObservation.specifications_doc.station_groups:[]
                    }, this.getAllStations);
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
            return ScheduleService.getTasksBySchedulingUnit(scheduleunit.id, true);
        else
            return ScheduleService.getTaskSubTaskBlueprintsBySchedulingUnit(scheduleunit);
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
                </div> */
                /*TMSS-363 Blueprint icon changes */}
                <PageHeader location={this.props.location} title={'Scheduling Unit - Details'} 
                            actions={this.actions}/>
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
                            <label className="col-lg-2 col-md-2 col-sm-12" >Duration (HH:mm:ss)</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{moment.utc((this.state.scheduleunit.duration?this.state.scheduleunit.duration:0)*1000).format('HH:mm:ss')}</span>
                            {this.props.match.params.type === 'blueprint' &&
                            <label className="col-lg-2 col-md-2 col-sm-12 ">Status</label> }
                             {this.props.match.params.type === 'blueprint' &&
                            <span className="col-lg-2 col-md-2 col-sm-12">{this.state.scheduleunit.status}</span>}
                         </div>
                     <div className="p-grid">
                        <label  className="col-lg-2 col-md-2 col-sm-12">Tags</label>
                        <Chips className="p-col-4 chips-readonly" disabled value={this.state.scheduleunit.tags}></Chips>
                        </div>
                    </div>
                </>
			    }
               
                 {<Stations
                    stationGroup={this.state.stationGroup}
                    targetObservation={this.state.targetObservation}
                    view
                />}

                {this.state.scheduleunit && this.state.scheduleunit.scheduling_constraints_doc && <SchedulingConstraint disable constraintTemplate={this.state.constraintSchema} initValue={this.state.scheduleunit.scheduling_constraints_doc} />}
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
                        tablename="scheduleunit_task_list"
                    />
                 }
                 {this.state.showStatusLogs &&
                    <Dialog header={`Status change logs - ${this.state.task?this.state.task.name:""}`} 
                            visible={this.state.showStatusLogs} maximizable maximized={false} position="left" style={{ width: '50vw' }} 
                            onHide={() => {this.setState({showStatusLogs: false})}}>
                            <TaskStatusLogs taskId={this.state.task.id}></TaskStatusLogs>
                    </Dialog>
                 }
            </>
        )
    }
}

export default ViewSchedulingUnit
