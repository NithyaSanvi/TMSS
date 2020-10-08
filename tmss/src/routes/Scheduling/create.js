import React, {Component} from 'react';
import { Link, Redirect } from 'react-router-dom';
import _ from 'lodash';
import $RefParser from "@apidevtools/json-schema-ref-parser";

import {InputText} from 'primereact/inputtext';
import {InputTextarea} from 'primereact/inputtextarea';
import {Dropdown} from 'primereact/dropdown';
import { Button } from 'primereact/button';
import {Dialog} from 'primereact/components/dialog/Dialog';
import {Growl} from 'primereact/components/growl/Growl';

import AppLoader from '../../layout/components/AppLoader';
import Jeditor from '../../components/JSONEditor/JEditor';

import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import TaskService from '../../services/task.service';
import UIConstants from '../../utils/ui.constants';
import PageHeader from '../../layout/components/PageHeader';

/**
 * Component to create a new SchedulingUnit from Observation strategy template
 */
export class SchedulingUnitCreate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,                        // Flag for loading spinner
            dialog: { header: '', detail: ''},      // Dialog properties
            redirect: null,                         // URL to redirect
            errors: [],                             // Form Validation errors
            schedulingSets: [],                     // Scheduling set of the selected project
            schedulingUnit: {
                project: (props.match?props.match.params.project:null) || null,
            },
            projectDisabled: (props.match?(props.match.params.project? true:false):false),      // Disable project selection if 
            observStrategy: {},                     // Selected strategy to create SU
            paramsSchema: null,                     // JSON Schema to be generated from strategy template to pass to JSOn editor
            constraintSchema:null,                  
            validEditor: false,                     // For JSON editor validation
            validFields: {},                        // For Form Validation
        }
        this.projects = [];                         // All projects to load project dropdown
        this.schedulingSets = [];                   // All scheduling sets to be filtered for project
        this.observStrategies = [];                 // All Observing strategy templates
        this.taskTemplates = [];                    // All task templates to be filtered based on tasks in selected strategy template
        this.tooltipOptions = UIConstants.tooltipOptions;
        this.constraintTemplates = [];
        this.nameInput = React.createRef();         // Ref to Name field for auto focus
        this.formRules = {                          // Form validation rules
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
            project: {required: true, message: "Select project to get Scheduling Sets"},
            scheduling_set_id: {required: true, message: "Select the Scheduling Set"},
        };
 
        this.setEditorOutput = this.setEditorOutput.bind(this);
        this.setEditorOutputCosntarint = this.setEditorOutputCosntarint.bind(this);
        this.changeProject = this.changeProject.bind(this);
        this.changeStrategy = this.changeStrategy.bind(this);
        this.constraintStrategy = this.constraintStrategy.bind(this);
        this.setSchedUnitParams = this.setSchedUnitParams.bind(this);
        this.validateForm = this.validateForm.bind(this);
        this.validateEditor = this.validateEditor.bind(this);
        this.setEditorFunction = this.setEditorFunction.bind(this);
        this.saveSchedulingUnit = this.saveSchedulingUnit.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.reset = this.reset.bind(this);
    }

    componentDidMount() {
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingSets(),
                            ScheduleService.getObservationStrategies(),
                            TaskService.getTaskTemplates(),
                            ScheduleService.getSchedulingConstraints()]
        Promise.all(promises).then(responses => {
            this.projects = responses[0];
            this.schedulingSets = responses[1];
            this.observStrategies = responses[2];
            this.taskTemplates = responses[3];
            this.constraintTemplates = responses[4];
             //  Setting first value as constraint template
             this.constraintStrategy(this.constraintTemplates[0]);
            if (this.state.schedulingUnit.project) {
                const projectSchedSets = _.filter(this.schedulingSets, {'project_id': this.state.schedulingUnit.project});
                this.setState({isLoading: false, schedulingSets: projectSchedSets});
            }   else {
                this.setState({isLoading: false});
            }
        }); 
    }

    /**
     * Function to call on change of project and reload scheduling set dropdown
     * @param {string} projectName 
     */
    changeProject(projectName) {
        const projectSchedSets = _.filter(this.schedulingSets, {'project_id': projectName});
        let schedulingUnit = this.state.schedulingUnit;
        schedulingUnit.project = projectName;
        this.setState({schedulingUnit: schedulingUnit, schedulingSets: projectSchedSets, validForm: this.validateForm('project')});
    }

    /**
     * Function called when observation strategy template is changed. 
     * It generates the JSON schema for JSON editor and defult vales for the parameters to be captured
     * @param {number} strategyId 
     */
    async changeStrategy (strategyId) {
        const observStrategy = _.find(this.observStrategies, {'id': strategyId});
        const tasks = observStrategy.template.tasks;    
        let paramsOutput = {};
        let schema = { type: 'object', additionalProperties: false, 
                        properties: {}, definitions:{}
                     };
                     
            for (const taskName of _.keys(tasks)) {
            const task = tasks[taskName];
            //Resolve task from the strategy template
            const $taskRefs = await $RefParser.resolve(task);

            // Identify the task specification template of every task in the strategy template
            const taskTemplate = _.find(this.taskTemplates, {'name': task['specifications_template']});
            schema['$id'] = taskTemplate.schema['$id'];
            schema['$schema'] = taskTemplate.schema['$schema'];
            let index = 0;
            for (const param of observStrategy.template.parameters) {
                if (param.refs[0].indexOf(`/tasks/${taskName}`) > 0) {
                    // Resolve the identified template
                    const $templateRefs = await $RefParser.resolve(taskTemplate);
                    let property = { };
                    let tempProperty = null;
                    const taskPaths = param.refs[0].split("/");
                    // Get the property type from the template and create new property in the schema for the parameters
                    try {
                        const parameterRef = param.refs[0];//.replace(`#/tasks/${taskName}/specifications_doc`, '#/schema/properties');
                        tempProperty = $templateRefs.get(parameterRef);
                    //    property = _.cloneDeep(taskTemplate.schema.properties[taskPaths[4]]);
                       
                    }   catch(error) {
                        tempProperty = _.cloneDeep(taskTemplate.schema.properties[taskPaths[4]]);
                        if (tempProperty.type === 'array') {
                            tempProperty = tempProperty.items.properties[taskPaths[6]];
                        }
                        property = tempProperty;
                    }
                  /*  if (property['$ref'] && !property['$ref'].startsWith("#")) {
                        const $propDefinition = await $RefParser.resolve(property['$ref']);
                        const propDefinitions = $propDefinition.get("#/definitions");
                        for (const propDefinition in propDefinitions) {
                            schema.definitions[propDefinition] = propDefinitions[propDefinition];
                            property['$ref'] = "#/definitions/"+ propDefinition ;
                        } 
                    } */
                    property.title = param.name;
                    property.default = $taskRefs.get(param.refs[0].replace(`#/tasks/${taskName}`, '#'));
                    paramsOutput[`param_${index}`] = property.default;
                    schema.properties[`param_${index}`] = property;
                    // Set property defintions taken from the task template in new schema
                    for (const definitionName in taskTemplate.schema.definitions) {
                        schema.definitions[definitionName] = taskTemplate.schema.definitions[definitionName];
                        
                    }
                }
                index++;
               
            }
            
        }
        this.setState({observStrategy: observStrategy, paramsSchema: schema, paramsOutput: paramsOutput});

        // Function called to clear the JSON Editor fields and reload with new schema
        if (this.state.editorFunction) {
            this.state.editorFunction();
        }
    }

    /**
     * This is the callback method to be passed to the JSON editor. 
     * JEditor will call this function when there is change in the editor.
     * @param {Object} jsonOutput 
     * @param {Array} errors 
     */
    setEditorOutput(jsonOutput, errors) {
        this.paramsOutput = jsonOutput;
        this.validEditor = errors.length === 0;
        this.setState({ paramsOutput: jsonOutput, 
                        validEditor: errors.length === 0,
                        validForm: this.validateForm()});
    }

    setEditorOutputCosntarint(jsonOutput, errors) {
        this.constarintParamsOutput = jsonOutput;
        this.constarintValidEditor = errors.length === 0;
        this.setState({ constarintParamsOutput: jsonOutput, 
                        constarintValidEditor: errors.length === 0,
                        validForm: this.validateForm()});
    }

    /**
     * This function is mainly added for Unit Tests. If this function is removed Unit Tests will fail.
     */
    validateEditor() {
        return this.validEditor?true:false;
    }
    
    /**
     * Function to set form values to the SU object
     * @param {string} key 
     * @param {object} value 
     */
    setSchedUnitParams(key, value) {
        let schedulingUnit = this.state.schedulingUnit;
        schedulingUnit[key] = value;
        this.setState({schedulingUnit: schedulingUnit, validForm: this.validateForm(key), validEditor: this.validateEditor()});
        this.validateEditor();
    }

    /**
     * JEditor's function that to be called when parent wants to trigger change in the JSON Editor
     * @param {Function} editorFunction 
     */
    setEditorFunction(editorFunction) {
        this.setState({editorFunction: editorFunction});
    }

    /**
     * Validation function to validate the form or field based on the form rules.
     * If no argument passed for fieldName, validates all fields in the form.
     * @param {string} fieldName 
     */
    validateForm(fieldName) {
        let validForm = false;
        let errors = this.state.errors;
        let validFields = this.state.validFields;
        if (fieldName) {
            delete errors[fieldName];
            delete validFields[fieldName];
            if (this.formRules[fieldName]) {
                const rule = this.formRules[fieldName];
                const fieldValue = this.state.schedulingUnit[fieldName];
                if (rule.required) {
                    if (!fieldValue) {
                        errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
                    }   else {
                        validFields[fieldName] = true;
                    }
                }
            }
        }   else {
            errors = {};
            validFields = {};
            for (const fieldName in this.formRules) {
                const rule = this.formRules[fieldName];
                const fieldValue = this.state.schedulingUnit[fieldName];
                if (rule.required) {
                    if (!fieldValue) {
                        errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
                    }   else {
                        validFields[fieldName] = true;
                    }
                }
            }
        }
        this.setState({errors: errors, validFields: validFields});
        if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
            validForm = true;
        }
        return validForm;
    }

    /**
     * Function to create Scheduling unit
     */
    async saveSchedulingUnit() {
        let observStrategy = _.cloneDeep(this.state.observStrategy);
        const $refs = await $RefParser.resolve(observStrategy.template);
        observStrategy.template.parameters.forEach(async(param, index) => {
            $refs.set(observStrategy.template.parameters[index]['refs'][0], this.state.paramsOutput['param_' + index]);
        });
        
        const schedulingUnit = await ScheduleService.saveSUDraftFromObservStrategy(observStrategy, this.state.schedulingUnit);
        if (schedulingUnit) {
            // this.growl.show({severity: 'success', summary: 'Success', detail: 'Scheduling Unit and tasks created successfully!'});
            const dialog = {header: 'Success', detail: 'Scheduling Unit and Tasks are created successfully. Do you want to create another Scheduling Unit?'};
            this.setState({schedulingUnit: schedulingUnit, dialogVisible: true, dialog: dialog})
        }   else {
            this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to save Scheduling Unit/Tasks'});
        }
    }

    /**
     * Cancel SU creation and redirect
     */
    cancelCreate() {
        this.props.history.goBack();
    }

    constraintStrategy(e){
        let schedulingUnit = { ...this.state.schedulingUnit };
        schedulingUnit.scheduling_constraints_template_id = e.id;
        this.setState({ constraintSchema: this.constraintTemplates[0], schedulingUnit});
     }
   
 

    /**
     * Reset function to be called when user wants to create new SU
     */
    reset() {
        const schedulingSets = this.state.schedulingSets;
        this.nameInput.element.focus();
        this.setState({
            dialogVisible: false,
            dialog: { header: '', detail: ''},      
            errors: [],
            schedulingSets: this.props.match.params.project?schedulingSets:[],
            schedulingUnit: {
                name: '',
                description: '',
                project: this.props.match.params.project || null,
            },
            projectDisabled: (this.props.match.params.project? true:false),
            observStrategy: {},
            paramsOutput: null,
            validEditor: false,
            validFields: {}
        });
        this.state.editorFunction();
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        
        const schema = this.state.paramsSchema;
        
        let jeditor = null;
        if (schema) {
            
		   jeditor = React.createElement(Jeditor, {title: "Task Parameters", 
                                                        schema: schema,
                                                        initValue: this.state.paramsOutput, 
                                                        callback: this.setEditorOutput,
                                                        parentFunction: this.setEditorFunction
                                                    }); 
        }
        return (
            <React.Fragment>
                <Growl ref={(el) => this.growl = el} />
                <PageHeader location={this.props.location} title={'Scheduling Unit - Add'} 
                           actions={[{icon: 'fa-window-close',link: this.props.history.goBack,title:'Click to close Scheduling Unit creation', props : { pathname: `/schedulingunit`}}]}/>
                { this.state.isLoading ? <AppLoader /> :
                <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="schedUnitName" className="col-lg-2 col-md-2 col-sm-12">Name <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <InputText className={this.state.errors.name ?'input-error':''} id="schedUnitName" data-testid="name" 
                                            tooltip="Enter name of the Scheduling Unit" tooltipOptions={this.tooltipOptions} maxLength="128"
                                            ref={input => {this.nameInput = input;}}
                                            value={this.state.schedulingUnit.name} autoFocus
                                            onChange={(e) => this.setSchedUnitParams('name', e.target.value)}
                                            onBlur={(e) => this.setSchedUnitParams('name', e.target.value)}/>
                                <label className={this.state.errors.name?"error":"info"}>
                                    {this.state.errors.name ? this.state.errors.name : "Max 128 characters"}
                                </label>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="description" className="col-lg-2 col-md-2 col-sm-12">Description <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <InputTextarea className={this.state.errors.description ?'input-error':''} rows={3} cols={30} 
                                            tooltip="Longer description of the scheduling unit" tooltipOptions={this.tooltipOptions} maxLength="128"
                                            data-testid="description" value={this.state.schedulingUnit.description} 
                                            onChange={(e) => this.setSchedUnitParams('description', e.target.value)}
                                            onBlur={(e) => this.setSchedUnitParams('description', e.target.value)}/>
                                <label className={this.state.errors.description ?"error":"info"}>
                                    {this.state.errors.description ? this.state.errors.description : "Max 255 characters"}
                                </label>
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="project" className="col-lg-2 col-md-2 col-sm-12">Project <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12" data-testid="project" >
                                <Dropdown inputId="project" optionLabel="name" optionValue="name" 
                                        tooltip="Project" tooltipOptions={this.tooltipOptions}
                                        value={this.state.schedulingUnit.project} disabled={this.state.projectDisabled}
                                        options={this.projects} 
                                        onChange={(e) => {this.changeProject(e.value)}} 
                                        placeholder="Select Project" />
                                <label className={this.state.errors.project ?"error":"info"}>
                                    {this.state.errors.project ? this.state.errors.project : "Select Project to get Scheduling Sets"}
                                </label>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="schedSet" className="col-lg-2 col-md-2 col-sm-12">Scheduling Set <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <Dropdown data-testid="schedSet" id="schedSet" optionLabel="name" optionValue="id" 
                                        tooltip="Scheduling set of the project" tooltipOptions={this.tooltipOptions}
                                        value={this.state.schedulingUnit.scheduling_set_id} 
                                        options={this.state.schedulingSets} 
                                        onChange={(e) => {this.setSchedUnitParams('scheduling_set_id',e.value)}} 
                                        placeholder="Select Scheduling Set" />
                                <label className={this.state.errors.scheduling_set_id ?"error":"info"}>
                                    {this.state.errors.scheduling_set_id ? this.state.errors.scheduling_set_id : "Scheduling Set of the Project"}
                                </label>
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="observStrategy" className="col-lg-2 col-md-2 col-sm-12">Observation Strategy <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12" data-testid="observStrategy" >
                                <Dropdown inputId="observStrategy" optionLabel="name" optionValue="id" 
                                        tooltip="Observation Strategy Template to be used to create the Scheduling Unit and Tasks" tooltipOptions={this.tooltipOptions}
                                        value={this.state.observStrategy.id} 
                                        options={this.observStrategies} 
                                        onChange={(e) => {this.changeStrategy(e.value)}} 
                                        placeholder="Select Strategy" />
                            </div>
                          <div className="col-lg-1 col-md-1 col-sm-12"></div>
                                    <label htmlFor="schedulingConstraintsTemp" className="col-lg-2 col-md-2 col-sm-12">Scheduling Constraints Template</label>
                                    <div className="col-lg-3 col-md-3 col-sm-12" data-testid="schedulingConstraintsTemp">
                                        <Dropdown inputId="schedulingConstraintsTemp" optionLabel="name" optionValue="id" 
                                                tooltip="Scheduling Constraints Template to add scheduling constraints to a scheduling unit" tooltipOptions={this.tooltipOptions}
                                                value={this.state.schedulingUnit.scheduling_constraints_template_id}
                                                disabled
                                                options={this.constraintTemplates} 
                                                //onChange={(e) => { this.constraintStrategy(e);}}
                                                placeholder="Select Constraints Template"/>
                                  
                            </div> 
                        </div>
                        
                    </div>
                    <div className="p-fluid">
                        <div className="p-grid">
                            <div className="p-col-12">
                                {this.state.paramsSchema?jeditor:""}
                            </div>
                        </div>
                    </div>
                    {this.state.constraintSchema && <div className="p-fluid">
                        <div className="p-grid">
                            <div className="p-col-12">
                                {React.createElement(Jeditor, {
                                    title: "Scheduling Constraints specification",
                                    schema: this.state.constraintSchema.schema,
                                    callback: this.setEditorOutputCosntarint,
                                 })}
                            </div>
                        </div>
                    </div>}
                    
                    <div className="p-grid p-justify-start">
                        <div className="p-col-1">
                            <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.saveSchedulingUnit} 
                                    disabled={!this.state.validEditor || !this.state.validForm} data-testid="save-btn" />
                        </div>
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.cancelCreate}  />
                        </div>
                    </div>
                </div>
                    
                </>
                }

                {/* Dialog component to show messages and get input */}
                <div className="p-grid" data-testid="confirm_dialog">
                    <Dialog header={this.state.dialog.header} visible={this.state.dialogVisible} style={{width: '25vw'}} inputId="confirm_dialog"
                            modal={true}  onHide={() => {this.setState({dialogVisible: false})}} 
                            footer={<div>
                                <Button key="back" onClick={() => {this.setState({dialogVisible: false, redirect: `/schedulingunit/view/draft/${this.state.schedulingUnit.id}`});}} label="No" />
                                <Button key="submit" type="primary" onClick={this.reset} label="Yes" />
                                </div>
                            } >
                            <div className="p-grid">
                                <div className="col-lg-2 col-md-2 col-sm-2" style={{margin: 'auto'}}>
                                    <i className="pi pi-check-circle pi-large pi-success"></i>
                                </div>
                                <div className="col-lg-10 col-md-10 col-sm-10">
                                    {this.state.dialog.detail}
                                </div>
                            </div>
                    </Dialog>
                </div>
            </React.Fragment>
        );
    }
}

export default SchedulingUnitCreate;