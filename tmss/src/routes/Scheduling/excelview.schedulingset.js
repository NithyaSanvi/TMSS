import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'; 
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Growl } from 'primereact/components/growl/Growl';
import { Checkbox } from 'primereact/checkbox';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import TimeInputmask from '../../components/Spreadsheet/TimeInputmask'
import DegreeInputmask from '../../components/Spreadsheet/DegreeInputmask'
import NumericEditor from '../../components/Spreadsheet/numericEditor';
import BetweenEditor from '../../components/Spreadsheet/BetweenEditor'; 
import BetweenRenderer from '../../components/Spreadsheet/BetweenRenderer';
import BeamformersRenderer from '../../components/Spreadsheet/BeamformerRenderer';
import MultiSelector from '../../components/Spreadsheet/MultiSelector';
import CustomDateComp from '../../components/Spreadsheet/CustomDateComp';
import StationEditor from '../../components/Spreadsheet/StationEditor';
import Beamformer from '../../components/Spreadsheet/Beamformer';
import { CustomPageSpinner } from '../../components/CustomPageSpinner';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import { CustomDialog } from '../../layout/components/CustomDialog';
import SchedulingSet from './schedulingset.create';  

import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import TaskService from '../../services/task.service';
import UtilService from '../../services/util.service';

import Validator from  '../../utils/validator';
import UnitConverter from '../../utils/unit.converter'
import UIConstants from '../../utils/ui.constants';

import moment from 'moment';
import _ from 'lodash';
import $RefParser from "@apidevtools/json-schema-ref-parser";

import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModules } from '@ag-grid-community/all-modules';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

const BG_COLOR = '#f878788f';
/**
 * Component to create / update Scheduling Unit Drafts using Spreadsheet
 */
export class SchedulingSetCreate extends Component {
    constructor(props) {
        super(props);
        this.state= {
            redirect: null,
            errors: [],
            validFields: {},
            observStrategy: {},
            selectedProject: {},
            copyHeader: false,                    // Copy Table Header to clipboard
            applyEmptyValue: false,
            dailyOption: [],
            projectDisabled: (props.match?(props.match.params.project? true:false):false),
            isLoading: true, 
            isAGLoading: false,                       // Flag for loading spinner
            dialog: { header: '', detail: ''},      // Dialog properties
            clipboard: [],   
            totalCount: 0,
            validEditor: false,
            noOfSU: 10,
            defaultCellValues: {},
            showDefault: false,
            confirmDialogVisible: false,
            isDirty: false,
            schedulingUnit: {                
                name: '',
                description: '',
                project: (props.match?props.match.params.project:null) || null,
            },
            columnMap: [],
            columnDefs: [],
            columnTypes: {
                numberValueColumn: {
                    editable: true,
                    valueParser: function numberParser(params) {
                        return Number(params.newValue);
                    },
                }
            },
            defaultColDef: {
                editable: true, flex: 1, sortable: true, minWidth: 100, resizable: true,
            },
            rowSelection: 'multiple',
            context: { componentParent: this },
            modules: AllCommunityModules,
            frameworkComponents: {
                numericEditor: NumericEditor,
                timeInputMask: TimeInputmask,
                degreeInputMask: DegreeInputmask,
                betweenRenderer: BetweenRenderer,
                betweenEditor: BetweenEditor,
                multiselector: MultiSelector,
                agDateInput: CustomDateComp,
                station: StationEditor,
                beamformer: Beamformer,
                beamformersRenderer: BeamformersRenderer,
            },
            components: {
                rowIdRenderer: function (params) {
                    return 1 + params.rowIndex;
                },
                validCount: 0,
                inValidCount: 0,
            },
            noOfSUOptions: [
                { label: '10', value: '10' },
                { label: '50', value: '50' },
                { label: '100', value: '100' },
                { label: '250', value: '250' },
                { label: '500', value: '500' }
                ],
            customSelectedStations: [],
            selectedStations: [],
            defaultStationGroups: [],
            selectedSchedulingSetId: null,
            rowData: [],
        };

        this.gridApi = '';
        this.gridColumnApi = '';
        this.topGridApi = '';
        this.topGridColumnApi = '';
        this.rowData = [];
        this.tmpRowData = [];
        this.daily = [];
        this.dailyOption = [];
        this.isNewSet = false;
        this.constraintSchema = [];
        this.showIcon = true;
        this.fieldProperty = {};

        this.applyToAllRow = false;
        this.callBackFunction = "";
        this.onClose = this.close;
        this.onCancel =this.close;
        this.applyToEmptyRowOnly = false;

        this.dialogWidth = "40vw";
        this.dialogType = "confirmation";
        this.dialogHeight = 'auto';
        this.dialogHeader = "";
        this.dialogMsg = "";
        this.dialogContent = "";
        this.projects = [];                         // All projects to load project dropdown
        this.schedulingSets = [];                   // All scheduling sets to be filtered for project
        this.observStrategies = [];                 // All Observing strategy templates
        this.taskTemplates = [];                    // All task templates to be filtered based on tasks in selected strategy template
        this.constraintTemplates = [];
        this.agSUWithDefaultValue = {'id': 0, 'suname': '', 'sudesc': ''};
        this.emptyAGSU = {};

        this.onProjectChange =  this.onProjectChange.bind(this);
        this.setSchedulingSetParams = this.setSchedulingSetParams.bind(this);
        this.onStrategyChange = this.onStrategyChange.bind(this);
        this.setNoOfSUint = this.setNoOfSUint.bind(this);
        this.showAddSchedulingSet = this.showAddSchedulingSet.bind(this);
        this.isNotEmpty = this.isNotEmpty.bind(this);
        this.onGridReady = this.onGridReady.bind(this);
        this.onTopGridReady = this.onTopGridReady.bind(this);
        this.saveSchedulingUnit = this.saveSchedulingUnit.bind(this);
        this.validateGridAndSave = this.validateGridAndSave.bind(this);
        this.showDialogContent = this.showDialogContent.bind(this);
        this.saveSU = this.saveSU.bind(this);
        this.reset = this.reset.bind(this);
        this.refreshSchedulingSet = this.refreshSchedulingSet.bind(this);
        this.close = this.close.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.checkIsDirty = this.checkIsDirty.bind(this);
        this.cellValueChageEvent = this.cellValueChageEvent.bind(this);
        this.showWarning = this.showWarning.bind(this);
        this.copyHeader = this.copyHeader.bind(this);
        this.copyOnlyHeader = this.copyOnlyHeader.bind(this);
        this.clipboardEvent = this.clipboardEvent.bind(this);
        this.applyToAll =  this.applyToAll.bind(this);
        this.applyToSelected =  this.applyToSelected.bind(this);
        this.applyToEmptyRows =  this.applyToEmptyRows.bind(this);
        this.resetCommonData = this.resetCommonData.bind(this);
        this.reload = this.reload.bind(this);
        this.applyChanges =  this.applyChanges.bind(this);
        this.getSchedulingDialogContent = this.getSchedulingDialogContent.bind(this);
        //this.setCurrentSUSet = this.setCurrentSUSet.bind(this);

        this.formRules = {                          // Form validation rules
            project: {required: true, message: "Select project to get Scheduling Sets"},
            scheduling_set_id: {required: true, message: "Select the Scheduling Set"},
        };
    }
    
    async onTopGridReady (params) {
        await this.setState({
            topGridApi:params.api,
            topGridColumnApi:params.columnApi,
        })
        this.state.topGridApi.hideOverlay();
    }

    async onGridReady (params) { 
        await this.setState({
            gridApi:params.api,
            gridColumnApi:params.columnApi,
        })
        this.state.gridApi.hideOverlay();
    }

    /**
     * Check is empty string 
     * @param {*} value 
     */
     isNotEmpty(value){
        if ( value === null || value === undefined || value.length === 0 ){
            return false;
        } else {
            return true;
        }
    }

    
    /**
     * Trigger when the project drop down get changed and check isDirty
     * @param {*} projectName 
     */
     onProjectChange(projectName) {
        if (this.state.isDirty) {
            this.showWarning(() =>{
                this. changeProject(projectName);
            });
        }   else {
            this.changeProject(projectName);
        }
    }

    /**
     * Function to call on change of project and reload scheduling set dropdown
     * @param {string} projectName 
     */
     changeProject(projectName) {
        const projectSchedluingSets = _.filter(this.schedulingSets, {'project_id': projectName});
        let schedulingUnit = this.state.schedulingUnit;
        schedulingUnit.project = projectName;
        const selectedProject = _.filter(this.projects, {'name': projectName});
        this.setState({confirmDialogVisible: false, isDirty: false, selectedProject: selectedProject, schedulingUnit: schedulingUnit, 
            schedulingSets: projectSchedluingSets, validForm: this.validateForm('project'), rowData: [],observStrategy: {}, copyHeader: false});
    }

    /**
     * Function to set form values to the SU object
     * @param {string} key 
     * @param {object} value 
     */

    async setSchedulingSetParams(key, value) {
        let schedulingUnit = this.state.schedulingUnit;
        schedulingUnit[key] = value;
        this.setState({schedulingUnit, selectedSchedulingSetId: value, copyHeader: false, confirmDialogVisible: false, isDirty: false, rowData: []});
        if(this.state.observStrategy && this.state.observStrategy.id) {
            this.onStrategyChange(this.state.observStrategy.id);
        }
    }

    /**
     * Set No. of Scheduling Unit load/show in the excel view table
     * @param {*} value 
     */
    async setNoOfSUint(value){
        this.setState({isDirty: true, isAGLoading: true});
        if  (value >= 0 && value < 501){
            await this.setState({noOfSU: value});
        }  else  {
            await this.setState({noOfSU: 500});
        }

        let noOfSU = this.state.noOfSU;
        this.tmpRowData = [];
        if (this.state.rowData && this.state.rowData.length >0 && this.state.emptyRow) {
            if (this.state.totalCount <= noOfSU) {
                for (var count = 0; count < noOfSU; count++) {
                    if(this.state.rowData.length > count ) {
                        this.tmpRowData.push(_.cloneDeep(this.state.rowData[count]));
                    }   else {
                        this.tmpRowData.push(_.cloneDeep(this.state.agSUWithDefaultValue));
                    }
                }
                this.setState({
                    rowData: this.tmpRowData,
                    noOfSU: noOfSU,
                    isAGLoading: false
                });
            } else {
                this.setState({
                    isAGLoading: false
                })
            }
        } else {
            this.setState({
                isAGLoading: false
            });
        }
    }

    /**
     * Dialog to add Scheduling Set
     */
    showAddSchedulingSet() {
        this.dialogType = "success";
        this.dialogHeader = "Add Scheduling Set’";
        this.dialogMsg = <SchedulingSet project={this.state.selectedProject[0]} onCancel={this.refreshSchedulingSet} />;
        this.dialogContent = "";
        this.showIcon = false;
        this.callBackFunction = this.refreshSchedulingSet;
        this.onClose = this.refreshSchedulingSet;
        this.onCancel = this.refreshSchedulingSet;
        this.setState({confirmDialogVisible: true});
    }

    /**
     * Update isDirty when cell value updated in AG grid
     * @param {*} params 
     */
     cellValueChageEvent(params) {
        if( params.value && !_.isEqual(params.value, params.oldValue)) {
            this.setState({isDirty: true});
        }
    }

