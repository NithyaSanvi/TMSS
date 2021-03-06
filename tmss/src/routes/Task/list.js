import React, {Component} from 'react';
import {Redirect} from 'react-router-dom'
import moment from 'moment';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import _ from 'lodash';
import TaskService from '../../services/task.service';
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import ViewTable from '../../components/ViewTable';
import UIConstants from '../../utils/ui.constants';
import TaskStatusLogs from './state_logs';
import { appGrowl } from '../../layout/components/AppGrowl';
import { CustomDialog } from '../../layout/components/CustomDialog';
import ScheduleService from '../../services/schedule.service';
import UnitConverter from '../../utils/unit.converter';

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
            dialog: {},
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
                    filter: "date",
                    format:UIConstants.CALENDAR_DATETIME_FORMAT
                },
                stop_time:{
                    name:"End Time",
                    filter: "date",
                    format:UIConstants.CALENDAR_DATETIME_FORMAT
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
                    filter: "date",
                    format:UIConstants.CALENDAR_DATETIME_FORMAT
                },
                updated_at:{
                    name: "Updated at",
                    filter: "date",
                    format:UIConstants.CALENDAR_DATETIME_FORMAT
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
        this.selectedRows = [];
        this.subtaskTemplates = [];
        this.confirmDeleteTasks = this.confirmDeleteTasks.bind(this);
        this.onRowSelection = this.onRowSelection.bind(this);
        this.deleteTasks = this.deleteTasks.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
        this.getTaskDialogContent = this.getTaskDialogContent.bind(this);
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
     getFormattedTaskBlueprints(schedulingUnit) {
        let taskBlueprintsList = [];
        for(const taskBlueprint of schedulingUnit.task_blueprints) {
            taskBlueprint['status_logs'] = this.subtaskComponent(taskBlueprint);
            taskBlueprint['tasktype'] = 'Blueprint';
            taskBlueprint['actionpath'] = '/task/view/blueprint/'+taskBlueprint['id'];
            taskBlueprint['blueprint_draft'] = taskBlueprint['draft'];
            taskBlueprint['relative_start_time'] = 0;
            taskBlueprint['relative_stop_time'] = 0;
            taskBlueprint.duration = moment.utc((taskBlueprint.duration || 0)*1000).format(UIConstants.CALENDAR_TIME_FORMAT);
            taskBlueprint.template = taskBlueprint.specifications_template; 
            taskBlueprint.schedulingUnitName = schedulingUnit.name;
            for (const subtask of taskBlueprint.subtasks) {
                subtask.subTaskTemplate = _.find(this.subtaskTemplates, ['id', subtask.specifications_template_id]);
            }
            taskBlueprint.schedulingUnitId = taskBlueprint.scheduling_unit_blueprint_id;
            taskBlueprint.subTasks = taskBlueprint.subtasks;           
            taskBlueprintsList.push(taskBlueprint);
        }
        return taskBlueprintsList;
    }

    /**
     * Formatting the task_drafts and task_blueprints in draft view to pass to the ViewTable component
     * @param {Object} schedulingUnit - scheduling_unit_draft object from extended API call loaded with tasks(draft & blueprint) along with their template and subtasks
     */
     getFormattedTaskDrafts(schedulingUnit) {
        let scheduletasklist=[];
        // Common keys for Task and Blueprint
        let commonkeys = ['id','created_at','description','name','tags','updated_at','url','do_cancel','relative_start_time','relative_stop_time','start_time','stop_time','duration','status'];
        for(const task of schedulingUnit.task_drafts){
            let scheduletask = {};
            scheduletask['tasktype'] = 'Draft';
            scheduletask['actionpath'] = '/task/view/draft/'+task['id'];
            scheduletask['blueprint_draft'] = _.map(task['task_blueprints'], 'url');
            scheduletask['status'] = task['status'];

            //fetch task draft details
            for(const key of commonkeys){
                scheduletask[key] = task[key];
            }
            scheduletask['specifications_doc'] = task['specifications_doc'];
            scheduletask.duration = moment.utc((scheduletask.duration || 0)*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
            scheduletask.relative_start_time = moment.utc(scheduletask.relative_start_time*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
            scheduletask.relative_stop_time = moment.utc(scheduletask.relative_stop_time*1000).format(UIConstants.CALENDAR_TIME_FORMAT); 
            scheduletask.template = task.specifications_template;
            scheduletask.type_value = task.specifications_template.type_value;
            scheduletask.produced_by = task.produced_by;
            scheduletask.produced_by_ids = task.produced_by_ids;
            scheduletask.schedulingUnitId = task.scheduling_unit_draft_id;
            scheduletask.schedulingUnitName = schedulingUnit.name;
            //Add Task Draft details to array
            scheduletasklist.push(scheduletask);
        }
        return scheduletasklist;
    }

    async formatDataProduct(tasks) {
        await Promise.all(tasks.map(async task => {
            task.status_logs = task.tasktype === "Blueprint"?this.subtaskComponent(task):"";
            //Displaying SubTask ID of the 'control' Task
            const subTaskIds = task.subTasks?task.subTasks.filter(sTask => sTask.subTaskTemplate.name.indexOf('control') >= 0):[];
            const promise = [];
            subTaskIds.map(subTask => promise.push(ScheduleService.getSubtaskOutputDataproduct(subTask.id)));
            const dataProducts = promise.length > 0? await Promise.all(promise):[];
            task.dataProducts = [];
            task.size = 0;
            task.dataSizeOnDisk = 0;
            task.noOfOutputProducts = 0;
            task.canSelect = task.tasktype.toLowerCase() === 'blueprint' ? true:(task.tasktype.toLowerCase() === 'draft' && task.blueprint_draft.length === 0)?true:false;
            if (dataProducts.length && dataProducts[0].length) {
                task.dataProducts = dataProducts[0];
                task.noOfOutputProducts = dataProducts[0].length;
                task.size = _.sumBy(dataProducts[0], 'size');
                task.dataSizeOnDisk = _.sumBy(dataProducts[0], function(product) { return product.deletedSince?0:product.size});
                task.size = UnitConverter.getUIResourceUnit('bytes', (task.size));
                task.dataSizeOnDisk = UnitConverter.getUIResourceUnit('bytes', (task.dataSizeOnDisk));
            }
            task.subTaskID = subTaskIds.length ? subTaskIds[0].id : ''; 
            return task;
        }));
        return tasks;
    }


    async componentDidMount() {
        this.subtaskTemplates = await TaskService.getSubtaskTemplates()
        const promises = [
            ScheduleService.getSchedulingUnitsExtended('draft'), 
            ScheduleService.getSchedulingUnitsExtended('blueprint')
        ];
        Promise.all(promises).then(async (responses) => {
            let allTasks = [];
            for (const schedulingUnit of responses[0]) {
                let tasks = schedulingUnit.task_drafts?(await this.getFormattedTaskDrafts(schedulingUnit)):this.getFormattedTaskBlueprints(schedulingUnit);
                let ingestGroup = tasks.map(task => ({name: task.name, canIngest: task.canIngest, type_value: task.type_value, id: task.id }));
                ingestGroup = _.groupBy(_.filter(ingestGroup, 'type_value'), 'type_value');
                tasks = await this.formatDataProduct(tasks);
                allTasks = [...allTasks, ...tasks];
            }
            for (const schedulingUnit of responses[1]) {
                let tasks = schedulingUnit.task_drafts?(await this.getFormattedTaskDrafts(schedulingUnit)):this.getFormattedTaskBlueprints(schedulingUnit);
                let ingestGroup = tasks.map(task => ({name: task.name, canIngest: task.canIngest, type_value: task.type_value, id: task.id }));
                ingestGroup = _.groupBy(_.filter(ingestGroup, 'type_value'), 'type_value');
                tasks = await this.formatDataProduct(tasks);
                allTasks = [...allTasks, ...tasks];
            }
            this.setState({ tasks: allTasks,  isLoading: false });
        });
    }

    /**
     * Prepare Task(s) details to show on confirmation dialog
     */
     getTaskDialogContent() {
        let selectedTasks = [];
        for(const obj of this.selectedRows) {
            selectedTasks.push({id:obj.id, suId: obj.schedulingUnitId, suName: obj.schedulingUnitName, 
                taskId: obj.id, controlId: obj.subTaskID, taskName: obj.name, status: obj.status});
        }   
        return  <>  
                <DataTable value={selectedTasks} resizableColumns columnResizeMode="expand" className="card" style={{paddingLeft: '0em'}}>
                    <Column field="suId" header="Scheduling Unit Id"></Column>
                    <Column field="taskId" header="Task Id"></Column>
                    <Column field="taskName" header="Task Name"></Column>
                    <Column field="status" header="Status"></Column>
                </DataTable>
        </>
    }

    confirmDeleteTasks() {
        if(this.selectedRows.length === 0) {
            appGrowl.show({severity: 'info', summary: 'Select Row', detail: 'Select Task to delete.'});
        }   else {
            let dialog = {};
            dialog.type = "confirmation";
            dialog.header= "Confirm to Delete Task(s)";
            dialog.detail = "Do you want to delete the selected Task(s)?";
            dialog.content = this.getTaskDialogContent;
            dialog.actions = [{id: 'yes', title: 'Yes', callback: this.deleteTasks},
            {id: 'no', title: 'No', callback: this.closeDialog}];
            dialog.onSubmit = this.deleteTasks;
            dialog.width = '55vw';
            dialog.showIcon = false;
            this.setState({dialog: dialog, dialogVisible: true});
        }
    }

    /**
     * Delete Task(s)
     */
    async deleteTasks() {
        let hasError = false;
        for(const task of this.selectedRows) {
            if(!await TaskService.deleteTask(task.tasktype, task.id)) {
                hasError = true;
            }
        }
        if(hasError){
            appGrowl.show({severity: 'error', summary: 'error', detail: 'Error while deleting Task(s)'});
            this.setState({dialogVisible: false});
        }   else {
            this.selectedRows = [];
            this.setState({dialogVisible: false});
            this.componentDidMount();
            appGrowl.show({severity: 'success', summary: 'Success', detail: 'Task(s) deleted successfully'});
        }
    }

    /**
     * Callback function to close the dialog prompted.
     */
    closeDialog() {
        this.setState({dialogVisible: false});
    }

    onRowSelection(selectedRows) {
        this.selectedRows = selectedRows;
    }


    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }

        return (
            <React.Fragment>
                <PageHeader location={this.props.location} title={'Task - List'} />
                {this.state.isLoading? <AppLoader /> :
                     <>
                     <div className="delete-option">
                        <div >
                            <span className="p-float-label">
                                <a href="#" onClick={this.confirmDeleteTasks}  title="Delete selected Task(s)">
                                    <i class="fa fa-trash" aria-hidden="true" ></i>
                                </a>
                            </span>
                        </div>                           
                    </div>
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
                        allowRowSelection={true}
                        onRowSelection = {this.onRowSelection}
                    />
                </>
                }
                {this.state.showStatusLogs &&
                    <Dialog header={`Status change logs - ${this.state.task?this.state.task.name:""}`} 
                            visible={this.state.showStatusLogs} maximizable maximized={false} position="left" style={{ width: '50vw' }} 
                            onHide={() => {this.setState({showStatusLogs: false})}}>
                            <TaskStatusLogs taskId={this.state.task.id}></TaskStatusLogs>
                    </Dialog>
                }
                <CustomDialog type="confirmation" visible={this.state.dialogVisible}
                    header={this.state.dialog.header} message={this.state.dialog.detail} actions={this.state.dialog.actions}
                    content={this.state.dialog.content} width={this.state.dialog.width} showIcon={this.state.dialog.showIcon}
                    onClose={this.closeDialog} onCancel={this.closeDialog} onSubmit={this.state.dialog.onSubmit}/>
            </React.Fragment>
        );
    }
} 
 