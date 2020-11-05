import React, { Component } from 'react'
// import {Link} from 'react-router-dom'
import _ from 'lodash';
import 'primeflex/primeflex.css';
import { Chips } from 'primereact/chips';
import { Button } from 'primereact/button';
import {InputText} from 'primereact/inputtext';
import {MultiSelect} from 'primereact/multiselect';
import { OverlayPanel } from 'primereact/overlaypanel';
import AppLoader from "./../../layout/components/AppLoader";
import PageHeader from '../../layout/components/PageHeader';

import ViewTable from './../../components/ViewTable';
import ScheduleService from '../../services/schedule.service';
import moment from 'moment';
import SchedulingConstraint from './Scheduling.Constraints';
import { Dialog } from 'primereact/dialog';
import TaskStatusLogs from '../Task/state_logs';

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
            Custom: {
                stations: []
            },
            selectedStations: [],
            stationOptions: [],
            customStations: [],
            customSelectedStations: [],
            stations: [],
            noOfMissingFields: {},
            missingFieldsErrors: [],
            defaultcolumns: [ {
                status_logs: "Status Logs",
                tasktype:{
                    name:"Type",
                    filter:"select"
                },
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
            }]
        }
        this.actions = [
            {icon: 'fa-window-close',title:'Click to Close Scheduling Unit View', link: this.props.history.goBack} 
        ];
        this.stations = []
        this.constraintTemplates = [];
        if (this.props.match.params.type === 'draft') {
            this.actions.unshift({icon: 'fa-edit', title: 'Click to edit',  props : { pathname:`/schedulingunit/edit/${ this.props.match.params.id}`}
            });
        } else {
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
                            return task;
                        });
                        const targetObservation = tasks.find(task => task.name === 'Target Observation');
                        this.setState({
                            scheduleunit : schedulingUnit,
                            schedule_unit_task : tasks,
                            isLoading: false,
                            targetObservation
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

    getAllStations() {
        const promises = [];

        this.stations.forEach(st => {
            promises.push(ScheduleService.getStations(st.value))
        });
        Promise.all(promises).then(responses => {
            responses.forEach((response, index) => {
                this.getStations(this.stations[index].value, response);
            });
            this.stations.push({
                value: 'Custom'
            });
            this.getStations('Custom');
        });
    }

    getStations(e, response) {
        let selectedStations;
        if (e === 'Custom') {
            selectedStations = [...this.state.selectedStations, e];
            if (!selectedStations.includes('Custom')) {
                selectedStations = ['Custom', ...selectedStations];
            }
            this.getStationGroup(selectedStations); 
            return;
        }
        const stationGroups = this.state.targetObservation.specifications_doc.station_groups; 
        const missingFields = stationGroups.find(i => {
            if (i.stations.length === response.stations.length && i.stations[0] === response.stations[0]) {
                i.stationType = e;
                return true;
            }
            return false;
        });
        if (missingFields) {
            selectedStations = [...this.state.selectedStations, e];
            this.getStationGroup(selectedStations);
        }
        this.setState({
            [e]: {
                stations: response.stations,
                missingFields: missingFields ? missingFields.max_nr_missing : ''
            },
            ['Custom']: {
                stations: [...this.state['Custom'].stations, ...response.stations], 
            },
            customStations: [...this.state.customStations, ...response.stations],
        });
    }

    async showStations(e, key) {
        this.op.toggle(e);
        this.setState({
            stations: (this.state[key] && this.state[key].stations ) || [],
        });
    }

    async getStationGroup(e) {
        if (e.includes('Custom') && !this.state.selectedStations.includes('Custom')) {
            const stationGroups = this.state.targetObservation.specifications_doc.station_groups; 
            const custom = stationGroups.find(i => !i.stationType); 
            this.setState({
                customSelectedStations: custom.stations,
                ['Custom']: {
                    missingFields: custom.max_nr_missing,
                    ...this.state['Custom']
                }
            });
        }
        this.setState({selectedStations: e});
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
                <div className="p-field p-grid grouping p-fluid">
                    <fieldset>
                        <legend>
                            <label>Stations:<span style={{color:'red'}}>*</span></label>
                        </legend>
                        <div className="col-lg-3 col-md-3 col-sm-12" data-testid="stations">
                            <MultiSelect data-testid="stations" id="stations" optionLabel="value" optionValue="value" filter={true}
                                tooltip="Select Stations" tooltipOptions={this.tooltipOptions}
                                value={this.state.selectedStations} 
                                options={this.state.stationOptions} 
                                placeholder="Select Stations"
                                disabled
                                onChange={(e) => this.getStationGroup(e.value)}
                            />
                        </div>
                        {this.state.selectedStations.length ? <div className="col-sm-12 selected_stations" data-testid="selected_stations">
                            <label>Selected Stations:</label>
                            <div className="col-sm-12 p-0 d-flex flex-wrap">
                                {this.state.selectedStations.map(i => {
                                    return i !== 'Custom' ? (
                                        <div className="p-field p-grid col-md-6" key={i}>
                                            <label className="col-sm-6 text-caps">
                                                {i}
                                                <Button icon="pi pi-info-circle" className="p-button-rounded p-button-secondary p-button-text info" onClick={(e) => this.showStations(e, i)} />
                                            </label>
                                            <div className="col-sm-6">
                                                <InputText id="schedUnitName" data-testid="name" 
                                                    className={(this.state[i] && this.state[i].error) ?'input-error':''}
                                                    tooltip="No. of Missing Stations" tooltipOptions={this.tooltipOptions} maxLength="128"
                                                    placeholder="No. of Missing Stations"
                                                    ref={input => {this.nameInput = input;}}
                                                    disabled
                                                    value={this.state[i] && this.state[i].missingFields ? this.state[i].missingFields : ''}
                                                    onChange={(e) => this.setNoOfMissingFields(i, e.target.value)}/>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-field p-grid col-md-12" key={i}>
                                            <div className="col-md-6 p-field p-grid">
                                                <label className="col-sm-6 text-caps custom-label">
                                                    {i}
                                                </label>
                                                <div className="col-sm-6 pr-8 custom-value">
                                                    <MultiSelect data-testid="stations" id="stations"  filter={true}
                                                        tooltip="Select Stations" tooltipOptions={this.tooltipOptions}
                                                        value={this.state.customSelectedStations} 
                                                        options={this.state.customStations} 
                                                        placeholder="Select Stations"
                                                        disabled
                                                        onChange={(e) => this.setState({customSelectedStations: e.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-sm-6 custom-field">
                                                <InputText id="schedUnitName" data-testid="name" 
                                                    className={(this.state[i] && this.state[i].error) ?'input-error':''}
                                                    tooltip="No. of Missing Stations" tooltipOptions={this.tooltipOptions} maxLength="128"
                                                    placeholder="No. of Missing Stations"
                                                    value={this.state[i] && this.state[i].missingFields ? this.state[i].missingFields : ''}
                                                    ref={input => {this.nameInput = input;}}
                                                    disabled
                                                    onChange={(e) => this.setNoOfMissingFields(i, e.target.value)}/>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            
                        </div> : null}
                        <OverlayPanel ref={(el) => this.op = el} dismissable  style={{width: '450px'}}>
                            <div className="station-container">
                                {this.state.fetchingStations && <span>Loading...</span>}
                                {this.state.stations.map(i => (
                                    <label>{i}</label>
                                ))}
                            </div>
                        </OverlayPanel>
                    </fieldset>
                </div>
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
