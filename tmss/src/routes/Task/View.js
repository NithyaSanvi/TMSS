import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom'
import moment from 'moment';

import Jeditor from '../../components/JSONEditor/JEditor';
import Loader from 'react-loader-spinner';


import TaskService from '../../services/task.services';
import { Chips } from 'primereact/chips';

export class TaskView extends Component {
    DATE_FORMAT = 'YYYY-MMM-DD HH:mm:ss';
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false
        };
        this.setEditorFunction = this.setEditorFunction.bind(this);
        if (this.props.match.params.id) {
            this.state.taskId  = this.props.match.params.id;
        }
        if (this.props.match.params.type) {
            this.state.taskType = this.props.match.params.type;
        }
    }

    static getDerivedStateFromProps(nextProps, prevstate){
		
        if (prevstate.task && nextProps.location.state && 
             (nextProps.location.state.taskId === prevstate.task.id ||
             nextProps.location.state.taskType === prevstate.taskType)) {
            return {taskId: prevstate.task.id, taskType: prevstate.taskType}
        }
        return null;
    }

    componentDidUpdate(prevProps, prevState) {
	
        if (this.state.task && this.props.location.state &&
             (this.state.task.id !== this.props.location.state.taskId ||
             this.state.taskType !== this.props.location.state.taskType)) {
				
             this.getTaskDetails(this.props.location.state.taskId, this.props.location.state.taskType);
			  
        }
    }

    componentDidMount() {
        
        const taskId = this.props.location.state?this.props.location.state.id:this.state.taskId;
        let taskType = this.props.location.state?this.props.location.state.type:this.state.taskType;
        taskType = taskType?taskType:'draft';
        if (taskId && taskType) {
		this.setState({ isLoading: true });
            this.getTaskDetails(taskId, taskType);
        }   else {
			
            this.setState({redirect: "/Not-found"});
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
                       this.setState({schedulingUnit: schedulingUnit,isLoading:false});
                        });
                        TaskService.getTaskTemplate(task.specifications_template_id)
                        .then((taskTemplate) => {
                            
                            if (this.state.editorFunction) {
								
                                this.state.editorFunction();
                            }
                           this.setState({task: task, taskTemplate: taskTemplate, taskType: taskType,isLoading:false});
                        });
                    
                }   else {
                    this.setState({redirect: "/Not-found"});
                }
            });
        }
    }

    render() {
        const { isLoading } = this.state;
       
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        
        let jeditor = null
        
         
        if (this.state.taskTemplate) {
            
             
            jeditor = React.createElement(Jeditor,  {title: "Specification", 
                                                    schema: this.state.taskTemplate.schema,
                                                        initValue: this.state.task.specifications_doc,
                                                        disabled: true,
                                                        
                                                        // callback: this.setEditorOutput,
                                                        parentFunction: this.setEditorFunction,
														
                                                    });
        }
        

        // Child component to render predecessors and successors list
        const TaskRelationList = ({ list }) => (
		
            <ul className="task-list">
            {list && list.map(item => (
                <li key={item.id}>
                    <Link to={ { pathname:'/task', state: {taskId: item.id, taskType: item.draft?'blueprint':'draft'}}}>{item.name}</Link>
                </li>
            ))}
            </ul>
          );
        return ( 
              <React.Fragment>
                <div className="p-grid">
                    <div className="p-col-10 p-lg-3 p-md-4">
                        <h2>Task - Details </h2>
                    </div>
                    <div className="p-col-2 p-lg-3 p-md-4">
                        {this.state.taskType === 'draft' &&
                            <Link to={{ pathname: '/task/edit', state: {taskId: this.state.task?this.state.task.id:''}}} tooltip="Edit Task" >
                                <i className="fa fa-edit" style={{marginTop: "10px"}}></i>
                            </Link>
                        }
                        {this.state.taskType === 'blueprint' &&
                            <i className="fa fa-lock" style={{marginTop: "10px"}}></i>
                        }
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
      </div>:this.state.task &&
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
                                <Link className="col-lg-4 col-md-4 col-sm-12" to={ { pathname:'/schedulingunit/view', state: {id: this.state.schedulingUnit.id}}}>{this.state.schedulingUnit?this.state.schedulingUnit.name:''}</Link>
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
                                    <Link className="col-lg-4 col-md-4 col-sm-12" to={ { pathname:'/task', state: {taskId: this.state.task.draft_id, taskType: 'draft'}}}>{this.state.task.draftObject.name}</Link>
                                }
                            </div>
                        </div>
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