import React, {Component} from 'react';
import {Redirect} from 'react-router-dom'
import moment from 'moment';
import _ from 'lodash';
import TaskService from '../../services/task.service';
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import ViewTable from '../../components/ViewTable';
import UIConstants from '../../utils/ui.constants';
import TaskStatusLogs from './state_logs';
import { Dialog } from 'primereact/dialog';

export class TaskList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            tasks: [],
            paths: [{
                "View": "/task",
            }],
            columnOrders: [
                "Status Logs",
                 "Status",
                 "Type",
                 "Scheduling Unit ID",
                 "Scheduling Unit Name",
                 "ID",
                 "Control ID",
                 "Name",
                 "Description",
                 "Start Time",
                 "End Time",
                 "Duration (HH:mm:ss)",
                 "Relative Start Time (HH:mm:ss)",
                 "Relative End Time (HH:mm:ss)",
                 "#Dataproducts",
                 "size",
                 "dataSizeOnDisk",
                 "subtaskContent",
                 "tags",
                 "blueprint_draft",
                 "url",
                 "Cancelled",
                 "Created at",
                 "Updated at"
             ],
            defaultcolumns: [ {
                status_logs: "Status Logs",
                status:{
                    name:"Status",
                    filter: "select"
                },
                tasktype:{
                    name:"Type",
                    filter:"select"
                },
                schedulingUnitId: "Scheduling Unit ID",
                schedulingUnitName: "Scheduling Unit Name",
                id: "ID",
                subTaskID: 'Control ID',
                name:"Name",
                description:"Description",
                start_time:{
                    name:"Start Time",
                    filter: "date"
                },
                stop_time:{
                    name:"End Time",
                    filter: "date"
                },
                duration:"Duration (HH:mm:ss)",
                relative_start_time:"Relative Start Time (HH:mm:ss)",
                relative_stop_time:"Relative End Time (HH:mm:ss)",
                noOfOutputProducts: "#Dataproducts",
                do_cancel:{
                    name: "Cancelled",
                    filter: "switch"
                },
            }],
            optionalcolumns:  [{
                size: "Data size",
                dataSizeOnDisk: "Data size on Disk",
                subtaskContent: "Subtask Content",
                tags:"Tags",
                blueprint_draft:"BluePrint / Task Draft link",
                url:"API URL",
                created_at:{
                    name: "Created at",
                    filter: "date"
                },
                updated_at:{
                    name: "Updated at",
                    filter: "date"
                },
                actionpath:"actionpath"
            }],
            columnclassname: [{
                "Status Logs": "filter-input-0",
                "Type":"filter-input-75",
                "Scheduling Unit ID": "filter-input-50",
                "Scheduling Unit Name": "filter-input-100",
                "ID":"filter-input-50",
                "Control ID":"filter-input-75",
                "Cancelled":"filter-input-50",
                "Duration (HH:mm:ss)":"filter-input-75",
                "Template ID":"filter-input-50",
                // "BluePrint / Task Draft link": "filter-input-100",
                "Relative Start Time (HH:mm:ss)": "filter-input-75",
                "Relative End Time (HH:mm:ss)": "filter-input-75",
                "Status":"filter-input-100",
                "#Dataproducts":"filter-input-75",
                "Data size":"filter-input-50",
                "Data size on Disk":"filter-input-50",
                "Subtask Content":"filter-input-75",
                "BluePrint / Task Draft link":"filter-input-50",
            }]
        };
    }

    subtaskComponent = (task)=> {
        return (
            <button className="p-link" onClick={(e) => {this.setState({showStatusLogs: true, task: task})}}>
                <i className="fa fa-history"></i>
            </button>
        );
    };


    /**
     * Formatting the task_blueprints in blueprint view to pass to the ViewTable component
     * @param {Object} schedulingUnit - scheduling_unit_blueprint object from extended API call loaded with tasks(blueprint) along with their template and subtasks
     */
    getFormattedTaskBlueprints(tasks) {
        let taskBlueprintsList = [];
        for(const taskBlueprint of tasks) {
            taskBlueprint['status_logs'] = this.subtaskComponent(taskBlueprint);
            taskBlueprint['tasktype'] = 'Blueprint';
            taskBlueprint['actionpath'] = '/task/view/blueprint/'+taskBlueprint['id'];
            taskBlueprint['blueprint_draft'] = taskBlueprint['draft'];
            taskBlueprint['relative_start_time'] = 0;
            taskBlueprint['relative_stop_time'] = 0;
            taskBlueprint.duration = moment.utc((taskBlueprint.duration || 0)*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
            taskBlueprint.subTasks = taskBlueprint.subtasks;
            taskBlueprint.schedulingUnitId = taskBlueprint.scheduling_unit_blueprint_id;
            taskBlueprint.schedulingUnitName = taskBlueprint.scheduling_unit_blueprint_name;            
            taskBlueprintsList.push(taskBlueprint);
        }
        return taskBlueprintsList;
    }

    /**
     * Formatting the task_drafts and task_blueprints in draft view to pass to the ViewTable component
     * @param {Object} schedulingUnit - scheduling_unit_draft object from extended API call loaded with tasks(draft & blueprint) along with their template and subtasks
     */
    getFormattedTaskDrafts(tasks) {
        let scheduletasklist=[];
        // Common keys for Task and Blueprint
        let commonkeys = ['id','created_at','description','name','tags','updated_at','url','do_cancel','relative_start_time','relative_stop_time','start_time','stop_time','duration','status'];
        for(const task of tasks){
            let scheduletask = {};
            scheduletask['tasktype'] = 'Draft';
            scheduletask['actionpath'] = '/task/view/draft/'+task['id'];
            scheduletask['blueprint_draft'] = _.map(task['task_blueprints'], 'url');
            scheduletask['status'] = task['status'];

            //fetch task draft details
            for(const key of commonkeys){
                scheduletask[key] = task[key];
            }
            scheduletask['created_at'] = moment(task['created_at'],moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
            scheduletask['updated_at'] = moment(task['updated_at'],moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
            scheduletask['specifications_doc'] = task['specifications_doc'];
            scheduletask.duration = moment.utc((scheduletask.duration || 0)*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
            scheduletask.relative_start_time = moment.utc(scheduletask.relative_start_time*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
            scheduletask.relative_stop_time = moment.utc(scheduletask.relative_stop_time*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
            scheduletask.template = task.specifications_template;
            scheduletask.type_value = task.specifications_template.type_value;
            scheduletask.produced_by = task.produced_by;
            scheduletask.produced_by_ids = task.produced_by_ids;
            scheduletask.schedulingUnitId = task.scheduling_unit_draft_id;
            scheduletask.schedulingUnitName = task.scheduling_unit_draft_name;
            for(const blueprint of task['task_blueprints']){
                let taskblueprint = {};
                taskblueprint['tasktype'] = 'Blueprint';
                taskblueprint['actionpath'] = '/task/view/blueprint/'+blueprint['id'];
                taskblueprint['blueprint_draft'] = blueprint['draft'];
                taskblueprint['status'] = blueprint['status'];

                for(const key of commonkeys){
                    taskblueprint[key] = blueprint[key];
                }
                taskblueprint['created_at'] = moment(blueprint['created_at'], moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                taskblueprint['updated_at'] = moment(blueprint['updated_at'], moment.ISO_8601).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                taskblueprint.duration = moment.utc((taskblueprint.duration || 0)*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
                taskblueprint.relative_start_time = moment.utc(taskblueprint.relative_start_time*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
                taskblueprint.relative_stop_time = moment.utc(taskblueprint.relative_stop_time*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
                taskblueprint.template = scheduletask.template;
                taskblueprint.schedulingUnitId = task.scheduling_unit_draft_id;
                taskblueprint.subTasks = blueprint.subtasks;
                //Add Blue print details to array
                scheduletasklist.push(taskblueprint);
            }
            //Add Task Draft details to array
            scheduletasklist.push(scheduletask);
        }
        return scheduletasklist;
    }

    componentDidMount() {
        const promises = [
            TaskService.getTaskDraftList(),
            TaskService.getTaskBlueprintList(),
        ];
        Promise.all(promises).then((responses) => {
           // this.subTaskTemplates = responses[2];
            this.setState({ tasks: [...this.getFormattedTaskDrafts(responses[0]), ...this.getFormattedTaskBlueprints(responses[1])], isLoading: false});
        });
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }

        return (
            <React.Fragment>
                <PageHeader location={this.props.location} title={'Task - List'} />
                {this.state.isLoading? <AppLoader /> :
                    <ViewTable 
                        data={this.state.tasks} 
                        defaultcolumns={this.state.defaultcolumns}
                        optionalcolumns={this.state.optionalcolumns}
                        columnclassname={this.state.columnclassname}
                        columnOrders={this.state.columnOrders}
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
            </React.Fragment>
        );
    }
} 
 