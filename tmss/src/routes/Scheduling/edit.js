import React, {Component} from 'react';
import { Redirect } from 'react-router-dom';
import moment from 'moment';
import _ from 'lodash';
import $RefParser from "@apidevtools/json-schema-ref-parser";

import {InputText} from 'primereact/inputtext';
import {InputTextarea} from 'primereact/inputtextarea';
import {Dropdown} from 'primereact/dropdown';
import { Button } from 'primereact/button';
import {Growl} from 'primereact/components/growl/Growl';
import {MultiSelect} from 'primereact/multiselect';
import { OverlayPanel } from 'primereact/overlaypanel';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import Jeditor from '../../components/JSONEditor/JEditor';
import UnitConversion from '../../utils/unit.converter';

import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import TaskService from '../../services/task.service';
import UIConstants from '../../utils/ui.constants';
import SchedulingConstraint from './Scheduling.Constraints';

/**
 * Compoenent to edit scheduling unit draft
 */
export class EditSchedulingUnit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,                        //Flag for loading spinner                     
            dialog: { header: '', detail: ''},      //Dialog properties
            redirect: null,                         //URL to redirect
            errors: [],                             //Form Validation errors
            schedulingSets: [],                     // Scheduling set of the selected project
            schedulingUnit: {},
            projectDisabled: (props.match?(props.match.params.project? true:false):false),      
            observStrategy: {},                     // Selected strategy to create SU
            paramsSchema: null,                     // JSON Schema to be generated from strategy template to pass to JSOn editor
            constraintSchema:null,                     
            validEditor: false,                     // For JSON editor validation
            validFields: {},                        // For Form Validation 
            observStrategyVisible: false,
            Custom: {
                stations: []
            },
            selectedStations: [],
            stationOptions: [],
            customStations: [],
            customSelectedStations: [],
            stations: [],
            noOfMissingFields: {},
            missingFieldsErrors: []                   
        }
        this.projects = [];                         // All projects to load project dropdown
        this.schedulingSets = [];                   // All scheduling sets to be filtered for project
        this.observStrategies = [];                 // All Observing strategy templates
        this.taskTemplates = [];                    // All task templates to be filtered based on tasks in selected strategy template             
        this.schedulingSets = [];                   
        this.observStrategies = [];
        this.taskTemplates = [];                    
        this.constraintTemplates = [];
        this.tooltipOptions = UIConstants.tooltipOptions;
        this.nameInput = React.createRef();         // Ref to Name field for auto focus
        this.formRules = {                          // Form validation rules                  
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
        };
 
        this.setEditorOutput = this.setEditorOutput.bind(this);
        this.changeStrategy = this.changeStrategy.bind(this);
        this.constraintStrategy = this.constraintStrategy.bind(this);
        this.setSchedUnitParams = this.setSchedUnitParams.bind(this);
        this.validateForm = this.validateForm.bind(this);
        this.validateEditor = this.validateEditor.bind(this);
        this.setEditorFunction = this.setEditorFunction.bind(this);
        this.saveSchedulingUnit = this.saveSchedulingUnit.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.setEditorOutputConstraint = this.setEditorOutputConstraint.bind(this);
    }

    /**
     * Function called when observation strategy template is changed. 
     * It generates the JSON schema for JSON editor and defult vales for the parameters to be captured
     * @param {number} strategyId 
     */
    async changeStrategy (strategyId) {
        this.setState({ selectedStrategyId: strategyId, stationOptions: this.stations}, 
            this.getAllStations
        );
        let tasksToUpdate = {};
        const observStrategy = _.find(this.observStrategies, {'id': strategyId});
        const tasks = observStrategy.template.tasks;    
        let paramsOutput = {};
        let schema = { type: 'object', additionalProperties: false, 
                        properties: {}, definitions:{}
                     };
        for (const taskName in tasks)  {
            const task = tasks[taskName];
            const taskDraft = this.state.taskDrafts.find(taskD => taskD.name === taskName);
            if (taskDraft) {
                task.specifications_doc = taskDraft.specifications_doc;
            }
            //Resolve task from the strategy template
            const $taskRefs = await $RefParser.resolve(task);

            // Identify the task specification template of every task in the strategy template
            const taskTemplate = _.find(this.taskTemplates, {'name': task['specifications_template']});
            schema['$id'] = taskTemplate.schema['$id'];
            schema['$schema'] = taskTemplate.schema['$schema'];
            let index = 0;
            for (const param of observStrategy.template.parameters) {
                if (param.refs[0].indexOf(`/tasks/${taskName}`) > 0) {
                    tasksToUpdate[taskName] = taskName;
                    // Resolve the identified template
                    const $templateRefs = await $RefParser.resolve(taskTemplate);
                    let property = { };
                    let tempProperty = null;
                    const taskPaths = param.refs[0].split("/");
                    // Get the property type from the template and create new property in the schema for the parameters
                    try {
                        const parameterRef = param.refs[0];//.replace(`#/tasks/${taskName}/specifications_doc`, '#/schema/properties');
                        tempProperty = $templateRefs.get(parameterRef);
                    }   catch(error) {
                        tempProperty = _.cloneDeep(taskTemplate.schema.properties[taskPaths[4]]);
                        if (tempProperty.type === 'array') {
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
        this.setState({observStrategy: observStrategy, paramsSchema: schema, paramsOutput: paramsOutput, tasksToUpdate: tasksToUpdate});

        // Function called to clear the JSON Editor fields and reload with new schema
        if (this.state.editorFunction) {
            this.state.editorFunction();
        }
    }

    componentDidMount() {
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingSets(),
                            ScheduleService.getObservationStrategies(),
                            TaskService.getTaskTemplates(),
                            ScheduleService.getSchedulingUnitDraftById(this.props.match.params.id),
                            ScheduleService.getTasksDraftBySchedulingUnitId(this.props.match.params.id),
                            ScheduleService.getSchedulingConstraintTemplates(),
                            ScheduleService.getStationGroup()
                        ];
        Promise.all(promises).then(responses => {
            this.projects = responses[0];
            this.schedulingSets = responses[1];
            this.observStrategies = responses[2];
            this.taskTemplates = responses[3];
            this.constraintTemplates = responses[6];
            this.stations = responses[7];
            responses[4].project = this.schedulingSets.find(i => i.id === responses[4].scheduling_set_id).project_id;
            this.setState({ schedulingUnit: responses[4], taskDrafts: responses[5].data.results,
                            observStrategyVisible: responses[4].observation_strategy_template_id?true:false });
            if (responses[4].observation_strategy_template_id) {
                this.changeStrategy(responses[4].observation_strategy_template_id);
            }
            if (this.state.schedulingUnit.project) {
                const projectSchedSets = _.filter(this.schedulingSets, {'project_id': this.state.schedulingUnit.project});
                this.setState({isLoading: false, schedulingSets: projectSchedSets});
            }   else {
                this.setState({isLoading: false});
            }
            this.constraintStrategy(this.constraintTemplates[0], this.state.schedulingUnit.scheduling_constraints_doc)
        }); 
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

    setEditorOutputConstraint(jsonOutput, errors) {
        let err = [ ...errors ];
        if (jsonOutput.scheduler === 'online') {
            err = err.filter(e => e.path !== 'root.time.at');
        }
        this.constraintParamsOutput = jsonOutput || {};
        this.constraintValidEditor = err.length === 0;
        this.setState({ constraintParamsOutput: jsonOutput, 
                        constraintValidEditor: err.length === 0,
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
        return validForm && !this.state.missingFieldsErrors.length;;
    }

    /**
     * Function to create Scheduling unit
     */
    async saveSchedulingUnit() {
        if (this.state.schedulingUnit.observation_strategy_template_id) {
            const constStrategy = _.cloneDeep(this.state.constraintParamsOutput);
            if (constStrategy.scheduler === 'online') {
                // For deleting property
                delete constStrategy.time.at;
             }
             if (!constStrategy.time.after) {
                delete constStrategy.time.after;
            }
            if (!constStrategy.time.before) {
                delete constStrategy.time.before;
             }
            for (let type in constStrategy.time) {
                if (constStrategy.time[type] && constStrategy.time[type].length) {
                    if (typeof constStrategy.time[type] === 'string') {
                        constStrategy.time[type] = `${moment(constStrategy.time[type]).format("YYYY-MM-DDThh:mm:ss.SSSSS", { trim: false })}Z`;
                    } else {
                        constStrategy.time[type].forEach(time => {
                            for (let key in time) {
                                time[key] = `${moment(time[key] ).format("YYYY-MM-DDThh:mm:ss.SSSSS", { trim: false })}Z`;
                            }
                            
                        })
                    }
                }
            }
           /* for (let type in constStrategy.sky.transit_offset) {
                constStrategy.sky.transit_offset[type] = constStrategy.sky.transit_offset[type] * 60;
            }*/
            UnitConversion.degreeToRadians(constStrategy.sky);
            let observStrategy = _.cloneDeep(this.state.observStrategy);
            const $refs = await $RefParser.resolve(observStrategy.template);
            observStrategy.template.parameters.forEach(async(param, index) => {
                $refs.set(observStrategy.template.parameters[index]['refs'][0], this.state.paramsOutput['param_' + index]);
            });
            const schUnit = { ...this.state.schedulingUnit };
            schUnit.scheduling_constraints_doc = constStrategy;
            const schedulingUnit = await ScheduleService.updateSUDraftFromObservStrategy(observStrategy,schUnit,this.state.taskDrafts, this.state.tasksToUpdate, this.state);
            if (schedulingUnit) {
                // this.growl.show({severity: 'success', summary: 'Success', detail: 'Scheduling Unit and tasks edited successfully!'});
                this.props.history.push({
                    pathname: `/schedulingunit/view/draft/${this.props.match.params.id}`,
                }); 
            } else {
                this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to update Scheduling Unit/Tasks'});
            } 
        }   else {
            this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Template Missing.'});
        }
    }

    setNoOfMissingFields(key, value) {
        let missingFieldsErrors = this.state.missingFieldsErrors;
        if (value > this.state[key].stations.length) {
            if (!missingFieldsErrors.includes(key)) {
                missingFieldsErrors.push(key);
            }
        } else {
            missingFieldsErrors = missingFieldsErrors.filter(i => i !== key);
        }
        this.setState({
            [key]: {
                ...this.state[key],
                missingFields: value,
                error: value > this.state[key].stations.length
            },
            missingFieldsErrors: missingFieldsErrors
        }, () => {
            this.setState({
                validForm: this.validateForm()
            });
        });
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
        const observStrategy = _.find(this.observStrategies, {'id': this.state.selectedStrategyId});
        const stationGroups = observStrategy.template.tasks['Target Observation'].specifications_doc.station_groups; 
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
            const observStrategy = _.find(this.observStrategies, {'id': this.state.selectedStrategyId});
            const stationGroups = observStrategy.template.tasks['Target Observation'].specifications_doc.station_groups;  
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

    /**
     * Cancel SU creation and redirect
     */
    cancelCreate() {
        this.props.history.goBack();
    }

    constraintStrategy(schema, initValue){
       this.setState({ constraintSchema: schema, initValue: initValue});
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
                <Growl ref={el => (this.growl = el)} />
                <PageHeader location={this.props.location} title={'Scheduling Unit - Edit'} 
                           actions={[{icon: 'fa-window-close',link: this.props.history.goBack,title:'Click to Close Scheduling Unit View', props : { pathname: `/schedulingunit/view/draft/${this.props.match.params.id}`}}]}/>
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
                            <label htmlFor="project" className="col-lg-2 col-md-2 col-sm-12">Project </label>
                            <div className="col-lg-3 col-md-3 col-sm-12" data-testid="project" >
                                <Dropdown inputId="project" optionLabel="name" optionValue="name" 
                                        tooltip="Project" tooltipOptions={this.tooltipOptions}
                                        value={this.state.schedulingUnit.project} disabled={this.state.schedulingUnit.project?true:false}
                                        options={this.projects} 
                                        placeholder="Select Project" />
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="schedSet" className="col-lg-2 col-md-2 col-sm-12">Scheduling Set </label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <Dropdown data-testid="schedSet" id="schedSet" optionLabel="name" optionValue="id" 
                                        tooltip="Scheduling set of the project" tooltipOptions={this.tooltipOptions}
                                        value={this.state.schedulingUnit.scheduling_set_id} 
                                        options={this.state.schedulingSets} 
                                        disabled={this.state.schedulingUnit.scheduling_set_id?true:false}
                                        placeholder="Select Scheduling Set" />
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            { this.state.observStrategyVisible && 
                                <>
                                    <label htmlFor="observStrategy" className="col-lg-2 col-md-2 col-sm-12">Observation Strategy </label>
                                    <div className="col-lg-3 col-md-3 col-sm-12" data-testid="observStrategy" >
                                        <Dropdown inputId="observStrategy" optionLabel="name" optionValue="id" 
                                                tooltip="Observation Strategy Template to be used to create the Scheduling Unit and Tasks" tooltipOptions={this.tooltipOptions}
                                                value={this.state.schedulingUnit.observation_strategy_template_id} 
                                                disabled={this.state.schedulingUnit.observation_strategy_template_id?true:false} 
                                                options={this.observStrategies} 
                                                onChange={(e) => {this.changeStrategy(e)}} 
                                                placeholder="Select Strategy" />
                                    </div>
                                </>
                            }
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
                    </div>

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

                    {this.state.constraintSchema && <div className="p-fluid">
                        <div className="p-grid">
                            <div className="p-col-12">
                                <SchedulingConstraint initValue={this.state.initValue} constraintTemplate={this.state.constraintSchema} callback={this.setEditorOutputConstraint} />
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
                                    disabled={!this.state.validEditor || !this.state.validForm} data-testid="save-btn" />
                        </div>
                        <div className="p-col-1">
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.cancelCreate}  />
                        </div>
                    </div>
                </div>
                    
                </>
                }

            </React.Fragment>
        );
    }
}
export default EditSchedulingUnit
