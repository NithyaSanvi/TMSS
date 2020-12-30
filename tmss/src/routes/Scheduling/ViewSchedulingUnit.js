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
import { Redirect } from 'react-router-dom';
import { CustomDialog } from '../../layout/components/CustomDialog';
import { CustomPageSpinner } from '../../components/CustomPageSpinner';
import { Growl } from 'primereact/components/growl/Growl';
import InjestRelationModal from './InjestRelationModal';

class ViewSchedulingUnit extends Component{
    constructor(props){
        super(props)
        this.state = {
            scheduleunit: null,
            schedule_unit_task: [],
            isLoading: true,
            showStatusLogs: false,
            showProducerDialog: false,
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
                id: "ID",
                subTaskID: 'Control ID',
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
                "Control ID":"filter-input-75",
                "Cancelled":"filter-input-50",
                "Duration (HH:mm:ss)":"filter-input-75",
                "Template ID":"filter-input-50",
                "BluePrint / Task Draft link": "filter-input-100",
                "Relative Start Time (HH:mm:ss)": "filter-input-75",
                "Relative End Time (HH:mm:ss)": "filter-input-75",
                "Status":"filter-input-100"
            }],
            stationGroup: [],
            dialog: {header: 'Confirm', detail: 'Do you want to create a Scheduling Unit Blueprint?'},
            dialogVisible: false
        }
        this.actions = [];
        this.stations = [];
        this.constraintTemplates = [];
        this.checkAndCreateBlueprint = this.checkAndCreateBlueprint.bind(this);
        this.createBlueprintTree = this.createBlueprintTree.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
        this.showProducerDialog = this.showProducerDialog.bind(this);
        
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.scheduleunit && this.props.match.params &&
            (this.state.scheduleunitId !== this.props.match.params.id ||
            this.state.scheduleunitType !== this.props.match.params.type)) {
            this.getSchedulingUnitDetails(this.props.match.params.type, this.props.match.params.id);
       }
    }

    showProducerDialog() {
        this.setState({ showProducerDialog: !this.state.showProducerDialog});
    }

    async componentDidMount(){ 
        let schedule_id = this.props.match.params.id;
        let schedule_type = this.props.match.params.type;
        if (schedule_type && schedule_id) {
            this.stations = await ScheduleService.getStationGroup();
            this.setState({stationOptions: this.stations});
            this.getSchedulingUnitDetails(schedule_type, schedule_id);
		}
    }

    subtaskComponent = (task)=> {
        return (
            <button className="p-link" onClick={(e) => {this.setState({showStatusLogs: true, task: task})}}>
                <i className="fa fa-history"></i>
            </button>
        );
    };
    
    getSchedulingUnitDetails(schedule_type, schedule_id) {
        this.getScheduleUnit(schedule_type, schedule_id)
            .then(schedulingUnit =>{
                if (schedulingUnit) {
                    ScheduleService.getSchedulingConstraintTemplates().then((response) => {
                        this.constraintTemplates = response;
                        this.setState({ constraintSchema:  this.constraintTemplates.find(i => i.id === schedulingUnit.scheduling_constraints_template_id) })
                    });
                    this.getScheduleUnitTasks(schedule_type, schedulingUnit)
                        .then(tasks =>{
                        const producers = tasks.filter(task => task.producerDetails).map(producer => producer.producerDetails.name);
                        tasks.map(task => {
                            task.status_logs = task.tasktype === "Blueprint"?this.subtaskComponent(task):"";
                            //Displaying SubTask ID of the 'control' Task
                            const subTaskIds = task.subTasks?task.subTasks.filter(sTask => sTask.subTaskTemplate.name.indexOf('control') > 1):[];
                            task.subTaskID = subTaskIds.length ? subTaskIds[0].id : ''; 
                            return task;
                        });
                        const targetObservation = _.find(tasks, (task)=> {return task.template.type_value==='observation' && task.tasktype.toLowerCase()===schedule_type && task.specifications_doc.station_groups});
                        this.setState({
                            scheduleunitId: schedule_id,
                            scheduleunit : schedulingUnit,
                            scheduleunitType: schedule_type,
                            schedule_unit_task : tasks,
                            isLoading: false,
                            stationGroup: targetObservation?targetObservation.specifications_doc.station_groups:[],
                            redirect: null,
                            dialogVisible: false,
                            producers,
                            isContainsAllPipeLine: producers.includes('Pipeline 1') && producers.includes('Pipeline 1') && producers.includes('Pipeline target1') && producers.includes('Pipeline target2'),
                            isContainsAllObservation: producers.includes('Calibrator Observation 1') && producers.includes('Calibrator Observation 2') && producers.includes('Target Observation')
                    }, this.getAllStations);
                    });
                }   else {
                    this.setState({
                        isLoading: false,
                    });
                }
            });
            this.actions = [
                {icon: 'fa-window-close',title:'Click to Close Scheduling Unit View', link: this.props.history.goBack} 
            ];
            if (this.props.match.params.type === 'draft') {
                this.actions.unshift({icon: 'fa-edit', title: 'Click to edit',  props : { pathname:`/schedulingunit/edit/${ this.props.match.params.id}`}
                });
                this.actions.unshift({icon:'fa-stamp', title: 'Create Blueprint', type:'button',
                    actOn:'click', props : { callback: this.checkAndCreateBlueprint},
               });
            } else {
                this.actions.unshift({icon: 'fa-sitemap',title :'View Workflow',props :{pathname:`/schedulingunit/${this.props.match.params.id}/workflow`}});
                this.actions.unshift({icon: 'fa-lock', title: 'Cannot edit blueprint'});
            }
            this.actions.unshift({icon:'fa-stamp', title: 'Producer Details', type:'button',
                actOn:'click', props : { callback: this.showProducerDialog}});
    }

    getScheduleUnitTasks(type, scheduleunit){
        if(type === 'draft')
            return ScheduleService.getTasksBySchedulingUnit(scheduleunit.id, true, true, true);
        else
        return ScheduleService.getTaskBPWithSubtaskTemplateOfSU(scheduleunit);
    }
    
    getScheduleUnit(type, id){
        if(type === 'draft')
            return ScheduleService.getSchedulingUnitDraftById(id)
        else
            return ScheduleService.getSchedulingUnitBlueprintById(id)
    }

    /**
     * Checks if the draft scheduling unit has existing blueprints and alerts. If confirms to create, creates blueprint.
     */
    checkAndCreateBlueprint() {
        if (this.state.scheduleunit) {
            let dialog = this.state.dialog;
            if (this.state.scheduleunit.scheduling_unit_blueprints.length>0) {
                dialog.detail = "Blueprint(s) already exist for this Scheduling Unit. Do you want to create another one?";
            }
            dialog.actions = [{id: 'yes', title: 'Yes', callback: this.createBlueprintTree},
                                {id: 'no', title: 'No', callback: this.closeDialog}];
            this.setState({dialogVisible: true, dialog: dialog});
        }
    }

    /**
     * Funtion called to create blueprint on confirmation.
     */
    createBlueprintTree() {
        this.setState({dialogVisible: false, showSpinner: true});
        ScheduleService.createSchedulingUnitBlueprintTree(this.state.scheduleunit.id)
            .then(blueprint => {
                this.growl.show({severity: 'success', summary: 'Success', detail: 'Blueprint created successfully!'});
                this.setState({showSpinner: false, redirect: `/schedulingunit/view/blueprint/${blueprint.id}`, isLoading: true});
            });
    }

    /**
     * Callback function to close the dialog prompted.
     */
    closeDialog() {
        this.setState({dialogVisible: false});
    }

    render(){
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        return(
		   <>   
                <Growl ref={(el) => this.growl = el} />
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
                {/* Dialog component to show messages and get confirmation */}
                <CustomDialog type="confirmation" visible={this.state.dialogVisible}
                        header={this.state.dialog.header} message={this.state.dialog.detail} actions={this.state.dialog.actions}
                        onClose={this.closeDialog} onCancel={this.closeDialog} onSubmit={this.createBlueprintTree}></CustomDialog>
                {/* Show spinner during backend API call */}
                <CustomPageSpinner visible={this.state.showSpinner} />

                {this.state.showProducerDialog && (
                    <InjestRelationModal
                        isContainsAllObservation={this.stateisContainsAllObservation}
                        showProducerDialog={this.state.showProducerDialog}
                        toggle={this.showProducerDialog}
                        producers={this.state.producers}
                        isContainsAllPipeLine={this.state.isContainsAllPipeLine}
                    />
                )}
            </>
        )
    }
}

export default ViewSchedulingUnit
