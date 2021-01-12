import React, {Component} from 'react';
import { Link, Redirect } from 'react-router-dom';
import _ from 'lodash';

import {InputText} from 'primereact/inputtext';
import {InputTextarea} from 'primereact/inputtextarea';
import {Chips} from 'primereact/chips';
import {Dropdown} from 'primereact/dropdown';
import { Button } from 'primereact/button';

import Jeditor from '../../components/JSONEditor/JEditor';

import TaskService from '../../services/task.service';
import AppLoader from "./../../layout/components/AppLoader";
import PageHeader from '../../layout/components/PageHeader';


export class TaskEdit extends Component {
    templateOutput = {};        // id: selectedTemplateId, output: values enetered in the editor form
    
    constructor(props) {
        super(props);
        this.state = {
            task: {
                name: "",
                created_at: null,
                updated_at: null,
                tags:[],
                do_cancel: false
            },
            redirect: null,
            taskTemplates:[],
            validEditor: false,
            validForm: false,
            errors: {},
            isLoading: true
        };
        this.formRules = {
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"}
        };
        this.readOnlyProperties = ['duration', 'relative_start_time', 'relative_stop_time'];
        this.setEditorOutput = this.setEditorOutput.bind(this);
        this.setTaskParams = this.setTaskParams.bind(this);
        this.changeTaskTemplate = this.changeTaskTemplate.bind(this);
        this.setEditorFunction = this.setEditorFunction.bind(this);
        this.validateForm = this.validateForm.bind(this);
        this.saveTask = this.saveTask.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);
    }

    /**
     * This is the callback method to be passed to the JSON editor. 
     * JEditor will call this function when there is change in the editor.
     * @param {Object} jsonOutput 
     * @param {Array} errors 
     */
    setEditorOutput(jsonOutput, errors) {
        this.templateOutput[this.state.task.specifications_template_id] = jsonOutput;
        if (errors.length === 0 && !this.state.validEditor) {
            this.setState({validEditor: true, validForm: this.validateForm()});
        }   else if (errors.length > 0 && this.state.validEditor) {
            this.setState({validEditor: false, validForm: this.validateForm()});
        }
    }

    /**
     * Function called when there is change in the task parameters.
     * @param {String} key 
     * @param {*} value 
     */
    setTaskParams(key, value) {
        let task = this.state.task;
        task[key] = value;
        this.setState({task: task, validForm: this.validateForm()});
    }

    /**
     * JEditor's function that to be called when parent wants to trigger change in the JSON Editor
     * @param {Function} editorFunction 
     */
    setEditorFunction(editorFunction) {
        this.setState({editorFunction: editorFunction});
    }

    /**
     * Function to be called when the template schema is changed
     * @param {Number} templateId 
     */
    changeTaskTemplate(templateId) {
		
        const template = _.find(this.state.taskTemplates, {'id': templateId});
        let task = this.state.task;
        task.specifications_template_id = templateId;
		
        task.specifications_template = template.url;
        this.setState({taskSchema: null});
        this.setState({task: task, taskSchema: template.schema});
		 
        this.state.editorFunction();
    }

    /**
     * Function to validate the form excluding the JSON Editor values
     */
    validateForm() {
        let validForm = false;
        let errors = {};
        for (const fieldName in this.formRules) {
            const rule = this.formRules[fieldName];
            const fieldValue = this.state.task[fieldName];
            if (rule.required) {
                if (!fieldValue) {
                    errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
                }
            }
        }
        this.setState({errors: errors});
        if (this.state.task.name && this.state.task.description) {
            validForm = true;
        }
        return validForm;
    }
    
    /**
     * Function to call the servie and pass the values to save
     */
    saveTask() {
        let task = this.state.task;
        task.specifications_doc = this.templateOutput[task.specifications_template_id];
        // Remove read only properties from the object before sending to API
        this.readOnlyProperties.forEach(property => { delete task[property]});
        TaskService.updateTask("draft", task)
        .then( (taskDraft) => {
            if (taskDraft) {
                this.setState({redirect: '/task/view/draft/' + task.id});
            }
        });
    }

    cancelEdit() {
        this.props.history.goBack();
    }

    componentDidMount() {
        this.setState({ isLoading: true });
        TaskService.getTaskTemplates()
        .then((templates) => {
            this.setState({taskTemplates: templates});
        });
        TaskService.getTaskDetails("draft", this.props.taskId?this.props.taskId:this.props.location.state.taskId)
        .then((task) => {
            if (task) {
                TaskService.getSchedulingUnit("draft", task.scheduling_unit_draft_id)
                .then((schedulingUnit) => {
                    this.setState({schedulingUnit: schedulingUnit,isLoading: false});
                });
                
                this.templateOutput[task.specifications_template_id] = task.specifications_doc;
                TaskService.getTaskTemplate(task.specifications_template_id)
                .then((taskTemplate) => {
                    this.setState({task: task, taskSchema: taskTemplate.schema, isLoading: false});
                });
            }   else {
                this.setState({redirect: "/not-found"});
            }
        });
    }

    render() {
       
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect, 
                                    state: {id: this.state.task.id}} }></Redirect>
        }
        const { isLoading } = this.state;
        
        const taskSchema = this.state.taskSchema;
        
        let jeditor = null;
        if (this.state.taskSchema) {
		
            jeditor = React.createElement(Jeditor, {title: "Specification", 
                                                        schema: taskSchema,
                                                        //initValue: this.state.templateOutput[this.state.task.specifications_template_id], 
                                                        initValue: this.templateOutput[this.state.task.specifications_template_id], 
                                                        callback: this.setEditorOutput,
                                                        parentFunction: this.setEditorFunction
                                                    });
        }
        
        return (
            <React.Fragment>
                {/*} <div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Task - Edit</h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: `/task/view/draft/${this.state.task?this.state.task.id:''}`}} title="Close Edit"
                                style={{float: "right"}} >
                            <i className="fa fa-window-close" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                    </div> */}
				<PageHeader location={this.props.location} title={'Task - Edit'} actions={[{icon: 'fa-window-close',link: this.props.history.goBack,title:'Click to Close Task Edit Page' ,props : { pathname:  `/task/view/draft/${this.state.task?this.state.task.id:''}`}}]}/>
				{isLoading ? <AppLoader/> :
                <div>
			        <div className="p-fluid">
                    <div className="p-field p-grid">
                    <label htmlFor="taskName" className="col-lg-2 col-md-2 col-sm-12">Name <span style={{color:'red'}}>*</span></label>
                    <div className="col-lg-4 col-md-4 col-sm-12">
                        <InputText className={this.state.errors.name ?'input-error':''} id="taskName" type="text" value={this.state.task.name} onChange={(e) => this.setTaskParams('name', e.target.value)}/>
                        <label className="error">
                            {this.state.errors.name ? this.state.errors.name : ""}
                        </label>
                    </div>
                    <label htmlFor="description" className="col-lg-2 col-md-2 col-sm-12">Description <span style={{color:'red'}}>*</span></label>
                    <div className="col-lg-4 col-md-4 col-sm-12">
                        <InputTextarea className={this.state.errors.description ?'input-error':''} rows={3} cols={30} value={this.state.task.description} onChange={(e) => this.setTaskParams('description', e.target.value)}/>
                        <label className="error">
                            {this.state.errors.description ? this.state.errors.description : ""}
                        </label>
                    </div>
                    </div>
                    {/* <div className="p-field p-grid">
                        <label htmlFor="createdAt" className="col-lg-2 col-md-2 col-sm-12">Created At</label>
                        <div className="col-lg-4 col-md-4 col-sm-12">
                            <Calendar showTime={true} hourFormat="24" value={created_at} onChange={(e) => this.setState({date2: e.value})}></Calendar>
                        </div>
                        <label htmlFor="updatedAt" className="col-lg-2 col-md-2 col-sm-12">Updated At</label>
                        <div className="col-lg-4 col-md-4 col-sm-12">
                            <Calendar showTime={true} hourFormat="24" value={updated_at} onChange={(e) => this.setState({date2: e.value})}></Calendar>
                        </div>
                        </div> 
                    */}
                    <div className="p-field p-grid">
                    <label htmlFor="tags" className="col-lg-2 col-md-2 col-sm-12">Tags</label>
                    <div className="col-lg-4 col-md-4 col-sm-12">
                        <Chips value={this.state.task.tags?this.state.task.tags:[]} onChange={(e) => this.setTaskParams('tags', e.value)}></Chips>
                    </div>
                    {/* <label htmlFor="doCancel" className="col-lg-2 col-md-2 col-sm-12">Do Cancel</label>
                    <div className="col-lg-4 col-md-4 col-sm-12">
                        <Checkbox onChange={e => this.setTaskParams('do_cancel', e.checked)} checked={this.state.task.do_cancel}></Checkbox>
                    </div> */}
                    {this.state.schedulingUnit &&
                    <>
                        <label className="col-lg-2 col-md-2 col-sm-12">Scheduling Unit</label>
                        <Link className="col-lg-4 col-md-4 col-sm-12" to={ { pathname:'/schedulingunit/view', state: {id: this.state.schedulingUnit.id}}}>{this.state.schedulingUnit?this.state.schedulingUnit.name:''}</Link>
                    </>
                    }
                    </div>
                    <div className="p-field p-grid">
                        <label htmlFor="tags" className="col-lg-2 col-md-2 col-sm-12">Template</label>
                        <div className="col-lg-4 col-md-4 col-sm-12">
                            <Dropdown optionLabel="name" optionValue="id" 
                            value={this.state.task.specifications_template_id} 
                            options={this.state.taskTemplates} 
                            onChange={(e) => {this.changeTaskTemplate(e.value)}} 
                            placeholder="Select Task Template"/>
                        </div>
                    </div>
                    </div>
				    </div>
                }
                <div className="p-fluid">
                <div className="p-grid"><div className="p-col-12">
                    {this.state.taskSchema?jeditor:""}
                </div>
                </div>
                </div>
            
                <div className="p-grid p-justify-start">
                <div className="p-col-1">
                    <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.saveTask} disabled={!this.state.validEditor || !this.state.validForm} />
                </div>
                <div className="p-col-1">
                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.cancelEdit}  />
                </div>
                </div>
            </React.Fragment>
        );
    }
}
