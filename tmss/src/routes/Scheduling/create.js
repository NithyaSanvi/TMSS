import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import _ from 'lodash';
import $RefParser from "@apidevtools/json-schema-ref-parser";
import moment from 'moment';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/components/dialog/Dialog';
import { Growl } from 'primereact/components/growl/Growl';
import AppLoader from '../../layout/components/AppLoader';
import Jeditor from '../../components/JSONEditor/JEditor';
import UnitConversion from '../../utils/unit.converter';

import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import TaskService from '../../services/task.service';
import UIConstants from '../../utils/ui.constants';
import PageHeader from '../../layout/components/PageHeader';
import SchedulingConstraint from './Scheduling.Constraints';
import Stations from './Stations';
import { CustomDialog } from '../../layout/components/CustomDialog';
import SchedulingSet from './schedulingset.create';
import UtilService from '../../services/util.service';

/**
 * Component to create a new SchedulingUnit from Observation strategy template
 */
export class SchedulingUnitCreate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedProject: {},
            showAddSet: false,
            showDialog: false,
            isDirty: false,
            isLoading: true,                        // Flag for loading spinner
            dialog: { header: '', detail: ''},      // Dialog properties
            touched: {},
            redirect: null,                         // URL to redirect
            errors: [],                             // Form Validation errors
            schedulingSets: [],                     // Scheduling set of the selected project
            missing_StationFieldsErrors: [],         // Validation for max no.of missing station
            stationOptions: [],
            stationGroup: [],
            customSelectedStations: [],             // custom stations
            schedulingUnit: {                
                name: '',
                description: '',
                project: (props.match?props.match.params.project:null) || null,
            },
            projectDisabled: (props.match?(props.match.params.project? true:false):false),      // Disable project selection if 
            observStrategy: {},                     // Selected strategy to create SU
            paramsSchema: null,                     // JSON Schema to be generated from strategy template to pass to JSOn editor
            constraintSchema:null,                  
            validEditor: false,                     // For JSON editor validation
            validFields: {},                        // For Form Validation
        };
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
        this.setConstraintsEditorOutput = this.setConstraintsEditorOutput.bind(this);
        this.setConstraintEditorFun = this.setConstraintEditorFun.bind(this);
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
        this.refreshSchedulingSet = this.refreshSchedulingSet.bind(this);
        this.checkIsDirty = this.checkIsDirty.bind(this);
        this.close = this.close.bind(this);
    }

    componentDidMount() {
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingSets(),
                            ScheduleService.getObservationStrategies(),
                            TaskService.getTaskTemplates(),
                            ScheduleService.getSchedulingConstraintTemplates(),
                            ScheduleService.getStationGroup()]
        Promise.all(promises).then(responses => {
            this.projects = responses[0];
            this.schedulingSets = responses[1];
            this.observStrategies = responses[2];
            this.taskTemplates = responses[3];
            this.constraintTemplates = responses[4];
            this.stations = responses[5];
            //  Setting first value as constraint template
             this.constraintStrategy(this.constraintTemplates[0]);
            if (this.state.schedulingUnit.project) {
                const selectedProject = _.filter(this.projects, {'name': this.state.schedulingUnit.project});
                const projectSchedSets = _.filter(this.schedulingSets, {'project_id': this.state.schedulingUnit.project});
                this.setState({isLoading: false, schedulingSets: projectSchedSets,selectedProject:selectedProject});
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
        schedulingUnit.scheduling_set_id = null;
        const selectedProject = _.filter(this.projects, {'name': projectName});
        this.setState({selectedProject: selectedProject, schedulingUnit: schedulingUnit, schedulingSets: projectSchedSets, validForm: this.validateForm('project'), isDirty: true});
    }
    
    /**
     * Function called when observation strategy template is changed. 
     * It generates the JSON schema for JSON editor and defult vales for the parameters to be captured
     * @param {number} strategyId 
     */
    async changeStrategy (strategyId) {
        const observStrategy = _.find(this.observStrategies, {'id': strategyId});
        let station_group = [];
        const tasks = observStrategy.template.tasks;    
        let paramsOutput = {};
        let schema = { type: 'object', additionalProperties: false, 
                        properties: {}, definitions:{}
                     };
                     
            // TODo: This schema reference resolving code has to be moved to common file and needs to rework
            for (const taskName of _.keys(tasks)) {
            const task = tasks[taskName];
            //Resolve task from the strategy template
            const $taskRefs = await $RefParser.resolve(task);

            // Identify the task specification template of every task in the strategy template
            const taskTemplate = _.find(this.taskTemplates, {'name': task['specifications_template']});
            schema['$id'] = taskTemplate.schema['$id'];
            schema['$schema'] = taskTemplate.schema['$schema'];
            if (taskTemplate.type_value==='observation' && task.specifications_doc.station_groups) {
                station_group = task.specifications_doc.station_groups;
            }
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
                        if (tempProperty['$ref']) {
                            tempProperty = await UtilService.resolveSchema(tempProperty);
                            if (tempProperty.definitions && tempProperty.definitions[taskPaths[4]]) {
                                schema.definitions = {...schema.definitions, ...tempProperty.definitions};
                                tempProperty = tempProperty.definitions[taskPaths[4]];
                            }   else if (tempProperty.properties && tempProperty.properties[taskPaths[4]]) {
                                tempProperty = tempProperty.properties[taskPaths[4]];
                            }
                        }
                        if (tempProperty.type === 'array' && taskPaths.length>6) {
                            tempProperty = tempProperty.items.properties[taskPaths[6]];
                        }
                        property = tempProperty;
                    }
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
        this.setState({observStrategy: observStrategy, paramsSchema: schema, paramsOutput: paramsOutput, stationGroup: station_group, isDirty: true});

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

    setConstraintsEditorOutput(jsonOutput, errors) {
        let err = [ ...errors ];
        if (jsonOutput.scheduler === 'online' || jsonOutput.scheduler === 'dynamic') {
            err = err.filter(e => e.path !== 'root.time.at');
        }
       // this.constraintParamsOutput = jsonOutput;
        // condition goes here..
        this.constraintValidEditor = err.length === 0;
        if  ( !this.state.isDirty && this.state.constraintParamsOutput && !_.isEqual(this.state.constraintParamsOutput, jsonOutput) ) {
            this.setState({ constraintParamsOutput: jsonOutput, constraintValidEditor: err.length === 0, validForm: this.validateForm(), isDirty: true});
        }   else {
            this.setState({ constraintParamsOutput: jsonOutput, constraintValidEditor: err.length === 0, validForm: this.validateForm()});
        }
    }

    /**
     * This function is mainly added for Unit Tests. If this function is removed Unit Tests will fail.
     */
    validateEditor() {
        return this.validEditor && this.constraintValidEditor ? true : false;
    }
    
    /**
     * Function to set form values to the SU object
     * @param {string} key 
     * @param {object} value 
     */
    async setSchedUnitParams(key, value) {
        this.setState({ 
            touched: { 
                ...this.state.touched,
                [key]: true
            }
        });
        let schedulingUnit = _.cloneDeep(this.state.schedulingUnit);
        schedulingUnit[key] = value;
        if  ( !this.state.isDirty && !_.isEqual(this.state.schedulingUnit, schedulingUnit) ) {
            await this.setState({schedulingUnit: schedulingUnit});
            this.setState({validForm: this.validateForm(key), validEditor: this.validateEditor(), isDirty: true});
        }   else {
            await this.setState({schedulingUnit: schedulingUnit});
            this.setState({validForm: this.validateForm(key), validEditor: this.validateEditor()});
        }
        this.validateEditor();
    }

    /**
     * JEditor's function that to be called when parent wants to trigger change in the JSON Editor
     * @param {Function} editorFunction 
     */
    setEditorFunction(editorFunction) {
        this.setState({editorFunction: editorFunction});
    }

    setConstraintEditorFun(editorFunction) {
        this.setState({constraintEditorFunction: editorFunction});
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
        return validForm && !this.state.missingStationFieldsErrors;
    }
    
    /**
     * Function to create Scheduling unit
     */
    async saveSchedulingUnit() {
        const constStrategy = _.cloneDeep(this.state.constraintParamsOutput);
        for (let type in constStrategy.time) {
            if (constStrategy.scheduler === 'online' || constStrategy.scheduler === 'dynamic') {
                delete constStrategy.time.at;
            }
            if (!constStrategy.time.after) {
                delete constStrategy.time.after;
            }
            if (!constStrategy.time.before) {
                delete constStrategy.time.before;
             }
            if (constStrategy.time[type] && constStrategy.time[type].length) {
                if (typeof constStrategy.time[type] === 'string') {
                    constStrategy.time[type] = `${moment(constStrategy.time[type]).format("YYYY-MM-DDTHH:mm:ss.SSSSS", { trim: false })}Z`;
                } else {
                    constStrategy.time[type].forEach(time => {
                        for (let key in time) {
                            time[key] = `${moment(time[key] ).format("YYYY-MM-DDTHH:mm:ss.SSSSS", { trim: false })}Z`;
                        }
                   })
                }
            }
        }
       //station
        const station_groups = [];
        (this.state.selectedStations || []).forEach(key => {
            let station_group = {};
            const stations = this.state[key] ? this.state[key].stations : [];
            const max_nr_missing = parseInt(this.state[key] ? (this.state[key].missing_StationFields || 0) : 0);
            station_group = {
                stations,
                max_nr_missing
            };  
            station_groups.push(station_group);                 
        });

        this.state.customSelectedStations.forEach(station => {
            station_groups.push({
                stations: station.stations,
                max_nr_missing:parseInt(station.max_nr_missing)
            });
        });

        if (!station_groups.length) {
            this.growl.show({severity: 'error', summary: 'Select Stations', detail: 'Please specify station groups.'});
            return;
        }
        
        UnitConversion.degreeToRadians(constStrategy.sky);
            
        let observStrategy = _.cloneDeep(this.state.observStrategy);
        const $refs = await $RefParser.resolve(observStrategy.template);
        observStrategy.template.parameters.forEach(async(param, index) => {
            $refs.set(observStrategy.template.parameters[index]['refs'][0], this.state.paramsOutput['param_' + index]);
        });
        for (const taskName in observStrategy.template.tasks) {
            let task = observStrategy.template.tasks[taskName];
            task.specifications_doc.station_groups = station_groups;
        }
        const const_strategy = {scheduling_constraints_doc: constStrategy, id: this.constraintTemplates[0].id, constraint: this.constraintTemplates[0]};
        const schedulingUnit = await ScheduleService.saveSUDraftFromObservStrategy(observStrategy, this.state.schedulingUnit, const_strategy, station_groups);
        if (!schedulingUnit.error) {
            // this.growl.show({severity: 'success', summary: 'Success', detail: 'Scheduling Unit and tasks created successfully!'});
            const dialog = {header: 'Success', detail: 'Scheduling Unit and Tasks are created successfully. Do you want to create another Scheduling Unit?'};
            this.setState({schedulingUnit: schedulingUnit, dialogVisible: true, dialog: dialog, isDirty: false});
        }   else {
            this.growl.show({severity: 'error', summary: 'Error Occured', detail: schedulingUnit.message || 'Unable to save Scheduling Unit/Tasks'});
        }
    }

    /**
     * warn before cancel the page if any changes detected 
     */
    checkIsDirty() {
        if( this.state.isDirty ){
            this.setState({showDialog: true});
        } else {
            this.cancelCreate();
        }
    }
    
    close() {
        this.setState({showDialog: false});
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
            isDirty: false,
            dialog: { header: '', detail: ''},      
            errors: [],
            schedulingSets: this.props.match.params.project?schedulingSets:[],
            schedulingUnit: {
                name: '',
                description: '',
                project: this.props.match.params.project || null,
                scheduling_constraints_template_id: this.constraintTemplates[0].id,
             },
            projectDisabled: (this.props.match.params.project? true:false),
            observStrategy: {},
            paramsOutput: null,
            validEditor: false,
            validFields: {},
            constraintSchema: null,
            selectedStations: null,
            touched:false,
            stationGroup: []
           }, () => {
            this.constraintStrategy(this.constraintTemplates[0]);
        });
       
        this.state.editorFunction();
      
    }

    onUpdateStations = (state, selectedStations, missing_StationFieldsErrors, customSelectedStations) => {
        const selectedStation = this.state.selectedStations;
        const customStation = this.state.customSelectedStations;
        if  ( !this.state.isDirty ) {
            if (selectedStation && !_.isEqual(selectedStation, selectedStations)){
                this.setState({...state, selectedStations, missing_StationFieldsErrors, customSelectedStations }, () => {
                    this.setState({ validForm: this.validateForm(), isDirty: true });
                });
            }   else if (customStation && !_.isEqual(customStation, customSelectedStations)){
                this.setState({...state, selectedStations, missing_StationFieldsErrors, customSelectedStations }, () => {
                    this.setState({ validForm: this.validateForm(), isDirty: true });
                });
            }   else {
                this.setState({...state, selectedStations, missing_StationFieldsErrors, customSelectedStations }, () => {
                    this.setState({ validForm: this.validateForm() });
                });
            }
        }   else {
            this.setState({...state, selectedStations, missing_StationFieldsErrors, customSelectedStations }, () => {
                this.setState({ validForm: this.validateForm() });
            });
        }
    };

    async refreshSchedulingSet(){
        this.schedulingSets = await ScheduleService.getSchedulingSets();
        const filteredSchedluingSets = _.filter(this.schedulingSets, {'project_id': this.state.schedulingUnit.project});
        this.setState({saveDialogVisible: false, showAddSet: false, schedulingSets: filteredSchedluingSets});
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
                           actions={[{icon: 'fa-window-close', title:'Click to close Scheduling Unit creation',
                           type: 'button',  actOn: 'click', props:{ callback: this.checkIsDirty }}]}/>
                { this.state.isLoading ? <AppLoader /> :
                <>
                 <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="schedUnitName" className="col-lg-2 col-md-2 col-sm-12">Name <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <InputText className={(this.state.errors.name && this.state.touched.name) ?'input-error':''} id="schedUnitName" data-testid="name" 
                                            tooltip="Enter name of the Scheduling Unit" tooltipOptions={this.tooltipOptions} maxLength="128"
                                            ref={input => {this.nameInput = input;}}
                                            value={this.state.schedulingUnit.name} autoFocus
                                            onChange={(e) => this.setSchedUnitParams('name', e.target.value)}
                                            onBlur={(e) => this.setSchedUnitParams('name', e.target.value)}/>
                                <label className={(this.state.errors.name && this.state.touched.name)?"error":"info"}>
                                    {this.state.errors.name && this.state.touched.name ? this.state.errors.name : "Max 128 characters"}
                                </label>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="description" className="col-lg-2 col-md-2 col-sm-12">Description <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <InputTextarea className={(this.state.errors.description && this.state.touched.description) ?'input-error':''} rows={3} cols={30} 
                                            tooltip="Longer description of the scheduling unit" tooltipOptions={this.tooltipOptions} maxLength="128"
                                            data-testid="description" value={this.state.schedulingUnit.description} 
                                            onChange={(e) => this.setSchedUnitParams('description', e.target.value)}
                                            onBlur={(e) => this.setSchedUnitParams('description', e.target.value)}/>
                                <label className={(this.state.errors.description && this.state.touched.description) ?"error":"info"}>
                                    {(this.state.errors.description && this.state.touched.description) ? this.state.errors.description : "Max 255 characters"}
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
                                <label className={(this.state.errors.project && this.state.touched.project) ?"error":"info"}>
                                    {(this.state.errors.project && this.state.touched.project) ? this.state.errors.project : "Select Project to get Scheduling Sets"}
                                </label>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="schedSet" className="col-lg-2 col-md-2 col-sm-12">Scheduling Set <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-10">
                                <Dropdown data-testid="schedSet" id="schedSet" optionLabel="name" optionValue="id" 
                                        tooltip="Scheduling set of the project" tooltipOptions={this.tooltipOptions}
                                        value={this.state.schedulingUnit.scheduling_set_id} 
                                        options={this.state.schedulingSets} 
                                        onChange={(e) => {this.setSchedUnitParams('scheduling_set_id',e.value)}} 
                                        placeholder="Select Scheduling Set" />
                                <label className={(this.state.errors.scheduling_set_id && this.state.touched.scheduling_set_id) ?"error":"info"}>
                                    {(this.state.errors.scheduling_set_id && this.state.touched.scheduling_set_id) ? this.state.errors.scheduling_set_id : "Scheduling Set of the Project"}
                                </label>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-2">
                                <Button label="" className="p-button-primary" icon="pi pi-plus" 
                                        onClick={() => {this.setState({showAddSet: true})}}  
                                        tooltip="Add new Scheduling Set"
                                        style={{marginLeft: '-10px'}}
                                        disabled={this.state.schedulingUnit.project !== null ? false : true }/>

                                
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
                            <label htmlFor="schedulingConstraintsTemp" className="col-lg-2 col-md-2 col-sm-12 hide">Scheduling Constraints Template</label>
                            <div className="col-lg-3 col-md-3 col-sm-12 hide" data-testid="schedulingConstraintsTemp">
                                <Dropdown inputId="schedulingConstraintsTemp" optionLabel="name" optionValue="id" 
                                        tooltip="Scheduling Constraints Template to add scheduling constraints to a scheduling unit" tooltipOptions={this.tooltipOptions}
                                        value={this.state.schedulingUnit.scheduling_constraints_template_id}
                                        disabled
                                        options={this.constraintTemplates} 
                                        //onChange={(e) => { this.constraintStrategy(e);}}
                                        placeholder="Select Constraints Template"/>
                            
                            </div> 
                        </div>
                        <Stations
                            stationGroup={this.state.stationGroup}
                            onUpdateStations={this.onUpdateStations.bind(this)}
                            height={'auto'}
                        />
                       </div>
                    {this.state.constraintSchema && <div className="p-fluid">
                        <div className="p-grid">
                            <div className="p-col-12">
                            <SchedulingConstraint constraintTemplate={this.state.constraintSchema} callback={this.setConstraintsEditorOutput} parentFunction={this.setConstraintEditorFun}/>
                            </div>
                        </div>
                    </div>}
                    <div className="p-fluid">
                        <div className="p-grid">
                            <div className="p-col-12">
                                {this.state.paramsSchema?jeditor:""}
                            </div>
                        </div>
                    </div>
                    
                    
                    <div className="p-grid p-justify-start">
                        <div className="p-col-1">
                            <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.saveSchedulingUnit} 
                                      disabled={!this.state.constraintValidEditor || !this.state.validEditor || !this.state.validForm} data-testid="save-btn" />
                        </div>
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.checkIsDirty}  />
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

                    <CustomDialog type="success" visible={this.state.showAddSet} width="40vw"
                    header={'Add Scheduling Set???'} message= {<SchedulingSet project={this.state.selectedProject[0]} onCancel={this.refreshSchedulingSet} />} showIcon={false} actions={this.actions}
                    content={''} onClose={this.refreshSchedulingSet} onCancel={this.refreshSchedulingSet} onSubmit={this.refreshSchedulingSet}
                    showAction={true}>
                </CustomDialog>
                <CustomDialog type="confirmation" visible={this.state.showDialog} width="40vw"
                    header={'Add Scheduling Unit'} message={'Do you want to leave this page? Your changes may not be saved.'} 
                    content={''} onClose={this.close} onCancel={this.close} onSubmit={this.cancelCreate}>
                </CustomDialog>
                </div>
            </React.Fragment>
        );
    }
}

export default SchedulingUnitCreate;