    /**
     * If any changes detected warn before cancel the page  
     */
    checkIsDirty() {
        if( this.state.isDirty ){
            this.showIcon = true;
            this.dialogType = "confirmation";
            this.dialogHeader = "Add Multiple Scheduling Unit(s)";
            this.dialogMsg = "Do you want to leave this page? Your changes may not be saved.";
            this.dialogContent = "";
            this.dialogHeight = '5em';
            this.callBackFunction = this.cancelCreate;
            this.onClose = this.close;
            this.onCancel = this.close;
            this.setState({confirmDialogVisible: true});
        } else {
            this.cancelCreate();
        }
    }

    /**
     * Set the new Set created in drop down
     */
    /*async setCurrentSUSet(id) {
        this.refreshSchedulingSet();
        if(id) {
            let currentSU = this.state.schedulingUnit;
            currentSU.scheduling_set_id = id;
            this.setState({schedulingUnit: currentSU});
        }
        
    }*/

    /** After adding new Scheduling Set, refresh the Scheduling Set list */
    async refreshSchedulingSet(){
        this.schedulingSets = await ScheduleService.getSchedulingSets();
        const filteredSchedluingSets = _.filter(this.schedulingSets, {'project_id': this.state.schedulingUnit.project});
        this.setState({saveDialogVisible: false, confirmDialogVisible: false, schedulingSets: filteredSchedluingSets});
    }

    close(){
        this.setState({confirmDialogVisible: false});
    }

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
     * This function is mainly added for Unit Tests. If this function is removed Unit Tests will fail.
     */
    validateEditor() {
        return this.validEditor?true:false;
    }

    async componentDidMount() {
        const promises = [  
            ProjectService.getProjectList(), 
            ScheduleService.getSchedulingSets(),
            ScheduleService.getObservationStrategies(),
            TaskService.getTaskTemplates(),
            ScheduleService.getSchedulingConstraintTemplates(),
        ];
        await Promise.all(promises).then(responses => {
            this.projects = responses[0];
            this.schedulingSets = responses[1];
            this.observStrategies = responses[2];
            this.taskTemplates = responses[3];
            this.constraintTemplates = responses[4];
            if (this.state.schedulingUnit.project) {
                const projectSchedluingSets = _.filter(this.schedulingSets, {'project_id': this.state.schedulingUnit.project});
                this.setState({isLoading: false, schedulingSets: projectSchedluingSets, allSchedulingSets: this.schedulingSets});
            }   else {
                this.setState({isLoading: false});
            }
        });
    }

    /**
     *  Trigger when the Strategy drop down get changed and check isDirty
     * @param {*} strategyId 
     */
    onStrategyChange(strategyId) {
        if (this.state.isDirty) {
            this.showWarning(() =>{
                this.changeStrategy(strategyId);
            });
        }   else {
            this. changeStrategy(strategyId);
        }
    } 

    /**
     * Function called when observation strategy template is changed. 
     *
     * @param {number} strategyId 
     */
   async changeStrategy(strategyId) {
        const observStrategy = _.find(this.observStrategies, {'id': strategyId});
        this.setState({observStrategy: observStrategy, noOfSU: 10, isAGLoading: true, copyHeader: false, rowData: [], agSUWithDefaultValue: {}, confirmDialogVisible: false, isDirty: false});      
        await this.getTaskSchema(observStrategy);

        if(this.state.schedulingUnit.project && this.state.schedulingUnit.scheduling_set_id) {
            this.prepareScheduleUnitListForGrid();
        }
    }

    async getTaskSchema(observStrategy) {
        let station_group = [];
        let tasksToUpdate = {};
        if(observStrategy) {
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
                
                if (taskTemplate.type_value==='observation' && task.specifications_doc.station_groups) {
                    station_group = task.specifications_doc.station_groups;
                    tasksToUpdate[taskName] = taskName;
                }
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
            await this.setState({observStrategy: observStrategy, paramsSchema: schema, paramsOutput: paramsOutput,defaultStationGroups: station_group, tasksToUpdate: tasksToUpdate});
        }
    }

    /**
     * Resolve JSON Schema
     */
    async resolveSchema(schema){
        let properties = schema.properties;
        schema.definitions = schema.definitions?schema.definitions:{};
        if (properties) {
            for (const propertyKey in properties) {
                let property = properties[propertyKey];
                if (property["$ref"] && !property["$ref"].startsWith("#")) {    // 1st level reference of the object
                    const refUrl = property["$ref"];
                    let newRef = refUrl.substring(refUrl.indexOf("#"));
                    if (refUrl.endsWith("/pointing")) {                         // For type pointing
                        schema.definitions["pointing"] = (await $RefParser.resolve(refUrl)).get(newRef);
                        property["$ref"] = newRef;
                    }  else {                   // General object to resolve if any reference in child level
                        property = await this.resolveSchema((await $RefParser.resolve(refUrl)).get(newRef));
                    }
                }   else if (property["type"] === "array") {             // reference in array items definition
                    let resolvedItems = await this.resolveSchema(property["items"]);
                    schema.definitions = {...schema.definitions, ...resolvedItems.definitions};
                    delete resolvedItems['definitions'];
                    property["items"] = resolvedItems;
                }
                properties[propertyKey] = property;
            }
        }   else if (schema["oneOf"]) {             // Reference in OneOf array
            let resolvedOneOfList = [];
            for (const oneOfProperty of schema["oneOf"]) {
                const resolvedOneOf = await this.resolveSchema(oneOfProperty);
                resolvedOneOfList.push(resolvedOneOf);
            }
            schema["oneOf"] = resolvedOneOfList;
        }   else if (schema["$ref"] && !schema["$ref"].startsWith("#")) {   //reference in oneOf list item
            const refUrl = schema["$ref"];
            let newRef = refUrl.substring(refUrl.indexOf("#"));
            if (refUrl.endsWith("/pointing")) {
                schema.definitions["pointing"] = (await $RefParser.resolve(refUrl)).get(newRef);
                schema["$ref"] = newRef;
            }   else {
                schema = await this.resolveSchema((await $RefParser.resolve(refUrl)).get(newRef));
            }
        }
        return schema;
    }
    
    /**
     * Function to prepare row data for ag-grid. 
     */
     async prepareScheduleUnitListForGrid(){
        this.agSUWithDefaultValue = {'id': 0, 'suname': '', 'sudesc': ''};
        let schedulingUnitList= await ScheduleService.getSchedulingBySet(this.state.selectedSchedulingSetId);
        schedulingUnitList = _.filter(schedulingUnitList,{'observation_strategy_template_id': this.state.observStrategy.id}) ;
        /** Get Caolumn details */
        await this.createGridCellDetails();
        let observationPropsList = [];
        this.tmpRowData = [];
        let totalSU = this.state.noOfSU;
        let lastRow = {};
        let hasSameValue = true;
        if(schedulingUnitList && schedulingUnitList.length > 0) {
            for(const scheduleunit of schedulingUnitList){
                let observationProps = {
                    id: scheduleunit.id,
                    suname: scheduleunit.name,
                    sudesc: scheduleunit.description,
                    //set default TRUE and it will reset this value while validating the row and will skip the invalid rows when save the row data 
                    isValid: true,
                };

                if (scheduleunit.observation_strategy_template_id) {
                    let parameters = await this.getObservationValueFromTask(scheduleunit);
                    let parametersName = Object.keys(parameters);
                    for(const parameter of parametersName){
                        let valueItem = parameters[parameter];
                        let excelColumns = this.state.columnMap[parameter];
                        if (excelColumns) {
                            let excelColumnsKeys =  Object.keys(excelColumns);
                            for(const eColKey of excelColumnsKeys){
                                if  (eColKey === 'angle1') {
                                    observationProps[excelColumns[eColKey]] = UnitConverter.getAngleInput(valueItem[eColKey], false);
                                }
                                else if  (eColKey === 'angle2') {
                                    observationProps[excelColumns[eColKey]] = UnitConverter.getAngleInput(valueItem[eColKey], true);
                                }
                                else {
                                    let keys = Object.keys(valueItem);
                                    if(_.includes(keys, eColKey)) {
                                        observationProps[excelColumns[eColKey]] = valueItem[eColKey];
                                    }   else {
                                        observationProps[excelColumns[eColKey]] = valueItem;
                                    }
                                }
                            }
                        }
                    }
                }   else {
                    let parameters = scheduleunit['requirements_doc'].parameters;
                    for(const parameter of parameters){
                        let refUrl = parameter['refs'];
                        let valueItem = (await $RefParser.resolve( scheduleunit['requirements_doc'])).get(refUrl[0]);
                        let excelColumns = this.state.columnMap[parameter.name];
                        if (excelColumns) {
                            let excelColumnsKeys =  Object.keys(excelColumns);
                            for(const eColKey of excelColumnsKeys){
                                if  (eColKey === 'angle1') {
                                    observationProps[excelColumns[eColKey]] = UnitConverter.getAngleInput(valueItem[eColKey], false);
                                }
                                else if  (eColKey === 'angle2') {
                                    observationProps[excelColumns[eColKey]] = UnitConverter.getAngleInput(valueItem[eColKey], true);
                                }
                                else {
                                    observationProps[excelColumns[eColKey]] = valueItem[eColKey];
                                }
                            }
                        }
                    }
                }
                // Get Station details
                observationProps['stations'] = await this.getStationGrops(scheduleunit);
                let constraint = scheduleunit.id?scheduleunit.scheduling_constraints_doc:null;
                if (constraint){
                    if  (constraint.scheduler){
                        observationProps['scheduler'] = constraint.scheduler;
                    }
                    observationProps['timeat'] = this.isNotEmpty(constraint.time.at)?moment.utc(constraint.time.at).format(UIConstants.CALENDAR_DATETIME_FORMAT): '';
                    observationProps['timeafter'] =  this.isNotEmpty(constraint.time.after)?moment.utc(constraint.time.after).format(UIConstants.CALENDAR_DATETIME_FORMAT):'';
                    observationProps['timebefore'] = this.isNotEmpty(constraint.time.before)?moment.utc(constraint.time.before).format(UIConstants.CALENDAR_DATETIME_FORMAT):'';
                    if  (constraint.time.between){
                        observationProps['between'] = this.getBetweenStringValue(constraint.time.between);
                    }
                    if  (constraint.time.between){
                        observationProps['notbetween'] = this.getBetweenStringValue(constraint.time.not_between);
                    }
                
                    observationProps['daily'] = this.fetchDailyFieldValue(constraint.daily);
                    UnitConverter.radiansToDegree(constraint.sky);
                    observationProps['min_target_elevation'] = constraint.sky.min_target_elevation;
                    observationProps['min_calibrator_elevation'] = constraint.sky.min_calibrator_elevation;
                    if  ( constraint.sky.transit_offset ){
                        observationProps['offset_from'] = constraint.sky.transit_offset.from ;//constraint.sky.transit_offset.from:'';
                        observationProps['offset_to'] = constraint.sky.transit_offset.to ; //constraint.sky.transit_offset.to:'';
                    }
                    
                    if  (constraint.sky.min_distance){
                        observationProps['md_sun'] = constraint.sky.min_distance.sun;//constraint.sky.min_distance.sun:0;
                        observationProps['md_moon'] =  constraint.sky.min_distance.moon; //constraint.sky.min_distance.moon:0;
                        observationProps['md_jupiter'] =  constraint.sky.min_distance.jupiter;//constraint.sky.min_distance.jupiter:0;
                    }
                }
                observationPropsList.push(observationProps);
                //Set values for global row if all rows has same value
                if (_.isEmpty(lastRow)) {
                    lastRow = observationProps;
                }   else if (!_.isEqual(
                        _.omit(lastRow, ['id']),
                        _.omit(observationProps, ['id'])
                    ))  {
                    hasSameValue = false;
                }
            }
        }   
        let defaultCommonRowData = {};
        if (hasSameValue) {
            defaultCommonRowData = observationPropsList[observationPropsList.length-1];
        }
        this.tmpRowData = observationPropsList;
        // find No. of rows filled in array
        let totalCount = this.tmpRowData.length;
         // Prepare No. Of SU for rows for UI
        if  (this.tmpRowData && this.tmpRowData.length > 0){
            const paramsOutputKey = Object.keys(this.tmpRowData[0]);
            let availableCount = this.tmpRowData.length;
            if(this.isNewSet) {
                availableCount = 0;
                this.tmpRowData = [];
            } 
            if  (availableCount >= totalSU){
                totalSU = availableCount+1;
            }
            for(var i = availableCount; i<totalSU; i++){
                let emptyRow =  {};
                paramsOutputKey.forEach(key =>{
                    if  (key === 'id'){
                        emptyRow[key] = 0;
                    }  else  {
                        emptyRow[key] = '';
                    }
                })
                this.tmpRowData.push(_.cloneDeep(this.agSUWithDefaultValue));//emptyRow);
            } 
        }   else {
            let availableCount = this.tmpRowData.length;
            for(var i = availableCount; i<totalSU; i++){
                this.tmpRowData.push(_.cloneDeep(this.agSUWithDefaultValue));//emptyRow);
            } 
        }
        if(this.isNewSet) {
            defaultCommonRowData = this.tmpRowData[this.tmpRowData.length-1];
        }
        this.setState({
            schedulingUnitList: schedulingUnitList,
            rowData: this.tmpRowData,
            totalCount: totalCount,
            noOfSU: this.tmpRowData.length,
            emptyRow: this.tmpRowData[this.tmpRowData.length-1],
            isAGLoading: false,
            commonRowData: [defaultCommonRowData],
            defaultCommonRowData: defaultCommonRowData,
            hasSameValue: hasSameValue
        });
        {this.state.gridApi && 
            this.state.gridApi.setRowData(this.state.rowData);
        }
    }


