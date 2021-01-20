import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom'
import moment from 'moment';
import _ from 'lodash';
import Jeditor from '../../components/JSONEditor/JEditor';

import TaskService from '../../services/task.service';
import { Chips } from 'primereact/chips';
import { Dialog } from 'primereact/dialog';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import TaskStatusLogs from './state_logs';

export class TaskView extends Component {
    DATE_FORMAT = 'YYYY-MMM-DD HH:mm:ss';
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true
        };
        this.setEditorFunction = this.setEditorFunction.bind(this);
        if (this.props.match.params.id) {
            this.state.taskId  = this.props.match.params.id;
        }
        if (this.props.match.params.type) {
            this.state.taskType = this.props.match.params.type;
        }
        
    }

    // static getDerivedStateFromProps(nextProps, prevstate){
    //     console.log("DERIVED STATE FROM PROPS");
    //     console.log(nextProps);
    //     console.log(prevstate);
    //     if (prevstate.task && nextProps.match.params && 
    //          (nextProps.match.params.id === prevstate.task.id ||
    //          nextProps.match.params.type === prevstate.taskType)) {
    //         return {taskId: prevstate.task.id, taskType: prevstate.taskType}
    //     }
    //     console.log("RETURNS NULL");
    //     return null;
    // }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.task && this.props.match.params &&
            (this.state.taskId !== this.props.match.params.id ||
            this.state.taskType !== this.props.match.params.type)) {
            this.getTaskDetails(this.props.match.params.id, this.props.match.params.type);
       }
    }

    componentDidMount() {
        // const taskId = this.props.location.state?this.props.location.state.id:this.state.taskId;
        // let taskType = this.props.location.state?this.props.location.state.type:this.state.taskType;
        // taskType = taskType?taskType:'draft';
        let {taskId, taskType} = this.state;
        taskId = taskId?taskId:this.props.location.state.id;
        taskType = taskType?taskType:this.props.location.state.type;

        if (taskId && taskType) {
            this.getTaskDetails(taskId, taskType);
        }   else {
            this.setState({redirect: "/not-found"});
        }
    }

    /**
     * JEditor's function that to be called when parent wants to trigger change in the JSON Editor
     * @param {Function} editorFunction 
     */
    setEditorFunction(editorFunction) {
        this.setState({editorFunction: editorFunction});
    }

    /**
     * To get the task details from the backend using the service
     * @param {number} taskId 
     */
    getTaskDetails(taskId, taskType) {
        if (taskId) {
            taskType = taskType?taskType:'draft';
            TaskService.getTaskDetails(taskType, taskId)
            .then((task) => {
                if (task) {
                    TaskService.getSchedulingUnit(taskType, (taskType==='draft'?task.scheduling_unit_draft_id:task.scheduling_unit_blueprint_id))
                        .then((schedulingUnit) => {
                            let path = _.join(['/schedulingunit','view',((this.state.taskType === "draft")?'draft':'blueprint'),schedulingUnit.id], '/');
                            this.setState({schedulingUnit: schedulingUnit, supath:path});
                        });
                        TaskService.getTaskTemplate(task.specifications_template_id)
                        .then((taskTemplate) => {
                            if (this.state.editorFunction) {
                                this.state.editorFunction();
                            }
                            this.setState({task: task, taskTemplate: taskTemplate, isLoading: false, taskId: taskId, taskType: taskType});
                        });
                    
                }   else {
                    this.setState({redirect: "/not-found"});
                }
            });
        }
        
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        let jeditor = null
        if (this.state.taskTemplate) {
            jeditor = React.createElement(Jeditor, {title: "Specification", 
                                                        schema: this.state.taskTemplate.schema,
                                                        initValue: this.state.task.specifications_doc,
                                                        disabled: true,
                                                        // callback: this.setEditorOutput,
                                                        parentFunction: this.setEditorFunction
                                                    });
        }

        let actions = [ ];
        if (this.state.taskType === 'draft') {
            const taskId = this.state.task?this.state.task.id:'';
            actions = [{   icon: 'fa-edit',
                            title:'Click to Edit Task',
                            props : { pathname:`/task/edit/draft/${taskId}`,
                                        state: {taskId: taskId} 
                                    } 
                        }];
        }   else {
            actions = [{    icon: 'fa-lock',
                            title: 'Cannot edit blueprint'}];
        }
        actions.push({  icon: 'fa-window-close', link: this.props.history.goBack,
                        title:'Click to Close Task', props : { pathname:'/schedulingunit' }});

        // Child component to render predecessors and successors list
        const TaskRelationList = ({ list }) => (
            <ul className="task-list">
            {list && list.map(item => (
                <li key={item.id}>
                    {/* <Link to={ { pathname:'/task/view', state: {id: item.id, type: item.draft?'blueprint':'draft'}}}>{item.name}</Link> */}
                    <Link to={ { pathname:`/task/view/${item.draft?'blueprint':'draft'}/${item.id}`}}>{item.name}</Link>
                </li>
            ))}
            </ul>
          );
        return (
            <React.Fragment>
                {/* <div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Task - Details </h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        {this.state.taskType === 'draft' &&
                            <div>
                            <Link to={{ pathname: '/task'}} tooltip="Edit Task" 
                                style={{float: 'right'}}>
                                <i className="fa fa-times" style={{marginLeft:"5px", marginTop: "10px"}}></i>
                            </Link>
                            <Link to={{ pathname: '/task/edit', state: {taskId: this.state.task?this.state.task.id:''}}} tooltip="Edit Task" 
                                style={{float: 'right'}}>
                                <i className="fa fa-edit" style={{marginTop: "10px"}}></i>
                            </Link>
                            </div>
                        }
                        {this.state.taskType === 'blueprint' &&
                            <i className="fa fa-lock" style={{float:"right", marginTop: "10px"}}></i>
                        }
                    </div>
                    </div> */}
                <PageHeader location={this.props.location} title={'Task - View'} 
                            actions={actions}/>
                { this.state.isLoading? <AppLoader /> : this.state.task &&
                    <React.Fragment>
                        <div className="main-content">
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Name</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.task.name}</span>
                            <label className="col-lg-2 col-md-2 col-sm-12">Description</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.task.description}</span>
                        </div>
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Created At</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{moment.utc(this.state.task.created_at).format(this.DATE_FORMAT)}</span>
                            <label className="col-lg-2 col-md-2 col-sm-12">Updated At</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{moment.utc(this.state.task.updated_at).format(this.DATE_FORMAT)}</span>
                        </div>
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Copies</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.taskType==='draft'?this.state.task.copies:this.state.task.draftObject.copies}</span>
                            <label className="col-lg-2 col-md-2 col-sm-12">Copy Reason</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.taskType==='draft'?this.state.task.copy_reason_value:this.state.task.draftObject.copy_reason_value}</span>
                        </div>
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Start Time</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.task.start?moment.utc(this.state.task.start).format(this.DATE_FORMAT):""}</span>
                            <label className="col-lg-2 col-md-2 col-sm-12">End Time</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.task.end?moment.utc(this.state.task.end).format(this.DATE_FORMAT):""}</span>
                        </div>
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Tags</label>
                            <Chips className="col-lg-4 col-md-4 col-sm-12 chips-readonly" disabled value={this.state.task.tags}></Chips>
                            {this.state.schedulingUnit &&
                            <>
                                <label className="col-lg-2 col-md-2 col-sm-12">Scheduling Unit</label>
                                <Link className="col-lg-4 col-md-4 col-sm-12" to={ { pathname:this.state.supath, state: {id: this.state.schedulingUnit.id}}}>{this.state.schedulingUnit?this.state.schedulingUnit.name:''}</Link>
                            </>}
                        </div>
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Predecessors</label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <TaskRelationList list={this.state.task.predecessors} />
                            </div>
                            <label className="col-lg-2 col-md-2 col-sm-12">Successors</label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <TaskRelationList list={this.state.task.successors} />
                            </div>
                        </div>
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Template</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.taskTemplate.name}</span>
                            <label className="col-lg-2 col-md-2 col-sm-12">{this.state.taskType==='draft'?'Blueprints':'Draft'}</label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                {this.state.taskType === 'draft' &&
                                    <TaskRelationList list={this.state.task.blueprints} />
                                }
                                {this.state.taskType === 'blueprint' &&
                                    // <Link className="col-lg-4 col-md-4 col-sm-12" to={ { pathname:'/task/view', state: {id: this.state.task.draft_id, type: 'draft'}}}>{this.state.task.draftObject.name}</Link>
                                    <Link to={ { pathname:`/task/view/draft/${this.state.task.draft_id}`}}>{this.state.task.draftObject.name}</Link>
                                }
                            </div>
                        </div>
                        {this.state.taskType === 'blueprint' &&
                            <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Data Product</label>
                                <div className="col-lg-4 col-md-4 col-sm-12">
                                    <Link to={ { pathname:`/task/view/blueprint/${this.state.taskId}/dataproducts`}}> View Data Product</Link>
                                </div>
                                <label className="col-lg-2 col-md-2 col-sm-12">Status Logs</label>
                                <div className="col-lg-4 col-md-4 col-sm-12">
                                    <button className="p-link" onMouseOver={(e) => { this.setState({showStatusLogs: true})}}><i className="fa fa-history"></i></button>
                                    <Dialog header="State change logs" visible={this.state.showStatusLogs} maximizable position="right" style={{ width: '50vw' }} 
                                            onHide={() => {this.setState({showStatusLogs: false})}}>
                                        <TaskStatusLogs taskId={this.state.taskId}></TaskStatusLogs>
                                    </Dialog>
                                </div>
                            </div>
                        }
                        <div className="p-fluid">
                            <div className="p-grid"><div className="p-col-12">
                                {this.state.taskTemplate?jeditor:""}
                            </div></div>
                        </div>
                        </div>
                    </React.Fragment>
                }
            </React.Fragment>
        );
    }
}