    /**
     * Get Station details from Scheduling Unit
     * @param {*} schedulingUnit 
     */
     async getStationGrops(schedulingUnit){
        let stationValue = '';
        if (schedulingUnit && schedulingUnit.id>0) {
            const promises = await [  
                ScheduleService.getObservationStrategies(),
                TaskService.getTaskTemplates(),
                ScheduleService.getSchedulingUnitDraftById(schedulingUnit.id),
                ScheduleService.getTasksDraftBySchedulingUnitId(schedulingUnit.id), 
                ScheduleService.getStationGroup()
            ];
            await Promise.all(promises).then(responses => {
                this.observStrategies = responses[0];
                this.taskTemplates = responses[1];
                let schedulingUnit = responses[2];
                let taskDrafts = responses[3];
                this.stations = responses[4];
                let stationGroups = [];
                if (schedulingUnit && schedulingUnit.observation_strategy_template_id) {
                    let targetObservation = schedulingUnit.requirements_doc.tasks['Target Observation'];
                    targetObservation = taskDrafts.data.results.find(task => {return task.specifications_doc.station_groups?true:false});
                    stationGroups = targetObservation?targetObservation.specifications_doc.station_groups:[];
                } 
                if (stationGroups) {
                    stationGroups.map(stationGroup =>{
                        stationValue += stationGroup.stations+':'+stationGroup.max_nr_missing+"|";
                    });
                }
            });
        }
        return stationValue;
    }

    /**
     * Get Observation details from Scheduling->Task
     * @param {Object} scheduleunit - Scheduling Unit
     * @returns 
     */
    async getObservationValueFromTask(scheduleunit) {
        let taskDrafts = [];
        if (scheduleunit.id) {
            let res = await ScheduleService.getTasksDraftBySchedulingUnitId(scheduleunit.id);
            taskDrafts = res.data.results;
        }
        let tasksToUpdate = {};
        const observStrategy = _.find(this.observStrategies, {'id': scheduleunit.observation_strategy_template_id});
        const tasks = observStrategy.template.tasks;    
        let paramsOutput = [];
        let schema = { type: 'object', additionalProperties: false, 
                        properties: {}, definitions:{}
                     };
        for (const taskName in tasks)  {
            const task = tasks[taskName];
            const taskDraft = taskDrafts.find(taskD => taskD.name === taskName);
            if (taskDraft) {
                task.specifications_doc = taskDraft.specifications_doc;
            }
            //Resolve task from the strategy template
            const $taskRefs = await $RefParser.resolve(task);

            // Identify the task specification template of every task in the strategy template
            const taskTemplate = _.find(this.taskTemplates, {'name': task['specifications_template']});
            schema['$id'] = taskTemplate.schema['$id'];
            schema['$schema'] = taskTemplate.schema['$schema'];
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
                    if(property) {
                        property.title = param.name;
                    }   else {
                        property = {};
                        property.title = param.name;
                    }
                    
                    property.default = $taskRefs.get(param.refs[0].replace(`#/tasks/${taskName}`, '#'));
                    //if ( param.name === 'Duration') {
                       // paramsOutput[param.name] =  property.default;
                   // } else {
                        paramsOutput[param.name] = property.default;
                   // }
                }
                this.setState({tasksToUpdate: tasksToUpdate});
            }
        }
        return paramsOutput;        
    }

    /**
     * Define AG Grid column properties
     */
     getAGGridAngelColumnsDefinition(schema) {
        let cellProps = [];
        cellProps['angle1'] = {isgroup: true, type:'numberValueColumn', cellRenderer: 'timeInputMask',cellEditor: 'timeInputMask', valueSetter: 'valueSetter', cellStyle: function(params) {
            if (params.value && !Validator.validateTime(params.value)) {     
                return { backgroundColor: BG_COLOR};
            } else {
                return { backgroundColor: ''};
            }
            },};
        cellProps['angle2'] = {isgroup: true, type:'numberValueColumn', cellRenderer: 'degreeInputMask',cellEditor: 'degreeInputMask', valueSetter: 'valueSetter' , cellStyle: function(params) {
            if (params.value && !Validator.validateAngle(params.value)) {     
                return { backgroundColor: BG_COLOR};
            } else {
                return { backgroundColor: ''};
            }
            }, };
        cellProps['angle3'] = {isgroup: true, cellEditor: 'numericEditor',cellStyle: function(params) { 
            if (isNaN(params.value)) {
                return { backgroundColor: BG_COLOR};
            }   else {
                return { backgroundColor: ''};
            }
        }}; 
        cellProps['direction_type'] = {isgroup: true, cellEditor: 'agSelectCellEditor',default: schema.definitions.pointing.properties.direction_type.default,
            cellEditorParams: {
                values: schema.definitions.pointing.properties.direction_type.enum,
            }, 
        };
        cellProps['duration'] = { type:'numberValueColumn', cellEditor:'numericEditor', cellStyle: function(params) {
            if  (params.value){
                if ( !Number(params.value)){
                    return { backgroundColor: BG_COLOR};
                }
                else if ( Number(params.value) < 1) {
                    return { backgroundColor: BG_COLOR};
                } else{
                    return { backgroundColor: ''};
                }
            }
        }, };
        cellProps['beamformers'] = { cellRenderer: 'beamformersRenderer',  cellEditor:'beamformer' };
        return cellProps;
    }

    /**
     * 
     * @param {*} predefineCellProps 
     * @param {*} childCellProps 
     * @param {*} cellName 
     * @returns 
     */
    getAGGridAngelColumnsProperty(predefineCellProps, childCellProps, cellName) {
        //cellName = _.lowerCase(cellName);
        let cellProperty = predefineCellProps[cellName];
        if(cellProperty) {
            let cellKeys =  Object.keys(cellProperty);
            for(const cellKey of cellKeys){
                childCellProps[cellKey] = predefineCellProps[cellName][cellKey];
            };
        }   else {
           // let defaultProp = {editable: true, cellRenderer: 'betweenRenderer',cellEditor: 'agDateInput', valueSetter: 'newValueSetter'};
           // childCellProps = Object.assign(childCellProps, defaultProp);
        }
        return childCellProps;
    }

    async createGridCellDetails() {
        let columnMap = [];
        let colProperty = {};
        this.colKeyOrder = [];
        let columnDefs = [
                    { // Row Index 
                        headerName: '#',
                        editable: false,
                        maxWidth: 60,
                        cellRenderer: 'rowIdRenderer',
                        pinned: 'left',
                        lockPosition: true,
                        suppressSizeToFit: true,
                    },
                    {headerName: 'Scheduling Unit', children: [
                        {headerName: 'Name', field: 'suname'},
                        {headerName: 'Description', field: 'sudesc', cellStyle: function(params) {
                                if  (params.data && params.data.suname && (params.data.suname !== '' && (!params.value || params.value === ''))) {
                                    return { backgroundColor: BG_COLOR};
                                }  else  { return { backgroundColor: ''};}
                            },},]
                    }
                ];
        colProperty = {'ID':'id', 'Name':'suname', 'Description':'sudesc'};
        columnMap['Scheduling Unit'] = colProperty;
        this.colKeyOrder.push("suname");
        this.colKeyOrder.push("sudesc");
        // Create Constraint Column for AG Grid
        columnDefs = await this.getConstraintColumns(columnDefs);
        let cellProps = {};
        //Observation Schema    
        const schema = this.state.paramsSchema;
        if(schema.properties) {
           // let definitions = schema.definitions.pointing;
            let predefineCellProps = this.getAGGridAngelColumnsDefinition(schema);
            let propKeys = Object.keys(schema.properties);
            for(const prop of propKeys) {
                colProperty = {};
                cellProps = {};
                let property = schema.properties[prop];
                if(property && property.$ref) {
                    cellProps['headerName'] = property.title;
                    let defaultKeys = Object.keys(property.default);
                    let children = [];
                    for(const defaultKey of defaultKeys) {
                        this.colKeyOrder.push(prop+"~"+defaultKey);
                        if(defaultKey === 'angle1') {
                            this.agSUWithDefaultValue[prop+"~"+defaultKey] = UnitConverter.getAngleInput( property.default[defaultKey], false);
                        }   else if(defaultKey === 'angle2') {
                            this.agSUWithDefaultValue[prop+"~"+defaultKey] = UnitConverter.getAngleInput( property.default[defaultKey], true);
                        }   else{
                            this.agSUWithDefaultValue[prop+"~"+defaultKey] = property.default[defaultKey];
                        }
                        let childCellProps = { headerName : _.startCase(defaultKey), field : prop+"~"+defaultKey};
                        childCellProps = this.getAGGridAngelColumnsProperty(predefineCellProps, childCellProps, defaultKey);
                        colProperty[defaultKey] =  prop+"~"+defaultKey;
                        children.push(childCellProps);
                    }
                    columnMap[property.title] = colProperty;
                    cellProps['children'] = children;
                    columnDefs.push(cellProps);
                }   else {
                    colProperty ={};
                    cellProps['headerName'] = property.title;
                    this.colKeyOrder.push(prop+"~"+property.title);
                    this.agSUWithDefaultValue[prop+"~"+property.title] = property.default;
                    cellProps['field'] = prop+"~"+property.title;
                    cellProps = this.getAGGridAngelColumnsProperty(predefineCellProps, cellProps, _.lowerCase(property.title));
                    colProperty[property.title] = prop+"~"+property.title;
                    columnMap[property.title] = colProperty;
                    columnDefs.push(cellProps);
                }
            }
        }
        this.colKeyOrder.push('stations');
        let stationValue = '';
        this.state.defaultStationGroups.map(stationGroup =>{
            let missingStation = (stationGroup.max_nr_missing)?stationGroup.max_nr_missing:0;
            stationValue += stationGroup.stations+':'+missingStation+"|";
        })
        this.agSUWithDefaultValue['stations'] = stationValue;
        columnDefs.push({headerName: 'Stations', field: 'stations', cellRenderer: 'betweenRenderer', cellEditor: 'station', valueSetter: 'newValueSetter'});
        this.getEmptyRow();

        let globalColmunDef =_.cloneDeep(columnDefs);
        globalColmunDef = await this.createGlobalColumnDefs(globalColmunDef, schema);

        this.setState({colKeyOrder: this.colKeyOrder, globalColmunDef: globalColmunDef, columnDefs: columnDefs, columnMap: columnMap, agSUWithDefaultValue: this.agSUWithDefaultValue});
    }
    
    /**
     * Create AG Grid column definition for top table
     * @param {*} globalColmunDef 
     * @param {*} schema 
     * @param {*} constraintSchema 
     */
     createGlobalColumnDefs(globalColmunDef, schema) {
        let schedulerValues = [...' ', ...this.constraintSchema.schema.properties.scheduler.enum];
        let direction_type_Values =  [...' ', ...schema.definitions.pointing.properties.direction_type.enum];
        globalColmunDef.forEach(colDef => {
            if (colDef.children) {
                colDef.children.forEach(childColDef => {
                    if (childColDef.field) {
                        if(childColDef.field.endsWith('direction_type')) {
                            childColDef.cellEditorParams.values = direction_type_Values;
                        }
                        childColDef.field = 'gdef_'+childColDef.field;
                        if (childColDef.default) {
                            childColDef.default = '';
                        }
                    }
                });
            }   else {
                    if(colDef.headerName === '#') {
                        colDef['hide'] = true;
                    }
                    if(colDef.field) {
                        if ( colDef.field.endsWith('scheduler')) {
                            colDef.cellEditorParams.values = schedulerValues;
                        }
                        colDef.field = 'gdef_'+colDef.field;
                        if (colDef.default) {
                            colDef.default = '';
                        }
                    }
                }
        });
       return globalColmunDef;
    }

    /**
     * 
     */
    getEmptyRow() {
        this.emptyAGSU = {};
        let keys = Object.keys(this.agSUWithDefaultValue);
        for(const key of keys) {
            if  (key === 'id'){
                this.emptyAGSU[key] = 0;
            }  else  {
                this.emptyAGSU[key] = '';
            }
        }
    }

    /**
     * Create Constraint columns for AG Grid
     * @param {*} columnDefs 
     * @returns 
     */
    async getConstraintColumns(columnDefs) {
        // currently only one constraint schema available and not propvided UI to choose constraints, so assign directly
        this.constraintSchema =  this.constraintTemplates[0];
        this.constraintSchema = await this.resolveSchema(this.constraintSchema);

    /**     AG Grid Cell Specific Properties
            In Excel View - expected column order is ['scheduler', 'time', 'daily', 'sky'] */
        let dailyProps = Object.keys( this.constraintSchema.schema.properties.daily.properties); 
        this.daily = [];
        this.dailyOption = [];
        dailyProps.forEach(prop => {
            this.dailyOption.push({'name':prop, 'value':prop});
            this.daily.push(prop);
        });
        this.setState({dailyOption: this.dailyOption, daily: this.daily});

        // move this variable to class variable
        //Ag-grid Colums definition
        // Column order to use clipboard copy
        this.colKeyOrder.push('scheduler');
        this.agSUWithDefaultValue['scheduler'] = this.constraintSchema.schema.properties.scheduler.default;
        this.agSUWithDefaultValue['min_target_elevation'] =  (this.constraintSchema.schema.properties.sky.properties.min_target_elevation.default * 180) / Math.PI;
        this.agSUWithDefaultValue['min_calibrator_elevation'] =(this.constraintSchema.schema.properties.sky.properties.min_calibrator_elevation.default * 180) / Math.PI;
        this.agSUWithDefaultValue['offset_from'] = 0;
        this.agSUWithDefaultValue['offset_to'] = 0;
        this.agSUWithDefaultValue['md_sun'] = (this.constraintSchema.schema.properties.sky.properties.min_distance.properties.sun.default * 180) / Math.PI;
        this.agSUWithDefaultValue['md_moon'] = (this.constraintSchema.schema.properties.sky.properties.min_distance.properties.moon.default * 180) / Math.PI;
        this.agSUWithDefaultValue['md_jupiter'] = (this.constraintSchema.schema.properties.sky.properties.min_distance.properties.jupiter.default) / Math.PI;
        
        columnDefs.push({headerName: 'Scheduler',field: 'scheduler',cellEditor: 'agSelectCellEditor',default: this.constraintSchema.schema.properties.scheduler.default, 
              cellEditorParams: {values: this.constraintSchema.schema.properties.scheduler.enum,}, });
        columnDefs.push({ headerName: 'Time',
                children: [
                    {  headerName: 'At', field:'timeat', editable: true, cellRenderer: 'betweenRenderer',cellEditor: 'agDateInput', valueSetter: 'newValueSetter'},
                    {  headerName: 'After', field:'timeafter', editable: true, cellRenderer: 'betweenRenderer',cellEditor: 'agDateInput', valueSetter: 'newValueSetter'},
                    {  headerName: 'Before', field:'timebefore', editable: true, cellRenderer: 'betweenRenderer',cellEditor: 'agDateInput', valueSetter: 'newValueSetter'},
                    ],});
        this.colKeyOrder.push('timeat');
        this.colKeyOrder.push('timeafter');
        this.colKeyOrder.push('timebefore');   
        this.colKeyOrder.push('between');  
        this.colKeyOrder.push('notbetween');
        this.colKeyOrder.push('daily');   
        columnDefs.push({headerName: 'Between',field: 'between',cellRenderer: 'betweenRenderer',cellEditor: 'betweenEditor',valueSetter: 'newValueSetter'});
        columnDefs.push({headerName: 'Not Between',field: 'notbetween',cellRenderer: 'betweenRenderer',cellEditor: 'betweenEditor',valueSetter: 'newValueSetter'});
        this.colKeyOrder.push('min_target_elevation'); 
        this.colKeyOrder.push('min_calibrator_elevation');
        this.colKeyOrder.push('offset_from');
        this.colKeyOrder.push('offset_to');
        columnDefs.push({headerName: 'Daily',field: 'daily',cellEditor: 'multiselector', valueSetter: function(params) {}},
            {headerName: 'Sky',
                children: [
                    {headerName: 'Min Target Elevation',field: 'min_target_elevation', cellEditor: 'numericEditor', cellStyle: function(params) {
                        if  (params.value){
                            if (params.value === undefined || params.value === null || isNaN(params.value)){
                                return { backgroundColor: BG_COLOR};
                            }
                            else if ( Number(params.value) < 0||   Number(params.value) > 90) {
                                return { backgroundColor: BG_COLOR};
                            } else{
                                return { backgroundColor: ''};
                            }
                        }
                    }, },
                    {headerName: 'Min Calibrator Elevation',field: 'min_calibrator_elevation', cellEditor: 'numericEditor', cellStyle: function(params) {
                        if  (params.value){
                            if (params.value === undefined || params.value === null || isNaN(params.value)){
                                return { backgroundColor: BG_COLOR};
                            }
                            else if ( Number(params.value) < 0||   Number(params.value) > 90) {
                                return { backgroundColor: BG_COLOR};
                            } else{
                                return { backgroundColor: ''};
                            }
                        }
                    }, },
                    {headerName: 'Offset Window From',field: 'offset_from',  cellEditor: 'numericEditor',cellStyle: function(params) {
                    
                        if  (params.value){
                            if  (params.value === 'undefined' || params.value === ''){
                                return { backgroundColor: ''};
                            }
                            if(params.value === "0"){
                                return { backgroundColor: ''};
                            }
                            if (!Number(params.value)){
                                return { backgroundColor: BG_COLOR};
                            }
                            else if ( Number(params.value) < -0.20943951 ||   Number(params.value) > 0.20943951) {
                                return { backgroundColor: BG_COLOR};
                            } else{
                                return { backgroundColor: ''};
                            }
                        }  else  {
                            return { backgroundColor: ''};
                        }
                    }, },
                    {headerName: 'Offset Window To',field: 'offset_to', cellEditor: 'numericEditor', cellStyle: function(params) {
                        if  (params.value){
                            if  (params.value === 'undefined' || params.value === ''){
                                return { backgroundColor: ''};
                            }
                            if(params.value === "0"){
                                return { backgroundColor: ''};
                            }
                            if ( !Number(params.value)){
                                return { backgroundColor: BG_COLOR};
                            }
                            else if ( Number(params.value) < -0.20943951 ||   Number(params.value) > 0.20943951) {
                                return { backgroundColor: BG_COLOR};
                            } else{
                                return { backgroundColor: ''};
                            }
                        }  else  {
                            return { backgroundColor: ''};
                        }
                    }, },
                ],
            });
            this.colKeyOrder.push('md_sun');
            this.colKeyOrder.push('md_moon');
            this.colKeyOrder.push('md_jupiter');
            columnDefs.push({headerName: 'Min_distance',children: [
                {headerName: 'Sun',field: 'md_sun',  cellEditor: 'numericEditor',cellStyle: function(params) {
                    if  (params.value){
                        if (params.value === undefined || params.value === null || isNaN(params.value)){
                            return { backgroundColor: BG_COLOR};
                        }
                        else if ( Number(params.value) < 0 ||   Number(params.value) > 180) {
                            return { backgroundColor: BG_COLOR};
                        } else{
                            return { backgroundColor: ''};
                        }
                    }
                }
                },
                {headerName: 'Moon',field: 'md_moon', cellEditor: 'numericEditor', cellStyle: function(params) {
                    if  (params.value){
                    if (params.value === undefined || params.value === null || isNaN(params.value)){
                          return { backgroundColor: BG_COLOR};
                        }
                        else if ( Number(params.value) < 0 ||   Number(params.value) > 180) {
                            return { backgroundColor: BG_COLOR};
                        } else{
                            return { backgroundColor: ''};
                        }
                    }
                }
                }, 
                {headerName: 'Jupiter',field: 'md_jupiter', cellEditor: 'numericEditor', cellStyle: function(params) {
                    if  (params.value){
                    if (params.value === undefined || params.value === null || isNaN(params.value)){
                         return { backgroundColor: BG_COLOR};
                        }
                        else if ( Number(params.value) < 0 ||   Number(params.value) > 180) {
                            return { backgroundColor: BG_COLOR};
                        } else{
                            return { backgroundColor: ''};
                        }
                    }
                }
                }, 
            ],
            });
        
        return columnDefs;
    }

 
     /**
     * Function called back from Degree/Time Input Mask to set value in row data. 
     *
     * @param {Stirng} cell -> contains Row ID, Column Name, Value, isDegree
     */
    async updateAngle(rowIndex, field, value, isDegree, isValid){
        let row = {};
        let tmpRowData = [];
        if ( field.startsWith('gdef_')) {
            row = this.state.commonRowData[0];
            row[field] = value;
            row['isValid'] = isValid;
            /* - this field is nolonger
            row[field+'value'] = UnitConverter.parseAngle(value);
            */
            tmpRowData = this.state.commonRowData;
            tmpRowData[0] = row;
            await this.setState({commonRowData: tmpRowData});
        }
        else {
            row = this.state.rowData[rowIndex];
            row[field] = value;
            row['isValid'] = isValid;
            /*
            row[field+'value'] = UnitConverter.parseAngle(value);
            */
            tmpRowData = this.state.rowData;
            tmpRowData[rowIndex] = row;
            await this.setState({rowData: tmpRowData,isDirty: true});
        }
    }

     /**
     * CallBack Function : update time value in master grid
     */
    async updateTime(rowIndex, field, value) {
        let row = {};
        let tmpRowData = [];
        if ( field.startsWith('gdef_')) {
            row = this.state.commonRowData[0];
            row[field] = value;
            tmpRowData =this.state.commonRowData;
            tmpRowData[0] = row;
            await this.setState({commonRowData: tmpRowData});
            this.state.topGridApi.setRowData(this.state.commonRowData);
            this.state.topGridApi.redrawRows();
        }
        else {
            row = this.state.rowData[rowIndex];
            row[field] = value;
            tmpRowData = this.state.rowData;
            tmpRowData[rowIndex] = row;
            await this.setState({rowData: tmpRowData,isDirty: true});
            this.state.gridApi.setRowData(this.state.rowData);
            this.state.gridApi.redrawRows();
        }
    }

    /**
     * Update the Daily/Station column value from external component
     * @param {*} rowIndex 
     * @param {*} field 
     * @param {*} value 
     */
    async updateCell(rowIndex, field, value) {
        let row = {};
        let tmpRowData = [];
        if ( field.startsWith('gdef_')) {
            row = this.state.commonRowData[0];
            row[field] = value;
            tmpRowData = this.state.commonRowData;
            tmpRowData[0] = row;
            await this.setState({commonRowData: tmpRowData});
             if(field !== 'gdef_daily') {
                this.state.topGridApi.stopEditing();
                var focusedCell = this.state.topGridColumnApi.getColumn(field)
                this.state.topGridApi.ensureColumnVisible(focusedCell);
                this.state.topGridApi.setFocusedCell(rowIndex, focusedCell);
            }
        }
        else {
            row = this.state.rowData[rowIndex];
            row[field] = value;
            tmpRowData = this.state.rowData;
            tmpRowData[rowIndex] = row;
            await this.setState({rowData: tmpRowData,isDirty: true});
             if(field !== 'daily') {
                this.state.gridApi.stopEditing();
                var focusedCell = this.state.gridColumnApi.getColumn(field)
                this.state.gridApi.ensureColumnVisible(focusedCell);
                this.state.gridApi.setFocusedCell(rowIndex, focusedCell);
            }
        }
    }


    /**
     * Save Scheduling Unit(s) form Excel table
     */
    async saveSchedulingUnit() {
        this.validateGridAndSave();
    }
    
    /**
     * Validate Grid values on click Save button from UI
     */
     async validateGridAndSave(){
        let validCount = 0;
        let inValidCount = 0;
        let isValidRow = true;
        let errorDisplay = [];
        const mandatoryKeys = ['suname','sudesc','scheduler','min_target_elevation','min_calibrator_elevation','offset_from','offset_to','md_sun','md_moon','md_jupiter','param_0~angle1','param_0~angle2','param_0~direction_type','param_1~angle1','param_1~angle2','param_1~direction_type','param_2~angle1','param_2~angle2','param_2~direction_type'];
        let tmpMandatoryKeys = [];
        let tmpRowData = this.state.rowData;
        this.state.gridApi.forEachNode(function (node) {
            isValidRow = true;
            let errorMsg =  'Row # ['+(Number(node.rowIndex)+1) +'] : ';
            tmpMandatoryKeys = [];
            const rowData = node.data;
            let isManualScheduler = false;
            let hasData = true;
            if  (rowData) {
                for(const key of mandatoryKeys) {
                    if  (rowData[key] === '') {
                        if ( key === 'suname' ){
                            if( rowData['sudesc'] !== ''){
                                tmpMandatoryKeys.push(key);
                            }   else {
                                hasData = false;
                            }
                        }   else if ( key === 'sudesc' ){
                            if( rowData['suname'] !== ''){
                                tmpMandatoryKeys.push(key);
                            }
                        } else {
                            tmpMandatoryKeys.push(key);
                        }
                    }   else if (key === 'scheduler' && rowData[key] === 'manual' ) {
                        isManualScheduler = true;
                    }
                }
                if  (tmpMandatoryKeys.length !== mandatoryKeys.length) {
                    //let rowNoColumn = {};
                    isValidRow = true;
                    for (var i = 0; i< node.columnController.gridColumns.length; i++) {
                       let column = node.columnController.gridColumns[i];
                        if  (column.colId === '0'){
                        }  else  {
                            if  (_.includes(tmpMandatoryKeys, column.colId)){
                                isValidRow = false;
                                errorMsg += column.colDef.headerName+", ";
                                //column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                //rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                            }  else  {
                                if  ((column.colId === 'timeat')  && isManualScheduler && rowData[column.colId] === ''){
                                     isValidRow = false;
                                     errorMsg += column.colDef.headerName+", ";
                                   // column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                   // rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                } else if (column.colId === 'min_target_elevation' || column.colId === 'min_calibrator_elevation' ){
                                    if  (Number(rowData[column.colId]) <= 0 ||   Number(rowData[column.colId]) > 90){
                                        isValidRow = false;
                                         errorMsg += column.colDef.headerName+", ";
                                      //  column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                      //  rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                    }
                                } else if (column.colId === 'offset_from' || column.colId === 'offset_to'){
                                    if ( typeof rowData[column.colId] === 'undefined' || (rowData[column.colId] && Number(rowData[column.colId] < 0))){
                                        isValidRow = false;
                                         errorMsg += column.colDef.headerName+", ";
                                       // column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                       // rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                    } else if  ( Number(rowData[column.colId]) < -0.20943951 ||   Number(rowData[column.colId]) > 0.20943951) {
                                        isValidRow = false;
                                         errorMsg += column.colDef.headerName+", ";
                                        //column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                       // rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                    }
                                } else if (column.colId === 'md_sun' || column.colId === 'md_moon' || column.colId === 'md_jupiter'){
                                    if  (Number(rowData[column.colId]) < 0 ||   Number(rowData[column.colId]) > 180){
                                        isValidRow = false;
                                         errorMsg += column.colDef.headerName+", ";
                                       // column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                       // rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                    }
                                } else if (_.endsWith(column.colId, "angle1") && !Validator.validateTime(rowData[column.colId])){
                                    isValidRow = false;
                                     errorMsg += column.colDef.headerName+", ";
                                    //column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                   // rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                } else if (_.endsWith(column.colId, "angle2") && !Validator.validateAngle(rowData[column.colId])){
                                    isValidRow = false;
                                    errorMsg += column.colDef.headerName+", ";
                                    //column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                    //rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                } else if(_.endsWith(column.colId, "angle3")){
                                    // if  (!Number(rowData[column.colId])){
                                    if (isNaN(rowData[column.colId])) {
                                        isValidRow = false;
                                        errorMsg += column.colDef.headerName+", ";
                                    }
                                } else if(_.endsWith(column.colId, "stations")){
                                    let sgCellValue = rowData[column.colId];
                                    let stationGroups = _.split(sgCellValue,  "|");
                                    stationGroups.map(stationGroup => {
                                        let sgValue = _.split(stationGroup, ":");
                                        if (rowData['suname'] !== '' && rowData['sudesc'] !== '' && (sgValue[1] === 'undefined' || sgValue[1] === 'NaN' || Number(sgValue[1]) < 0 )){
                                            isValidRow = false;
                                            errorMsg += column.colDef.headerName+", ";
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
            if(hasData) {
                if (isValidRow)  {
                    validCount++; 
                    tmpRowData[node.rowIndex]['isValid'] = true;
                } else {
                    inValidCount++;
                    tmpRowData[node.rowIndex]['isValid'] = false;
                    errorDisplay.push(errorMsg.slice(0, -2));
                }
            }   
        });
        
        if (validCount > 0 && inValidCount === 0) {
            // save SU directly
            this.saveSU();
        } else if (validCount === 0 && inValidCount === 0) {
            // leave with no change
            this.showIcon = true;
            this.dialogMsg = 'No valid Scheduling Unit found !';
            this.dialogType = 'warning';
            this.onClose = () => {this.setState({confirmDialogVisible: false});};
            this.setState({confirmDialogVisible: true});
        }  else  {
            this.setState({
                validCount: validCount,
                inValidCount: inValidCount,
                tmpRowData: tmpRowData,
                errorDisplay: errorDisplay,
                confirmDialogVisible: true,
            });
            this.callBackFunction = this.saveSU;
            this.state.gridApi.redrawRows();
            this.showIcon = true;
            this.onCancel = () => {
                this.setState({confirmDialogVisible: false});
            };
            this.onClose = () => {
                this.setState({confirmDialogVisible: false});
            };
            this.dialogType = "confirmation";
            this.dialogHeader = "Save Scheduling Unit(s)";
            this.dialogMsg = "Some of the Scheduling Unit(s) has invalid data, Do you want to ignore and save valid Scheduling Unit(s) only?";
            this.dialogContent = this.showDialogContent;
        }
    }

    /**
     * Show the content in custom dialog
     */
     showDialogContent(){
        if (typeof this.state.errorDisplay === 'undefined' || this.state.errorDisplay.length === 0 ){
            return "";
        }   else {
            return <> <br/>Invalid Rows:- Row # and Invalid columns <br/>{this.state.errorDisplay && this.state.errorDisplay.length>0 && 
                this.state.errorDisplay.map((msg, index) => (
                <React.Fragment key={index+10} >
                    <span key={'label1-'+ index}>{msg}</span> <br />
                </React.Fragment>
            ))} </>
        }
    }

    /**
     * Prepare Scheduling Unit from Excel table
     * @param {*} suRow 
     * @returns 
     */
    async prepareObservStrategyFromExcelValue(suRow) {
        let colKeys =  Object.keys(suRow);
        let paramsOutput = {};
        for(const colKey of colKeys)  {
            let prefix = colKey.split("~");  
            if(colKey.startsWith('param_') && prefix.length > 1) {
                var res =  Object.keys(suRow).filter(v => v.startsWith(prefix[0]));
                if(res && res.length > 1) {
                    let res = paramsOutput[prefix[0]];
                    if(prefix[1] === 'angle1' || prefix[1] === 'angle2') {
                        suRow[colKey] = UnitConverter.parseAngle(suRow[colKey]);
                    }
                    if(res) {
                        res[prefix[1]] = suRow[colKey];
                    }   else {
                        res = {};
                        res[prefix[1]] = suRow[colKey];
                        paramsOutput[prefix[0]] = res;
                    }
                }   else {
                    if(colKey.endsWith('Beamformers')){
                        let result = suRow[colKey];
                        if(result['param_0']) {
                            paramsOutput[prefix[0]] = result['param_0'];
                        }   else {
                            paramsOutput[prefix[0]] = result;
                        }
                    }   else if(colKey.endsWith('Duration')){
                        paramsOutput[prefix[0]] = Number(suRow[colKey]);    
                    }   else {
                        paramsOutput[prefix[0]] = suRow[colKey];
                    }
                }
            }   else {
                paramsOutput[prefix[0]] = suRow[colKey];
            }    
        } 
        this.setState({paramsOutput : paramsOutput})
        let observStrategy = _.cloneDeep(this.state.observStrategy);
        const $refs = await $RefParser.resolve(observStrategy.template);
        observStrategy.template.parameters.forEach(async(param, index) => {
            $refs.set(observStrategy.template.parameters[index]['refs'][0], this.state.paramsOutput['param_' + index]);
        });
        return observStrategy;
    }

    /**
     * Prepare Constraint from Excel table
     * @param {*} suRow 
     * @returns 
     */
   async prepareConstraintFromExcelValue(suRow) {
        let between = this.getBetweenDateValue(suRow.between);
        let notbetween = this.getBetweenDateValue(suRow.notbetween); 
        let constraint = null;
        if  (suRow.id > 0){
            let schedulingUnit = _.find(this.state.schedulingUnitList, {'id': suRow.id}); 
            constraint = schedulingUnit.scheduling_constraints_doc;
        } 
        if  ( constraint === null || constraint === 'undefined' || constraint === {}){
            constraint = this.state.schedulingConstraintsDoc;
        }
        if(!constraint) {
            let schedulingUnit = await ScheduleService.getSchedulingUnitDraftById(1);
            constraint = (schedulingUnit)? schedulingUnit.scheduling_constraints_doc : {};
        }
        //If No SU Constraint create default ( maintain default struc)
        constraint['scheduler'] = suRow.scheduler;
        if  (suRow.scheduler === 'dynamic'  || suRow.scheduler === 'online'){
            if (this.isNotEmpty(suRow.timeat)) {
                delete constraint.time.at;
            }
          
            if (!this.isNotEmpty(suRow.timeafter)) {
                delete constraint.time.after;
            }
           
            if (!this.isNotEmpty(suRow.timebefore)) {
                delete constraint.time.before;
            }
        }  
        else  {
            //mandatory
            constraint.time.at = `${moment(suRow.timeat).format(UIConstants.UTC_DATE_TIME_MS_FORMAT, { trim: false })}Z`;
            //optional
            if (!this.isNotEmpty(suRow.timeafter)) {
                delete constraint.time.after;
            } else {
                constraint.time.after = `${moment(suRow.timeafter).format(UIConstants.UTC_DATE_TIME_MS_FORMAT, { trim: false })}Z`;
            }
           
            if (!this.isNotEmpty(suRow.timebefore)) {
                delete constraint.time.before;
            } else {
                constraint.time.before = `${moment(suRow.timebefore).format(UIConstants.UTC_DATE_TIME_MS_FORMAT, { trim: false })}Z`;
            }
        }

        if  (this.isNotEmpty(between)){
            constraint.time.between = between;
        }
        if  (this.isNotEmpty(notbetween)){
            constraint.time.not_between = notbetween; 
        }
        let dailyValueSelected = _.split(suRow.daily, ",");
        this.state.daily.forEach(daily => {
            if  (_.includes(dailyValueSelected, daily)){
                constraint.daily[daily] = true;
            }  else  {
                constraint.daily[daily] = false;
            }
        }) 
        let min_distance_res = {};
        min_distance_res['sun'] = suRow.md_sun;
        min_distance_res['moon'] = suRow.md_moon;  
        min_distance_res['jupiter'] = suRow.md_jupiter;
        constraint.sky.min_distance = min_distance_res;
        
        let transit_offset_res = {};
        transit_offset_res['from'] = +suRow.offset_from;
        transit_offset_res['to'] = +suRow.offset_to;
        if  (transit_offset_res){
            constraint.sky.transit_offset= transit_offset_res;
        }
         
        constraint.sky.min_target_elevation = suRow.min_target_elevation;
        constraint.sky.min_calibrator_elevation = suRow.min_calibrator_elevation;

        return constraint;
    }

     /**
     * Save/Update Scheduling Unit(s)
     */
      async saveSU() {
        let newSUCount = 0;
        let existingSUCount = 0;
        let isUpdated = true;
        try{
            this.setState({
                confirmDialogVisible: false,
                showSpinner: true
            });
         
            let newSU = this.state.schedulingUnit;
            let suStatus = [];
            for(const suRow of this.state.rowData){
                if  (!suRow['isValid']){
                    continue;
                }
                let observStrategy = await this.prepareObservStrategyFromExcelValue(suRow); 
               
                //Stations
                let sgCellValue = suRow.stations;
                let tmpStationGroups = [];
                let tmpStationGroup = {};
                let stationGroups = _.split(sgCellValue,  "|");
                stationGroups.map(stationGroup =>{
                    tmpStationGroup = {};
                    let sgValue = _.split(stationGroup, ":");
                    if  (sgValue && sgValue[0].length>0){
                    let stationArray = _.split(sgValue[0], ",");
                    tmpStationGroup['stations'] = stationArray;
                    let missingStation = (sgValue[1])?sgValue[1]:0;
                    tmpStationGroup['max_nr_missing'] = Number(missingStation);
                    tmpStationGroups.push(tmpStationGroup);
                    }
                });
                
                if ( suRow.id === 0) {
                    for (const taskName in observStrategy.template.tasks) {
                        let task = observStrategy.template.tasks[taskName];
                        if (task.specifications_doc.station_groups) {
                            task.specifications_doc.station_groups = tmpStationGroups;
                        }
                    }
                }
                let isNewConstraint = false;
                let newConstraint = {};
                let constraint = await this.prepareConstraintFromExcelValue(suRow);
                if  (suRow.id ===  0){
                    isNewConstraint = true;
                }
                 
                UnitConverter.degreeToRadians(constraint.sky);
                
                if  (isNewConstraint){
                    newSU['scheduling_constraints_doc'] = constraint;
                }
              
                if  (suRow.id === 0){
                    newConstraint['scheduling_constraints_doc'] = constraint;
                    newConstraint['id'] = this.state.constraintId;
                    newConstraint['constraint'] = {'url':''};
                    newConstraint.constraint.url = this.state.constraintUrl;
                }
                let suUpdateStatus = {};
                if  (suRow.id > 0 && this.isNotEmpty(suRow.suname) && this.isNotEmpty(suRow.sudesc)){
                    newSU = _.find(this.state.schedulingUnitList, {'id': suRow.id}); 
                    newSU['name'] = suRow.suname;
                    newSU['description'] = suRow.sudesc;
                    let taskdata = await ScheduleService.getTasksDraftBySchedulingUnitId(suRow.id);
                    let taskDrafts =[];
                    if(taskdata){
                        taskDrafts = taskdata.data.results;
                    }
                    suUpdateStatus['suName'] = suRow.suname;
                    suUpdateStatus['action'] = 'Update';
                    let updateSu = await ScheduleService.updateSUDraftFromObservStrategy(observStrategy, newSU, taskDrafts, this.state.tasksToUpdate, tmpStationGroups);
                    suUpdateStatus['suStatus']= "Success";
                    suUpdateStatus['taskName']= updateSu.taskName;
                    if (updateSu && !updateSu.isSUUpdated) {
                        isUpdated = false;
                        suUpdateStatus['taskStatus']= "Failed";
                    }   else {
                        suUpdateStatus['taskStatus']= "Success";
                    }
                    existingSUCount++;
                }
                else if  (suRow.id === 0 && this.isNotEmpty(suRow.suname) && this.isNotEmpty(suRow.sudesc)){
                    let newSchedulueUnit = {
                        description: suRow.sudesc,
                        name: suRow.suname,
                        scheduling_constraints_template_id: newSU['scheduling_constraints_template_id'],
                        scheduling_set_id: newSU['scheduling_set_id']
                    }
                    suUpdateStatus['suName'] = suRow.suname;
                    suUpdateStatus['action'] = 'Create';
                    let updateSu = await ScheduleService.saveSUDraftFromObservStrategy(observStrategy, newSchedulueUnit, newConstraint, tmpStationGroups);
                    suUpdateStatus['suStatus']= "Success";
                    suUpdateStatus['taskName']= updateSu.taskName;
                    if (updateSu && !updateSu.isSUUpdated) {
                        isUpdated = false;
                        suUpdateStatus['taskStatus']= "Failed";
                    }   else {
                        suUpdateStatus['taskStatus']= "Success";
                    }
                    newSUCount++;
                }
                suStatus.push(suUpdateStatus);
            }
            
            if  ((newSUCount+existingSUCount) > 0){
                this.setState({suStatus:suStatus});
                this.dialogType = "success";
                this.dialogHeader = "Success";
                this.showIcon = true;
                this.dialogWidth = "60vw";
                if (isUpdated) {
                    this.dialogMsg = '['+newSUCount+'] Scheduling Units are created & ['+existingSUCount+'] Scheduling Units are updated successfully.';
                }   else {
                    this.dialogHeader = "Warning";
                    this.dialogMsg = '['+newSUCount+'] Scheduling Units are created & ['+existingSUCount+'] Scheduling Units are updated successfully, and there are some Schedule Unit/Task failed to create/update';
                }
                
                this.dialogContent = this.getSchedulingDialogContent;
                this.onCancel = this.reset;
                this.onClose = this.reset;
                this.callBackFunction = this.reset;
                this.setState({isDirty : false, showSpinner: false, confirmDialogVisible: true, /*dialog: dialog,*/ isAGLoading: true, copyHeader: false, rowData: []});
            }  else  {
                this.setState({isDirty: false, showSpinner: false,});
                this.growl.show({severity: 'error', summary: 'Warning', detail: 'No Scheduling Units create/update '});
            }
        } catch(err){
            this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to create/update Scheduling Units'});
            this.setState({showSpinner: false});
        }
    }
    
    /**
     * Prepare Scheduling Unit(s) details to show on confirmation dialog
     */
     getSchedulingDialogContent() {
         let suStatus = this.state.suStatus;
        return  <> 
                     {suStatus.length > 0 &&
                        <div style={{marginTop: '1em'}}>
                            <b>Scheduling Unit(s) & Task(s) status</b>
                            <DataTable value={suStatus} resizableColumns columnResizeMode="expand" className="card" style={{paddingLeft: '0em'}}>
                                <Column field="suName" header="Scheduling Unit Name"></Column>
                                <Column field="action" header="Action"></Column>
                                <Column field="suStatus" header="Scheduling Unit Status"></Column>
                                <Column field="taskStatus" header="Task(s) Status"></Column>
                            </DataTable>
                        </div>
                    } 
                </>
    }

    /**
     * Convert the date to string value for Between And Not-Between Columns
     * @param {*} dates 
     */
     getBetweenStringValue(dates){
        let returnDate = '';
        if  (dates){
            dates.forEach(utcDateArray => {
                returnDate += moment.utc(utcDateArray.from).format(UIConstants.CALENDAR_DATETIME_FORMAT)+",";
                returnDate += moment.utc(utcDateArray.to).format(UIConstants.CALENDAR_DATETIME_FORMAT)+"|";
            });
        }
       return returnDate;
    }
    
    /**
     * Get Daily column value 
     * @param {*} daily 
     */
     fetchDailyFieldValue(daily){
        let returnValue = [];
        if  (daily.require_day === true){
            returnValue.push('require_day');
        }
        if  (daily.require_night === true){
            returnValue.push('require_night');
        }
        if  (daily.avoid_twilight === true){
            returnValue.push('avoid_twilight');
        }
        return returnValue;
    }

    /**
     * convert String to Date value for Between And Not-Between Columns
     */
    getBetweenDateValue(betweenValue){
        let returnDate = [];
        if  (betweenValue){
            let rowDateArray = _.split(betweenValue, "|");
            rowDateArray.forEach(betweenDates =>{
                let betweendate = _.split(betweenDates, ",");
                let dateres = {};
                if  (betweendate && betweendate.length === 2){
                    dateres['from'] = `${moment(betweendate[0]).format(UIConstants.UTC_DATE_TIME_MS_FORMAT, { trim: false })}Z`;
                    dateres['to'] = `${moment(betweendate[1]).format(UIConstants.UTC_DATE_TIME_MS_FORMAT, { trim: false })}Z`;
                    returnDate.push(dateres);
                }
            })
        }
        return returnDate;      
    }

    /**
     * warn before cancel the page if any changes detected 
     */
     checkIsDirty() {
        if( this.state.isDirty ){
            this.showIcon = true;
            this.dialogType = "confirmation";
            this.dialogHeader = "Add Multiple Scheduling Unit(s)";
            this.dialogMsg = "Do you want to leave this page? Your changes may not be saved.";
            this.dialogContent = "";
            this.dialogHeight = '5em';
            this.callBackFunction = this.cancelCreate;
            this.onClose = this.close;
            this.onCancel = this.close;
            this.setState({
                confirmDialogVisible: true,
            });
        } else {
            this.cancelCreate();
        }
    }

     /**
     * Refresh the grid with updated data
     */
      async reset() {
        let schedulingUnitList = await ScheduleService.getSchedulingBySet(this.state.selectedSchedulingSetId);
        schedulingUnitList = _.filter(schedulingUnitList,{'observation_strategy_template_id': this.state.observStrategy.id}) ;
        this.setState({
            schedulingUnitList:  schedulingUnitList,
            confirmDialogVisible: false,
            isDirty: false
        });
        this.isNewSet = false;
        await this.prepareScheduleUnitListForGrid();
        this.state.gridApi.setRowData(this.state.rowData);
        this.state.gridApi.redrawRows();
    }
    
     /**
     * Cancel SU creation and redirect
     */
      cancelCreate() {
        this.setState({redirect: '/schedulingunit'});
    }

    /**
     * Set state to copy the table header to clipboard
     * @param {*} value 
     */
     async copyHeader(value) {
        await this.setState({'copyHeader': value});
    }

    
    /**
     * Copy the table header to clipboard
     */
     async copyOnlyHeader() {
        this.setState({ fade: true });
        let clipboardData = '';
        if (this.state.gridColumnApi) {
            var columnsName = this.state.gridColumnApi.getAllGridColumns();
            var line = '';
            if( columnsName ) {
                columnsName.map( column => {
                    if ( column.colId !== '0'){
                        line += column.colDef.headerName + '\t';
                    }
                });
            }
            line = _.trim(line);
            clipboardData += line + '\r\n'; 
            clipboardData = _.trim(clipboardData);
            const queryOpts = { name: 'clipboard-write', allowWithoutGesture: true };
            await navigator.permissions.query(queryOpts);
            await navigator.clipboard.writeText(clipboardData);
            this.growl.show({severity: 'success', summary: '', detail: 'Header copied to clipboard '});
        }
    }
    
    /**
     * Read Data from clipboard
     */
     async readClipBoard(){
        try{
            const queryOpts = { name: 'clipboard-read', allowWithoutGesture: true };
            await navigator.permissions.query(queryOpts);
            let data = await navigator.clipboard.readText();
            return data;
        }catch(err){
            console.log("Error",err);
        }
    }  

    /**
     * Copy data to/from clipboard
     * @param {*} e 
     */
    async clipboardEvent(e){
        var key = e.which || e.keyCode;
        var ctrl = e.ctrlKey ? e.ctrlKey : ((key === 17) ? true : false);
        if ( key === 67 && ctrl ) {
            //Ctrl+C
            this.copyToClipboard();
        } 
        else if ( key === 86 && ctrl ) {
            // Ctrl+V
            this.copyFromClipboard();
        }
    }

    /**
     * Function to copy the data to clipboard
     */
     async copyToClipboard(){
        var columnsName = this.state.gridColumnApi.getAllGridColumns();
        var selectedRows = this.state.gridApi.getSelectedRows();
        let clipboardData = '';
        if ( this.state.copyHeader ) {
            var line = '';
            columnsName.map( column => {
                if ( column.colId !== '0'){
                    line += column.colDef.headerName + '\t';
                }
            })
            line = _.trim(line);
            clipboardData += line + '\r\n'; 
        }
        for(const rowData of selectedRows){
            var line = '';
            for(const key of this.state.colKeyOrder){
                let value = ' ';
                if(key.endsWith('Beamformers')) {
                    let tmp = rowData[key];
                    if(tmp['param_0']) {
                        value = JSON.stringify(tmp['param_0']);
                    }   else {
                        value = JSON.stringify(tmp);
                    }
                }   else {
                    value = rowData[key];
                }
                if(value === undefined) {
                    value = ' ';
                }
                line +=  value+ '\t';
            }
            line = line.slice(0, -2); 
            clipboardData += line + '\r\n'; 
        }
        clipboardData = clipboardData.slice(0, -4); 
        
        const queryOpts = { name: 'clipboard-write', allowWithoutGesture: true };
        await navigator.permissions.query(queryOpts);
        await navigator.clipboard.writeText(clipboardData);
        const headerText = (this.state.copyHeader) ?'with Header' : '';
        this.growl.show({severity: 'success', summary: '', detail: selectedRows.length+' row(s) copied to clipboard '+headerText });
    }

    /**
     * Function to copy the data from clipboard
     */
    async copyFromClipboard(){
        try {
            var selectedRows = this.state.gridApi.getSelectedNodes();
            this.tmpRowData = this.state.rowData;
            let dataRowCount = this.state.totalCount;
            //Read Clipboard Data
            let clipboardData = await this.readClipBoard();
            let selectedRowIndex = 0;
            if  (selectedRows){
                await selectedRows.map(selectedRow =>{
                    selectedRowIndex = selectedRow.rowIndex;
                    if  (clipboardData){
                        let suGridRowData = this.state.emptyRow;
                        let suRows = clipboardData.split("\n");
                        suRows.forEach(line => {
                            suGridRowData = {};
                            suGridRowData['id'] = 0;
                            suGridRowData['isValid'] = true;
                            if ( this.tmpRowData.length <= selectedRowIndex ) {
                                this.tmpRowData.push(this.state.emptyRow);
                            }
                            let colCount = 0;
                            let suRow = line.split("\t");
                            for(const key of this.state.colKeyOrder){
                                if(key === 'param_3~Beamformers') {
                                    let cellValue = {};
                                    cellValue['param_0']=JSON.parse(suRow[colCount]);
                                    suGridRowData[key] = cellValue;
                                }   else {
                                    suGridRowData[key] = suRow[colCount];
                                }
                                colCount++;
                            }
                            if (this.tmpRowData[selectedRowIndex].id > 0 ) {
                                suGridRowData['id'] = this.tmpRowData[selectedRowIndex].id;
                            }
                            this.tmpRowData[selectedRowIndex] = (suGridRowData);
                            selectedRowIndex++
                        }) 
                    }
                });
                dataRowCount = selectedRowIndex;
                let emptyRow = this.state.emptyRow;
                let tmpNoOfSU = this.state.noOfSU;
                if  (dataRowCount >= tmpNoOfSU){
                    tmpNoOfSU = dataRowCount;
                    //Create additional empty row at the end
                    for(let i= this.tmpRowData.length; i<= tmpNoOfSU; i++){
                        this.tmpRowData.push(emptyRow);
                    }
                }
                await this.setState({
                    rowData: this.tmpRowData,
                    noOfSU: this.tmpRowData.length,
                    totalCount: dataRowCount,
                    isDirty: true
                });
                this.state.gridApi.setRowData(this.state.rowData);
                this.state.gridApi.redrawRows();
            }
        }
        catch (err) {
            console.error('Error: ', err);
        }
    }

     /**
     * Show warning messgae if any changes not saved when the AG grid reload or cancel the page
     * @param {*} functionName 
     */
      showWarning (functionName) {
        this.showIcon = true;
        this.dialogType = "confirmation";
        this.dialogHeader = "Add Multiple Scheduling Unit(s)";
        this.dialogMsg = "Do you want to leave the changes? Your changes may not be saved.";
        this.dialogContent = "";
        this.callBackFunction = functionName;
        this.onClose = this.close;
        this.onCancel = this.close;
        this.setState({
            confirmDialogVisible: true,
        });
    }

    /**
     * Reset the top table values
     */
     resetCommonData(){
        let tmpData = [this.state.defaultCommonRowData]; //[...[this.state.emptyRow]];
        let gRowData = {};
        for (const key of _.keys(tmpData[0])) {
            if (key === 'id') {
                gRowData[key] = tmpData[0][key];
            }
            else if(this.state.hasSameValue) {
                gRowData['gdef_'+key] = tmpData[0][key];
            } else {
                gRowData['gdef_'+key] = '';
            }
        }
        this.setState({commonRowData: [gRowData]});
    }

     /**
     * Reload the data from API 
     */
    reload(){
        this.changeStrategy(this.state.observStrategy.id);
    }

    /**
     * Appliy the changes to all rows
     */
    async applyToAll(){
        let isNotEmptyRow = true;
        if (!this.state.applyEmptyValue) {
            var row = this.state.commonRowData[0];
            Object.keys(row).forEach(key => {
                if (key !== 'id' && row[key] !== '') {
                    isNotEmptyRow = false;
                }
            });
        }   
        if (!this.state.applyEmptyValue && isNotEmptyRow ) {
            this.growl.show({severity: 'warn', summary: 'Warning', detail: 'Please enter value in the column(s) above to apply'});
        }  else {
            this.dialogType = "confirmation";
            this.dialogHeader = "Warning";
            this.showIcon = true;
            this.dialogMsg = "Do you want to apply the above value(s) to all Scheduling Units?";
            this.dialogContent = "";
            this.callBackFunction = this.applyChanges;
            this.applyToAllRow = true;
            this.applyToEmptyRowOnly = false;
            this.onClose = this.close;
            this.onCancel =this.close;
            this.setState({confirmDialogVisible: true});
        }                
    }

    /**
     * Apply the changes to selected rows
     */
    async applyToSelected(){
        let isNotEmptyRow = true;
        let tmpRowData = this.state.gridApi.getSelectedRows();
        if (!this.state.applyEmptyValue) {
            var row = this.state.commonRowData[0];
            Object.keys(row).forEach(key => {
                if (key !== 'id' && row[key] !== '') {
                    isNotEmptyRow= false;
                }
            });
        }    
        if (!this.state.applyEmptyValue && isNotEmptyRow ) {
            this.growl.show({severity: 'warn', summary: 'Warning', detail: 'Please enter value in the column(s) above to apply'});
        }   else if(tmpRowData && tmpRowData.length === 0){
            this.growl.show({severity: 'warn', summary: 'Warning', detail: 'Please select at least one row to apply the changes'});
        }   else {
            this.showIcon = true;
            this.dialogType = "confirmation";
            this.dialogHeader = "Warning";
            this.dialogMsg = "Do you want to apply the above value(s) to all selected Scheduling Unit(s) / row(s)?";
            this.dialogContent = "";
            this.applyToAllRow = false;
            this.applyToEmptyRowOnly = false;
            this.callBackFunction = this.applyChanges;
            this.onClose = this.close;
            this.onCancel = this.close;
            this.setState({confirmDialogVisible: true});
        }          
    }

     /**
     * Apply the changes to Empty rows
     */
    async applyToEmptyRows(){
        let isNotEmptyRow = true;
        if (!this.state.applyEmptyValue) {
            var row = this.state.commonRowData[0];
            Object.keys(row).forEach(key => {
                if (key !== 'id' && row[key] !== '') {
                    isNotEmptyRow= false;
                }
            });
        }    
        if (!this.state.applyEmptyValue && isNotEmptyRow ) {
            this.growl.show({severity: 'warn', summary: 'Warning', detail: 'Please enter value in the column(s) above to apply'});
        }   else {
            this.showIcon = true;
            this.dialogType = "confirmation";
            this.dialogHeader = "Warning";
            this.dialogMsg = "Do you want to apply the above value(s) to all empty rows?";
            this.dialogContent = "";
            this.applyToEmptyRowOnly = true;    // Allows only empty to make changes
            this.applyToAllRow = true;
            this.callBackFunction = this.applyChanges;
            this.onClose = this.close;
            this.onCancel = this.close;
            this.setState({confirmDialogVisible: true});
            }
    }

    /**
     * Make global changes in table data
     */
    async applyChanges() {
        await this.setState({
            confirmDialogVisible: false,
            isDirty: true
        });
        
        let tmpRowData = [];
        if (this.applyToAllRow) {
            tmpRowData = this.state.rowData;
        }
        else {
            tmpRowData = this.state.gridApi.getSelectedRows();
        }
        var grow = this.state.commonRowData[0];
        if(tmpRowData.length >0) {
            for( const row  of tmpRowData) {
                if (this.applyToEmptyRowOnly && (row['id'] > 0 || (row['suname'] !== '' && row['sudesc'] !== '') ) ){
                   continue;
                }
                this.colKeyOrder.forEach(key => {
                    if (key !== 'id') {
                        let value = grow['gdef_'+key];
                        if( this.state.applyEmptyValue) {
                            row[key] = value;
                        }
                        else {
                            row[key] = (_.isEmpty(value))?  row[key] : value;
                        }
                    }
                });
            }
            this.state.gridApi.setRowData(this.state.rowData);
        }
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        return (
            <React.Fragment>
                 <Growl ref={(el) => this.growl = el} />
                 <PageHeader location={this.props.location} title={'Scheduling Unit(s) Add Multiple'} 
                actions={[{icon: 'fa-window-close',title:'Close',  type: 'button',  actOn: 'click', props:{ callback: this.checkIsDirty }}]}
                />
                { this.state.isLoading ? <AppLoader /> :
                <>                   
                    <div> 
                        <div className="p-fluid">
                            
                            <div className="p-field p-grid">
                                <label htmlFor="project" className="col-lg-2 col-md-2 col-sm-12">Project <span style={{color:'red'}}>*</span></label>
                                <div className="col-lg-3 col-md-3 col-sm-12" data-testid="project" >
                                    <Dropdown inputId="project" optionLabel="name" optionValue="name" 
                                            tooltip="Project" tooltipOptions={this.tooltipOptions}
                                            value={this.state.schedulingUnit.project} disabled={this.state.projectDisabled}
                                            options={this.projects} 
                                            onChange={(e) => {this.onProjectChange(e.value)}} 
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
                                            onChange={(e) => {this.setSchedulingSetParams('scheduling_set_id',e.value)}} 
                                            placeholder="Select Scheduling Set" />
                                    <label className={this.state.errors.scheduling_set_id ?"error":"info"}>
                                        {this.state.errors.scheduling_set_id ? this.state.errors.scheduling_set_id : "Scheduling Set of the Project"}
                                    </label>
                                </div>
                                <div className="col-lg-1 col-md-1 col-sm-12">
                                    <Button label="" className="p-button-primary" icon="pi pi-plus" 
                                        onClick={this.showAddSchedulingSet}  
                                        tooltip="Add new Scheduling Set"
                                        style={{marginLeft: '-10px'}}
                                        disabled={this.state.schedulingUnit.project !== null ? false : true }/>
                                </div>
                            </div>
                            <div className="p-field p-grid">
                                <label htmlFor="observStrategy" className="col-lg-2 col-md-2 col-sm-12">Observation Strategy <span style={{color:'red'}}>*</span></label>
                                <div className="col-lg-3 col-md-3 col-sm-12" data-testid="observStrategy" >
                                    <Dropdown inputId="observStrategy" optionLabel="name" optionValue="id" 
                                            tooltip="Observation Strategy Template to be used to create the Scheduling Unit" tooltipOptions={this.tooltipOptions}
                                            value={this.state.observStrategy.id} 
                                            options={this.observStrategies} 
                                            onChange={(e) => {this.onStrategyChange(e.value)}} 
                                            placeholder="Select Strategy" />
                                    <label className={this.state.errors.noOfSU ?"error":"info"}>
                                        {this.state.errors.noOfSU ? this.state.errors.noOfSU : "Select Observation Strategy"}
                                    </label>
                                </div>
                                <div className="col-lg-1 col-md-1 col-sm-12"></div>
                                <label htmlFor="schedSet" className="col-lg-2 col-md-2 col-sm-12">No of Scheduling Unit <span style={{color:'red'}}>*</span></label>
                                <div className="col-lg-3 col-md-3 col-sm-12">
                                    <Dropdown
                                        editable
                                        options={this.state.noOfSUOptions}
                                        value={this.state.noOfSU}
                                        onChange={(e) => this.setNoOfSUint(e.value)}
                                        tooltip="Enter No. of Scheduling Units, Range - 1 to 500" tooltipOptions={this.tooltipOptions}
                                        placeholder='Enter No. of SU (1 to 500)' />
                                    <label className={this.state.errors.noOfSU ?"error":"info"}>
                                        {this.state.errors.noOfSU ? this.state.errors.noOfSU : "Enter No. of Scheduling Units"}
                                    </label>
                                </div>
                            </div>
                            { this.state.rowData && this.state.rowData.length > 0 &&
                                <div className="p-field p-grid">
                                    <label htmlFor="observStrategy" className="col-lg-2 col-md-2 col-sm-12">Copy Data With Header</label>
                                    <div className="col-lg-3 col-md-3 col-sm-12" >
                                    <Checkbox inputId="csvheader" role="csvheader" 
                                            tooltip="Include column headers while copying the data to clipboard" 
                                            tooltipOptions={this.tooltipOptions}
                                            checked={this.state.copyHeader} onChange={e => this.copyHeader(e.target.checked)}></Checkbox>
                                    
                                    <Button label="Copy Only Header"  icon="fas fa-copy" onClick={this.copyOnlyHeader} style={{marginLeft: '3em', width: '12em'}}
                                     onAnimationEnd={() => this.setState({ fade: false })}
                                     className={this.state.fade ? 'p-button-primary fade' : 'p-button-primary'} tooltip="Copy only header to clipboard" 
                                      />
                                    </div>
                                </div>
                            }
                            
                        </div>
                        <>
                            { this.state.isAGLoading ? <AppLoader /> :
                                <>
                                    {this.state.rowData && this.state.rowData.length > 0 &&
                                    <React.Fragment>
                                        <Accordion onTabOpen={this.resetCommonData} style={{marginTop: '2em', marginBottom: '2em'}} >
                                            <AccordionTab header={<React.Fragment><span style={{paddingLeft: '0.5em', paddingRight: '0.5em'}}>Input Values For Multiple Scheduling units</span> <i className="fas fa-clone"></i></React.Fragment>} >
                                                <div className="ag-theme-alpine" style={ {overflowX: 'inherit !importent', height: '160px', marginBottom: '10px' } }  onKeyDown={this.topAGGridEvent} >
                                                    <AgGridReact 
                                                        suppressClipboardPaste={false}
                                                        columnDefs={this.state.globalColmunDef}
                                                        columnTypes={this.state.columnTypes}
                                                        defaultColDef={this.state.defaultColDef}
                                                        rowSelection={this.state.rowSelection}
                                                        onGridReady={this.onTopGridReady}
                                                        rowData={this.state.commonRowData}
                                                        frameworkComponents={this.state.frameworkComponents}
                                                        context={this.state.context} 
                                                        components={this.state.components}
                                                        modules={this.state.modules}        
                                                        enableRangeSelection={true}
                                                    >
                                                    </AgGridReact>
                                                
                                                </div>
                                                <div className="p-grid p-justify-start" >
                                                    <label htmlFor="observStrategy" className="p-col-1" style={{width: '14em'}}>Include empty value(s)</label>
                                                        <Checkbox 
                                                            tooltip="Copy the input value ( empty values also ) as it is while apply the changes in table" 
                                                            tooltipOptions={this.tooltipOptions}
                                                            checked={this.state.applyEmptyValue} 
                                                            onChange={e => this.setState({'applyEmptyValue': e.target.checked})}
                                                            style={{marginTop: '10px'}} >
                                                        </Checkbox>
                                                    
                                                    <div className="p-col-1" style={{width: 'auto' , marginLeft: '2em'}}>
                                                        <Button label="Apply to All Rows" tooltip="Apply changes to all rows in below table" className="p-button-primary" icon="fas fa-check-double" onClick={this.applyToAll}/>
                                                    </div>
                                                    <div className="p-col-1" style={{width: 'auto',marginLeft: '2em'}}>
                                                        <Button label="Apply to Selected Rows" tooltip="Apply changes to selected row in below table" className="p-button-primary" icon="fas fa-check-square"   onClick={this.applyToSelected} />
                                                    </div>
                                                    <div className="p-col-1" style={{width: 'auto',marginLeft: '2em'}}>
                                                        <Button label="Apply to Empty Rows" tooltip="Apply changes to empty row in below table" className="p-button-primary" icon="pi pi-check"   onClick={this.applyToEmptyRows} />
                                                    </div>
                                                <div className="p-col-1" style={{width: 'auto',marginLeft: '2em'}}>
                                                        <Button label="Reset" tooltip="Reset input values" className="p-button-primary" icon="pi pi-refresh" onClick={this.resetCommonData} />
                                                    </div>
                                                    {/*} <div className="p-col-1" style={{width: 'auto',marginLeft: '2em'}}>
                                                        <Button label="Refresh" tooltip="Refresh grid data" className="p-button-primary" icon="pi pi-refresh"   onClick={this.reload} />
                                                    </div>
                                                    */}
                                                </div>
                                            </AccordionTab>
                                        </Accordion>  
                                        </React.Fragment>
                                    }

                                    {this.state.observStrategy.id &&
                                        <div className="ag-theme-alpine" style={ {overflowX: 'inherit !importent', height: '500px', marginBottom: '3em', padding: '0.5em' } } onKeyDown={this.clipboardEvent}>
                                             <label >Scheduling Unit(s) </label>
                                            <AgGridReact 
                                                suppressClipboardPaste={false}
                                                columnDefs={this.state.columnDefs}
                                                columnTypes={this.state.columnTypes}
                                                defaultColDef={this.state.defaultColDef}
                                                rowSelection={this.state.rowSelection}
                                                onGridReady={this.onGridReady}
                                                rowData={this.state.rowData}
                                                frameworkComponents={this.state.frameworkComponents}
                                                context={this.state.context} 
                                                components={this.state.components}
                                                modules={this.state.modules}        
                                                enableRangeSelection={true}
                                                enableCellChangeFlash={true}
                                                onCellValueChanged= {this.cellValueChageEvent}
                                            >
                                            </AgGridReact>
                                        </div>
                                    }
                                </>
                            }
                        </>
                        <div className="p-grid p-justify-start">
                            <div className="p-col-1">
                                <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.saveSchedulingUnit} 
                                        data-testid="save-btn" />
                            </div>
                            <div className="p-col-1">
                                <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.checkIsDirty}  />
                            </div>
                        </div>
                    </div>
                </>
                }
                <CustomDialog type={this.dialogType} visible={this.state.confirmDialogVisible} width={this.dialogWidth} height={this.dialogHeight}
                    header={this.dialogHeader} message={this.dialogMsg} 
                    content={this.dialogContent} onClose={this.onClose} onCancel={this.onCancel} onSubmit={this.callBackFunction}
                    showIcon={this.showIcon} actions={this.actions}>
                </CustomDialog>
                <CustomPageSpinner visible={this.state.showSpinner} />
            </React.Fragment>
        );
    }
}

export default SchedulingSetCreate;