import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Growl } from 'primereact/components/growl/Growl';
import { Checkbox } from 'primereact/checkbox';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModules } from '@ag-grid-community/all-modules';
import $RefParser from "@apidevtools/json-schema-ref-parser";
import TimeInputmask from '../../components/Spreadsheet/TimeInputmask'
import DegreeInputmask from '../../components/Spreadsheet/DegreeInputmask'
import NumericEditor from '../../components/Spreadsheet/numericEditor';
import BetweenEditor from '../../components/Spreadsheet/BetweenEditor'; 
import BetweenRenderer from '../../components/Spreadsheet/BetweenRenderer';
import MultiSelector from '../../components/Spreadsheet/MultiSelector';
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';

import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import TaskService from '../../services/task.service';
import CustomDateComp from '../../components/Spreadsheet/CustomDateComp';

import Validator from  '../../utils/validator';
import UnitConverter from '../../utils/unit.converter'
import UIConstants from '../../utils/ui.constants';
import UnitConversion from '../../utils/unit.converter';
import StationEditor from '../../components/Spreadsheet/StationEditor';
import SchedulingSet from './schedulingset.create';    
import moment from 'moment';
import _ from 'lodash';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import { CustomPageSpinner } from '../../components/CustomPageSpinner';
import { CustomDialog } from '../../layout/components/CustomDialog';
import UtilService from '../../services/util.service';

// const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const BG_COLOR = '#f878788f';

/**
 * Component to create / update Scheduling Unit Drafts using Spreadsheet
 */
export class SchedulingSetCreate extends Component {
    constructor(props) {
        super(props);
        this.gridApi = '';
        this.gridColumnApi = '';
        this.topGridApi = '';
        this.topGridColumnApi = '';
        this.rowData = [];
        this.tmpRowData = [];
        this.daily = [];
        this.dailyOption = [];
        this.isNewSet = false;
        //this.dialogMsg = '';
        //this.dialogType = '';
        //this.callBackFunction = '';
        this.state = {
            selectedProject: {},
            copyHeader: false,                    // Copy Table Header to clipboard
            applyEmptyValue: false,
            dailyOption: [],
            projectDisabled: (props.match?(props.match.params.project? true:false):false),
            isLoading: true, 
            isAGLoading: false,                       // Flag for loading spinner
            dialog: { header: '', detail: ''},      // Dialog properties
            redirect: null,                         // URL to redirect
            errors: [],                             // Form Validation errors
            clipboard: [],                          // Maintaining grid data while Ctrl+C/V
            schedulingUnit: {
                project: (props.match?props.match.params.project:null) || null,
            },
            schedulingSets: [],
            schedulingUnitList: [],
            selectedSchedulingSetId: null,
            observStrategy: {},
            totalCount: 0,
            validEditor: false,
            validFields: {}, 
            noOfSU: 10,
            //ag-grid
            columnMap: [],
            columnDefs: [],
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
            },
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
            // ag grid to show row index
            components: {
                rowIdRenderer: function (params) {
                    return 1 + params.rowIndex;
                },
                validCount: 0,
                inValidCount: 0,
            },
            //ag-gird - No of rows list
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
            //saveDialogVisible: false,
            defaultCellValues: {},
            showDefault: false,
            confirmDialogVisible: false,
            isDirty: false
        };
        this.showIcon = true;
        this.dialogType = "confirmation";
        this.dialogHeight = 'auto';
        this.dialogHeader = "";
        this.dialogMsg = "";
        this.dialogContent = "";
        this.applyToAllRow = false;
        this.callBackFunction = "";
        this.onClose = this.close;
        this.onCancel =this.close;
        this.applyToEmptyRowOnly = false;    // A SU Row not exists and the Name & Desc are empty

        this.applyToAll =  this.applyToAll.bind(this);
        this.applyToSelected =  this.applyToSelected.bind(this);
        this.applyToEmptyRows =  this.applyToEmptyRows.bind(this);
        this.resetCommonData = this.resetCommonData.bind(this);
        this.reload = this.reload.bind(this);
        this.applyChanges =  this.applyChanges.bind(this);
        this.onTopGridReady = this.onTopGridReady.bind(this);
        this.onGridReady = this.onGridReady.bind(this);
        this.validateForm = this.validateForm.bind(this);
        this.validateEditor = this.validateEditor.bind(this);
        this.saveSchedulingUnit = this.saveSchedulingUnit.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.checkIsDirty = this.checkIsDirty.bind(this);
        this.clipboardEvent = this.clipboardEvent.bind(this);
        this.topAGGridEvent = this.topAGGridEvent.bind(this);
        this.reset = this.reset.bind(this);
        this.close = this.close.bind(this);
        this.saveSU = this.saveSU.bind(this);
        this.validateGridAndSave = this.validateGridAndSave.bind(this);
        this.showDialogContent = this.showDialogContent.bind(this);
        this.isNotEmpty = this.isNotEmpty.bind(this);
        this.setDefaultCellValue = this.setDefaultCellValue.bind(this);
        this.copyHeader = this.copyHeader.bind(this);
        this.copyOnlyHeader = this.copyOnlyHeader.bind(this);
        this.cellValueChageEvent = this.cellValueChageEvent.bind(this);
        this.onProjectChange =  this.onProjectChange.bind(this);
        this.showWarning = this.showWarning.bind(this);
        this.onSchedulingSetChange = this.onSchedulingSetChange.bind(this);
        this.onStrategyChange = this.onStrategyChange.bind(this);
        this.refreshSchedulingSet = this.refreshSchedulingSet.bind(this);
        this.showAddSchedulingSet = this.showAddSchedulingSet.bind(this);

        this.projects = [];                         // All projects to load project dropdown
        this.schedulingSets = [];                   // All scheduling sets to be filtered for project
        this.observStrategies = [];                 // All Observing strategy templates
        this.taskTemplates = [];                    // All task templates to be filtered based on tasks in selected strategy template
        this.tooltipOptions = UIConstants.tooltipOptions;
        this.nameInput = React.createRef();         // Ref to Name field for auto focus
        this.formRules = {                          // Form validation rules
            project: {required: true, message: "Select project to get Scheduling Sets"},
            scheduling_set_id: {required: true, message: "Select the Scheduling Set"},
        };
    }

    componentDidMount() {
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingSets(),
                            ScheduleService.getObservationStrategies(),
                            TaskService.getTaskTemplates()];
        Promise.all(promises).then(responses => {
            this.projects = responses[0];
            this.schedulingSets = responses[1];
            this.observStrategies = responses[2];
            this.taskTemplates = responses[3];
            if (this.state.schedulingUnit.project) {
                const projectSchedluingSets = _.filter(this.schedulingSets, {'project_id': this.state.schedulingUnit.project});
                this.setState({isLoading: false, schedulingSets: projectSchedluingSets, allSchedulingSets: this.schedulingSets});
            }   else {
                this.setState({isLoading: false});
            }
        }); 
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
       /* this.setState({confirmDialogVisible: false, isDirty: false, schedulingUnit: schedulingUnit, 
            schedulingSets: projectSchedluingSets, validForm: this.validateForm('project'), rowData: [], 
            observStrategy: {}, copyHeader: false, isDirty: false}); */

        const selectedProject = _.filter(this.projects, {'name': projectName});
        this.setState({confirmDialogVisible: false, isDirty: false, selectedProject: selectedProject, schedulingUnit: schedulingUnit, 
            schedulingSets: projectSchedluingSets, validForm: this.validateForm('project'), rowData: [],observStrategy: {}, copyHeader: false});
    }
 
    /**
     *  Trigger when the Scheduling Set drop down get changed and check isDirty
     * @param {*} key 
     * @param {*} value 
     */
    onSchedulingSetChange(key, value) {
        if (this.state.isDirty) {
            this.showWarning(() =>{
                this.setSchedulingSetParams(key, value);
            });
        }   else {
            this. setSchedulingSetParams(key, value);
        }
    }

    /**
     * Function to set form values to the SU object
     * @param {string} key 
     * @param {object} value 
     */
    async setSchedulingSetParams(key, value) {
        this.setState({isAGLoading: true, copyHeader: false, confirmDialogVisible: false, isDirty: false});
        let schedulingUnit = this.state.schedulingUnit;
        schedulingUnit[key] = value;

        let schedulingUnitList = await ScheduleService.getSchedulingBySet(value);
        if  (schedulingUnitList)    {
            const schedulingSetIds = _.uniq(_.map(schedulingUnitList, 'observation_strategy_template_id'));
            if  (schedulingSetIds.length === 1) {
                const observStrategy = _.find(this.observStrategies, {'id': schedulingUnitList[0].observation_strategy_template_id});
                this.setDefaultStationGroup(observStrategy);
                this.setState({
                    schedulingUnit: schedulingUnit, validForm: this.validateForm(key), validEditor: this.validateEditor(),
                    schedulingUnitList: schedulingUnitList, schedulingSetId: value, selectedSchedulingSetId: value, observStrategy: observStrategy,
                });
                this.isNewSet = false;
                await this.prepareScheduleUnitListForGrid();
            }  else  { 
                /* Let user to select Observation Strategy */
                this.setState({
                    rowData:[], schedulingUnit: schedulingUnit, validForm: this.validateForm(key), validEditor: this.validateEditor(),
                    schedulingUnitList:schedulingUnitList, selectedSchedulingSetId: value,  observStrategy: {}
                });
            }
        }  else  {
            this.setState({schedulingUnit: schedulingUnit, validForm: this.validateForm(key), validEditor: this.validateEditor(),
                selectedSchedulingSetId: value});
        }
        this.setState({isAGLoading: false});
    }

    /**
     * Set default value for Station group when filter change
     */
    async setDefaultStationGroup(observStrategy) {
        let station_group = [];
        const tasks = observStrategy.template.tasks;    
        for (const taskName of _.keys(tasks)) {
            const task = tasks[taskName];
            //Resolve task from the strategy template
            await $RefParser.resolve(task);
            // Identify the task specification template of every task in the strategy template
            const taskTemplate = _.find(this.taskTemplates, {'name': task['specifications_template']});
            if (taskTemplate.type_value === 'observation' && task.specifications_doc.station_groups) {
                station_group = task.specifications_doc.station_groups;
            }
        }
        await this.setState({
            defaultStationGroups: station_group,
        })
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
        await this.setState({noOfSU: 10, isAGLoading: true, copyHeader: false, rowData: [], confirmDialogVisible: false, isDirty: false});
        const observStrategy = _.find(this.observStrategies, {'id': strategyId});
        let schedulingUnitList= await ScheduleService.getSchedulingBySet(this.state.selectedSchedulingSetId);
        schedulingUnitList = _.filter(schedulingUnitList,{'observation_strategy_template_id': strategyId}) ;
        this.setDefaultStationGroup(observStrategy);
        if(schedulingUnitList.length === 0) {
            schedulingUnitList = await this.getEmptySchedulingUnit(strategyId);
            this.isNewSet = true;
        }
        else {
            this.isNewSet = false;
        }
        await this.setState({
            schedulingUnitList: schedulingUnitList,
            observStrategy: observStrategy,
        });
        
        if (schedulingUnitList && schedulingUnitList.length >0){
            await this.prepareScheduleUnitListForGrid();
        } else  {
            this.setState({
                rowData: []
            });
        }
        this.setState({isAGLoading: false,commonRowData: []});
    }
   
    // TODO: This function should be modified or removed
    async getEmptySchedulingUnit(strategyId){
        // let suList = await ScheduleService.getSchedulingUnitDraft();
        // return [_.find(suList.data.results, {'observation_strategy_template_id': strategyId})];       
        let emptySU = {name: "", description: ""};
        let constraintTemplates = await ScheduleService.getSchedulingConstraintTemplates();
        let constraintTemplate = constraintTemplates.length>0?constraintTemplates[0]:null;
        emptySU['scheduling_constraints_template_id'] = constraintTemplate?constraintTemplate.id:null;
        emptySU['scheduling_constraints_doc'] = {};
        let strategy = _.find(this.observStrategies, ['id', strategyId]);
        emptySU['requirements_doc'] = strategy?strategy.template:{};
        emptySU['observation_strategy_template_id'] = strategyId;
        return [emptySU];
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
     * return constraint
     * @param {*} scheduleUnit 
     */
    async getConstraintSchema(scheduleUnit){
       let constraintSchema = await ScheduleService.getSchedulingConstraintTemplate(scheduleUnit.scheduling_constraints_template_id);
       return constraintSchema;
    }
   
    /**
     * Create AG Grid column properties
     */
    createAGGridAngelColumnsProperty(schema) {
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
            // console.log(params);
            // if (params.value){
            //     console.log("params value - ", params.value);
            //     console.log(Number(params.value));
            //     if (!params.colDef.field.startsWith('gdef') && isNaN(params.value)) {
            //         return { backgroundColor: BG_COLOR};
            //     } 
            //     else{
            //         return { backgroundColor: ''};
            //     }
            // } else {
            //     console.log("No Params value");
            //     return  (!params.colDef.field.startsWith('gdef')) ?{ backgroundColor: BG_COLOR} : { backgroundColor: ''}
            // }
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

        return cellProps;
    }

    /**
     * Function to generate AG-Grid column definition. 
     * @param {number} strategyId 
     */
    async createGridColumns(scheduleUnit){
        let defaultCellValues = {};
        let schema = await this.getTaskSchema(scheduleUnit, false);
        schema = await this.resolveSchema(schema);
        let constraintSchema =  await this.getConstraintSchema(scheduleUnit);
        constraintSchema = await this.resolveSchema(constraintSchema);
        // AG Grid Cell Specific Properties
        let dailyProps = Object.keys( constraintSchema.schema.properties.daily.properties); 
        this.daily = [];
        this.dailyOption = [];
        dailyProps.forEach(prop => {
            this.dailyOption.push({'name':prop, 'value':prop});
            this.daily.push(prop);
        }) 
        this.setState({
            dailyOption: this.dailyOption,
            schedulingConstraintsDoc: scheduleUnit.scheduling_constraints_doc,
            constraintUrl: scheduleUnit.scheduling_constraints_template,
            constraintId: scheduleUnit.scheduling_constraints_template_id,
            daily: this.daily,
        });

        let cellProps = this.createAGGridAngelColumnsProperty(schema);
        //Ag-grid Colums definition
        // Column order to use clipboard copy
        let colKeyOrder = [];
        colKeyOrder.push("suname");
        colKeyOrder.push("sudesc");
        let columnMap = [];
        let colProperty = {};
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
            {
              headerName: 'Scheduling Unit',
              children: [
                {headerName: 'Name',field: 'suname'},
                {headerName: 'Description',field: 'sudesc', cellStyle: function(params) {
                        if  (params.data.suname && (params.data.suname !== '' && (!params.value || params.value === ''))) {
                            return { backgroundColor: BG_COLOR};
                        }  else  { return { backgroundColor: ''};}
                    },
                }
              ],
            },
              
            { headerName: 'Scheduler',field: 'scheduler',cellEditor: 'agSelectCellEditor',default: constraintSchema.schema.properties.scheduler.default, 
              cellEditorParams: {
                  values: constraintSchema.schema.properties.scheduler.enum,
              }, 
            },
            { headerName: 'Time',
                children: [
                    {  headerName: 'At', field:'timeat', editable: true, cellRenderer: 'betweenRenderer',cellEditor: 'agDateInput', valueSetter: 'newValueSetter'},
                    {  headerName: 'After', field:'timeafter', editable: true, cellRenderer: 'betweenRenderer',cellEditor: 'agDateInput', valueSetter: 'newValueSetter'},
                    {  headerName: 'Before', field:'timebefore', editable: true, cellRenderer: 'betweenRenderer',cellEditor: 'agDateInput', valueSetter: 'newValueSetter'},
                    ],
                },
               
            {headerName: 'Between',field: 'between',cellRenderer: 'betweenRenderer',cellEditor: 'betweenEditor',valueSetter: 'newValueSetter'},
            {headerName: 'Not Between',field: 'notbetween',cellRenderer: 'betweenRenderer',cellEditor: 'betweenEditor',valueSetter: 'newValueSetter'},
            {headerName: 'Daily',field: 'daily',cellEditor: 'multiselector', valueSetter: function(params) {}},
            {
                headerName: 'Sky',
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
            },
            {
            headerName: 'Min_distance',
            children: [
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
            },
        ];
        // Column order in excel to clipboard and vice versa 
        // TODO: Based on the fields available in the constraint schema, these columns should be added.
        colKeyOrder.push('scheduler');
        colKeyOrder.push('timeat');
        colKeyOrder.push('timeafter');
        colKeyOrder.push('timebefore');
        colKeyOrder.push('between');
        colKeyOrder.push('notbetween');
        colKeyOrder.push('daily');
        colKeyOrder.push('min_target_elevation');
        colKeyOrder.push('min_calibrator_elevation');
        colKeyOrder.push('offset_from');
        colKeyOrder.push('offset_to');
        colKeyOrder.push('md_sun');
        colKeyOrder.push('md_moon');
        colKeyOrder.push('md_jupiter');
        defaultCellValues['scheduler'] = constraintSchema.schema.properties.scheduler.default;
        // TODO: The radian coonversion should call a function in UnitConverter.js
        defaultCellValues['min_target_elevation'] =  (constraintSchema.schema.properties.sky.properties.min_target_elevation.default * 180) / Math.PI;
        defaultCellValues['min_calibrator_elevation'] =(constraintSchema.schema.properties.sky.properties.min_calibrator_elevation.default * 180) / Math.PI;
        defaultCellValues['offset_from'] = 0;
        defaultCellValues['offset_to'] = 0;
        defaultCellValues['md_sun'] = (constraintSchema.schema.properties.sky.properties.min_distance.properties.sun.default * 180) / Math.PI;
        defaultCellValues['md_moon'] = (constraintSchema.schema.properties.sky.properties.min_distance.properties.moon.default * 180) / Math.PI;
        defaultCellValues['md_jupiter'] = (constraintSchema.schema.properties.sky.properties.min_distance.properties.jupiter.default) / Math.PI;
        
        if(this.state.defaultStationGroups){
            let stationValue = '';
            this.state.defaultStationGroups.map(stationGroup =>{
                stationValue += stationGroup.stations+':'+ (stationGroup.max_nr_missing || 0)+"|";
            })
            defaultCellValues['stations'] = stationValue;
        }
        colProperty = {'ID':'id', 'Name':'suname', 'Description':'sudesc'};
        columnMap['Scheduling Unit'] = colProperty;
        
        let defaultSchema = await this.getTaskTemplateSchema(scheduleUnit, 'Target Observation');
        defaultSchema = await this.resolveSchema(defaultSchema);
        let definitions = defaultSchema.definitions.pointing.properties;
        let properties = defaultSchema.properties;
        const propsKeys = Object.keys(properties);
        for(const propKey of propsKeys){
            let property = properties[propKey];
            let childern = [];
            let colProperty = {};
            if (property.title === 'Duration'){
                let cellAttr = {};
                cellAttr['headerName'] = 'Duration';
                cellAttr['field'] = 'duration';
                let cellKeys =  Object.keys(cellProps['duration']);
                for(const cellKey of cellKeys){
                    cellAttr[cellKey] = cellProps['duration'][cellKey];
                }; 
                    
                colKeyOrder.push('duration');
                childern.push(cellAttr);
                colProperty[propKey] = 'duration';
                defaultCellValues['duration'] = property.default;
            } 
            else {
                let childalias = property.title;
                childalias = _.lowerCase(childalias).split(' ').map(x => x[0]).join('');
                const paramKeys = Object.keys(property.default);
                paramKeys.forEach(key =>{
                    if (key === 'angle1'){
                        defaultCellValues[childalias+key] = UnitConverter.getAngleInput(property.default[key], false);
                    } else if (key === 'angle2') {
                        defaultCellValues[childalias+key] = UnitConverter.getAngleInput(property.default[key], true);
                    } else {
                        defaultCellValues[childalias+key] = property.default[key];
                    }
                    colProperty[key] = childalias+key;
                    let cellAttr = {};
                    cellAttr['headerName'] = definitions[key].title;
                    cellAttr['field'] = childalias+key;
                    colKeyOrder.push(childalias+key);
                    let cellKeys =  Object.keys(cellProps[key]);
                    for(const cellKey of cellKeys){
                        cellAttr[cellKey] = cellProps[key][cellKey];
                    };
                    childern.push(cellAttr);
                });
            }
            
            columnDefs.push({
                headerName:property.title,
                children:childern
            })
            columnMap[property.title] = colProperty;
        }
        columnDefs.push({headerName: 'Stations', field: 'stations', cellRenderer: 'betweenRenderer', cellEditor: 'station', valueSetter: 'newValueSetter'});
        colKeyOrder.push('stations');
        let globalColmunDef =_.cloneDeep(columnDefs);
        globalColmunDef = await this.createGlobalColumnDefs(globalColmunDef, schema, constraintSchema);

        this.setState({
            columnDefs: columnDefs,
            globalColmunDef: globalColmunDef,
            columnMap: columnMap,
            colKeyOrder: colKeyOrder,
            defaultCellValues: defaultCellValues,
        });
    }

    /**
     * Create AG Grid column definition
     * @param {*} globalColmunDef 
     * @param {*} schema 
     * @param {*} constraintSchema 
     */
    createGlobalColumnDefs(globalColmunDef, schema, constraintSchema) {
        let schedulerValues = [...' ', ...constraintSchema.schema.properties.scheduler.enum];
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

    async getTaskTemplateSchema(scheduleUnit, taskName) {
        let strategyId = scheduleUnit.observation_strategy_template_id;
        let templates = await ScheduleService.getObservationStrategies();
        const observStrategy = _.find(templates, {'id': strategyId});
        const tasks = observStrategy.template.tasks;    
         
        let schema = { type: 'object', additionalProperties: false, 
                        properties: {}, definitions:{}
                     };
        let paramsOutput = {};
        // TODo: This schema reference resolving code has to be moved to common file and needs to rework
        for (const taskName in tasks) {
            const task = tasks[taskName];
            if (task['specifications_template'] === 'target observation') {
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
                            const parameterRef = param.refs[0];
                            tempProperty = $templateRefs.get(parameterRef);
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
        }
    return schema;
    }

    async getTaskSchema(scheduleUnit) {
        let strategyId = scheduleUnit.observation_strategy_template_id;
        let tasksToUpdate = {};
        const observStrategy = _.find(this.observStrategies, {'id': strategyId});
        const tasks = observStrategy.template.tasks;    
        let paramsOutput = {};
        let schema = { type: 'object', additionalProperties: false, 
                        properties: {}, definitions:{}
                     };
        let taskDrafts = [];
        if (scheduleUnit.id) {
            await ScheduleService.getTasksDraftBySchedulingUnitId(scheduleUnit.id).then(response =>{
                taskDrafts = response.data.results;
            }); 
        }
        
        for (const taskName in tasks)  {
            const task = tasks[taskName];
            const taskDraft = taskDrafts.find(taskD => taskD.name === taskName);
            if (taskDraft) {
                task.specifications_doc = taskDraft.specifications_doc;
            }
            //Resolve task from the strategy template
            const $taskRefs = await $RefParser.resolve(task);
            // TODo: This schema reference resolving code has to be moved to common file and needs to rework
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
                        const parameterRef = param.refs[0];
                        tempProperty = $templateRefs.get(parameterRef);
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
            if (taskTemplate.type_value === 'observation' && task.specifications_doc.station_groups) {
                tasksToUpdate[taskName] = taskName;
            }
            this.setState({ paramsOutput: paramsOutput, tasksToUpdate: tasksToUpdate});
        }
        return schema;
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
            await this.setState({
                commonRowData: tmpRowData
             });
             this.state.topGridApi.setRowData(this.state.commonRowData);
             this.state.topGridApi.redrawRows();
        }
        else {
            row = this.state.rowData[rowIndex];
            row[field] = value;
            tmpRowData = this.state.rowData;
            tmpRowData[rowIndex] = row;
            await this.setState({
                rowData: tmpRowData,
                isDirty: true
             });
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
            await this.setState({
                commonRowData: tmpRowData
             });
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
            await this.setState({
                rowData: tmpRowData,
                isDirty: true
             });
             if(field !== 'daily') {
                this.state.gridApi.stopEditing();
                var focusedCell = this.state.gridColumnApi.getColumn(field)
                this.state.gridApi.ensureColumnVisible(focusedCell);
                this.state.gridApi.setFocusedCell(rowIndex, focusedCell);
            }
        }
    }
 
    /**
     * Get Station details
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
                    })
                }
            });
        }
        return stationValue;
    }

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
                    property.title = param.name;
                    property.default = $taskRefs.get(param.refs[0].replace(`#/tasks/${taskName}`, '#'));
                    if ( param.name === 'Duration') {
                        paramsOutput[param.name] = {'param_0': property.default};
                    } else {
                        paramsOutput[param.name] = property.default;
                    }
                }
            }
        }
        return paramsOutput;        
    }

    /**
     * Function to prepare ag-grid row data. 
     */
    async prepareScheduleUnitListForGrid(){
        if (this.state.schedulingUnitList.length === 0) {
            return;
        }
        this.tmpRowData = [];
        let totalSU = this.state.noOfSU;
        let lastRow = {};
        let hasSameValue = true;
        //refresh column header
        await this.createGridColumns(this.state.schedulingUnitList[0]);
        let observationPropsList = [];
        for(const scheduleunit of this.state.schedulingUnitList){
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
                                observationProps[excelColumns[eColKey]] = valueItem[eColKey];
                            }
                        }
                    }
                }
            } else {
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
                //console.log("SU id:", scheduleunit.id, "Connstraint:", constraint.sky);
                UnitConversion.radiansToDegree(constraint.sky);
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
            }
            else if (!_.isEqual(
                    _.omit(lastRow, ['id']),
                    _.omit(observationProps, ['id'])
                  ))  {
                hasSameValue = false;
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
            const paramsOutputKey = Object.keys( this.tmpRowData[0]);
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
                this.tmpRowData.push(emptyRow);
            } 
        }
        if(this.isNewSet) {
            defaultCommonRowData = this.tmpRowData[this.tmpRowData.length-1];
        }
        this.setState({
            rowData: this.tmpRowData,
            totalCount: totalCount,
            noOfSU: this.tmpRowData.length,
            emptyRow: this.tmpRowData[this.tmpRowData.length-1],
            isAGLoading: false,
            commonRowData: [defaultCommonRowData],
            defaultCommonRowData: defaultCommonRowData,
            hasSameValue: hasSameValue
        });
        
        this.setDefaultCellValue();
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
            row[field+'value'] = UnitConverter.getAngleOutput(value,isDegree);
            tmpRowData = this.state.commonRowData;
            tmpRowData[0] = row;
            await this.setState({
                commonRowData: tmpRowData
             });
        }
        else {
            row = this.state.rowData[rowIndex];
            row[field] = value;
            row['isValid'] = isValid;
            row[field+'value'] = UnitConverter.getAngleOutput(value,isDegree);
            tmpRowData = this.state.rowData;
            tmpRowData[rowIndex] = row;
            await this.setState({
                rowData: tmpRowData,
                isDirty: true
             });
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

    async topAGGridEvent(e) {
        var key = e.which || e.keyCode;
        var ctrl = e.ctrlKey ? e.ctrlKey : ((key === 17) ? true : false);
        if ( ctrl && (key === 67 || key === 86)) {
            this.showIcon = true;
            this.dialogType = "warning";
            this.dialogHeader = "Warning";
            this.dialogMsg = "Copy / Paste is restricted in this grid";
            this.dialogContent = "";
            this.callBackFunction = this.close;
            this.onClose = this.close;
            this.onCancel = this.close;
            this.setState({
                confirmDialogVisible: true,
            });
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
                line += rowData[key] + '\t';
            }
            line = _.trim(line);
            clipboardData += line + '\r\n'; 
        }
        clipboardData = _.trim(clipboardData);
        
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
                        clipboardData = _.trim(clipboardData);
                        let suGridRowData = this.state.emptyRow;
                        clipboardData = _.trim(clipboardData);
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
                                suGridRowData[key] = suRow[colCount];
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
                })
                this.state.gridApi.setRowData(this.state.rowData);
                this.state.gridApi.redrawRows();
            }
        }
        catch (err) {
            console.error('Error: ', err);
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
     * Set state to copy the table header to clipboard
     * @param {*} value 
     */
    async copyHeader(value) {
        await this.setState({'copyHeader': value});
    }

    /**
     * Validate Grid values on click Save button from UI
     */
    async validateGridAndSave(){
        let validCount = 0;
        let inValidCount = 0;
        let isValidRow = true;
        let errorDisplay = [];
        const mandatoryKeys = ['suname','sudesc','scheduler','min_target_elevation','min_calibrator_elevation','offset_from','offset_to','md_sun','md_moon','md_jupiter','tp1angle1','tp1angle2','tp1angle3','tp1direction_type','tp2angle1','tp2angle2','tp2angle3','tp2direction_type','tbangle1','tbangle2','tbangle3','tbdirection_type'];
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
                           // rowNoColumn = column;
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
                                    if ( Number(rowData[column.colId] < 0)){
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
            this.onClose = () => {
                this.setState({confirmDialogVisible: false});
            };
            this.setState({
                confirmDialogVisible: true, 
            });
            
        }  else  {
            this.setState({
                validCount: validCount,
                inValidCount: inValidCount,
                tmpRowData: tmpRowData,
                //saveDialogVisible: true,
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
     * Function to create Scheduling unit
     */
    async saveSchedulingUnit(){
        this.validateGridAndSave();
    }


    /**
     * Save/Update Scheduling Unit
     */
    async saveSU() {
        let newSUCount = 0;
        let existingSUCount = 0;
        try{
            this.setState({
               // saveDialogVisible: false,
                confirmDialogVisible: false,
                showSpinner: true
            })
         
            let newSU = this.state.schedulingUnit;
            let parameters = this.state.schedulingUnitList[0]['requirements_doc'].parameters;
            let columnMap = this.state.columnMap;
           
            for(const suRow of this.state.rowData){
                if  (!suRow['isValid']){
                    continue;
                }
                let validRow = true;
                let paramsOutput = {};
                let index = 0;
                for(const parameter of parameters){
                    let paramOutput = {};
                    let result = columnMap[parameter.name];
                    let resultKeys =  Object.keys(result);
                    resultKeys.forEach(key => {
                        if  (key === 'angle1') {
                            if  (!Validator.validateTime(suRow[result[key]])) {
                                validRow = false;
                                return;
                            }
                            paramOutput[key] = UnitConverter.getAngleOutput(suRow[result[key]],false);
                        } else if (key === 'angle2'){
                            if  (!Validator.validateAngle(suRow[result[key]])){
                                validRow = false;
                                return;
                            }
                            paramOutput[key] = UnitConverter.getAngleOutput(suRow[result[key]],true);
                        }  else if (key === 'angle3'){
                            paramOutput[key] = Number(suRow[result[key]]);

                        } else  {
                            paramOutput[key] = suRow[result[key]];
                        }
                    })
                    paramsOutput['param_'+index] = paramOutput;
                    index++;
                } 
                if  (!validRow){
                    continue;
                }
               
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
                    tmpStationGroup['max_nr_missing'] = Number(sgValue[1]);
                    tmpStationGroups.push(tmpStationGroup);
                    }
                })
                     
                let observStrategy = _.cloneDeep(this.state.observStrategy);
                const $refs = await $RefParser.resolve(observStrategy.template);
                observStrategy.template.parameters.forEach(async(param, index) => {
                    let key = observStrategy.template.parameters[index]['refs'][0];
                    let fieldValue = paramsOutput['param_' + index];
                    let value = (key.endsWith('duration'))? parseInt(fieldValue['param_' + index]) : fieldValue;
                   $refs.set(observStrategy.template.parameters[index]['refs'][0], value);
                });
                if ( suRow.id === 0) {
                    for (const taskName in observStrategy.template.tasks) {
                        let task = observStrategy.template.tasks[taskName];
                        if (task.specifications_doc.station_groups) {
                            task.specifications_doc.station_groups = tmpStationGroups;
                        }
                    }
                }
               
                let between = this.getBetWeenDateValue(suRow.between);
                let notbetween = this.getBetWeenDateValue(suRow.notbetween);
                
                let isNewConstraint = false;
                let newConstraint = {};
                let constraint = null;
                if  (suRow.id > 0){
                    newSU = _.find(this.state.schedulingUnitList, {'id': suRow.id}); 
                    constraint = newSU.scheduling_constraints_doc;
                } 
                
                if  ( constraint === null || constraint === 'undefined' || constraint === {}){
                    constraint = this.state.schedulingConstraintsDoc;
                    isNewConstraint = true;
                }
                
                //If No SU Constraint create default ( maintain default struc)
                constraint['scheduler'] = suRow.scheduler;
                if  (suRow.scheduler === 'dynamic'  || suRow.scheduler === 'online'){
                    if (this.isNotEmpty(suRow.timeat)) {
                        delete constraint.time.at;
                    }   /*else {
                        constraint.time.at = `${moment(suRow.timeat).format("YYYY-MM-DDTHH:mm:ss.SSSSS", { trim: false })}Z`;
                    }*/
                  
                    if (!this.isNotEmpty(suRow.timeafter)) {
                        delete constraint.time.after;
                    }   /*else {
                        constraint.time.after = `${moment(suRow.timeafter).format("YYYY-MM-DDTHH:mm:ss.SSSSS", { trim: false })}Z`;
                    }*/
                   
                    if (!this.isNotEmpty(suRow.timebefore)) {
                        delete constraint.time.before;
                    }   /*else {
                        constraint.time.before = `${moment(suRow.timebefore).format("YYYY-MM-DDTHH:mm:ss.SSSSS", { trim: false })}Z`;
                    }*/
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
                
                UnitConversion.degreeToRadians(constraint.sky);
                
                if  (isNewConstraint){
                    newSU.scheduling_constraints_doc = constraint;
                }
              
                if  (suRow.id === 0){
                    newConstraint['scheduling_constraints_doc'] = constraint;
                    newConstraint['id'] = this.state.constraintId;
                    newConstraint['constraint'] = {'url':''};
                    newConstraint.constraint.url = this.state.constraintUrl;
                }

                if  (suRow.id > 0 && this.isNotEmpty(suRow.suname) && this.isNotEmpty(suRow.sudesc)){
                    newSU = _.find(this.state.schedulingUnitList, {'id': suRow.id}); 
                    newSU['name'] = suRow.suname;
                    newSU['description'] = suRow.sudesc;
                    let taskdata = await ScheduleService.getTasksDraftBySchedulingUnitId(suRow.id);
                    let taskDrafts =[];
                    if(taskdata){
                        taskDrafts = taskdata.data.results;
                    }
                    await ScheduleService.updateSUDraftFromObservStrategy(observStrategy, newSU, taskDrafts, this.state.tasksToUpdate, tmpStationGroups);
                    existingSUCount++;
                }
                else if  (suRow.id === 0 && this.isNotEmpty(suRow.suname) && this.isNotEmpty(suRow.sudesc)){
                    let newSchedulueUnit = {
                        description: suRow.sudesc,
                        name: suRow.suname,
                        scheduling_constraints_template_id: newSU['scheduling_constraints_template_id'],
                        scheduling_set_id: newSU['scheduling_set_id']
                    }
                    await ScheduleService.saveSUDraftFromObservStrategy(observStrategy, newSchedulueUnit, newConstraint, tmpStationGroups);
                    newSUCount++;
                }
            }
            
            if  ((newSUCount+existingSUCount) > 0){
                //const dialog = {header: 'Success', detail: '['+newSUCount+'] Scheduling Units are created & ['+existingSUCount+'] Scheduling Units are updated successfully.'};
                // this.setState({  showSpinner: false, dialogVisible: true, dialog: dialog, isAGLoading: true, copyHeader: false, rowData: []});
                this.dialogType = "success";
                this.dialogHeader = "Success";
                this.showIcon = true;
                this.dialogMsg = '['+newSUCount+'] Scheduling Units are created & ['+existingSUCount+'] Scheduling Units are updated successfully.';
                this.dialogContent = "";
                this.onCancel = this.close;
                this.onClose = this.close;
                this.callBackFunction = this.reset;
                this.setState({isDirty : false, showSpinner: false, confirmDialogVisible: true, /*dialog: dialog,*/ isAGLoading: true, copyHeader: false, rowData: []});
            }  else  {
                this.setState({isDirty: false, showSpinner: false,});
                this.growl.show({severity: 'error', summary: 'Warning', detail: 'No Scheduling Units create/update '});
            }
        }catch(err){
            this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to create/update Scheduling Units'});
        }
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
     * Convert the date to string value for Between And Not-Between Columns
     * @param {*} dates 
     */
    getBetweenStringValue(dates){
        let returnDate = '';
        if  (dates){
            dates.forEach(utcDateArray => {
                returnDate += moment.utc(utcDateArray.from).format(UIConstants.CALENDAR_DATETIME_FORMAT)+",";
                returnDate += moment.utc(utcDateArray.to).format(UIConstants.CALENDAR_DATETIME_FORMAT)+"|";
            })
        }
       return returnDate;
    }
    
    /**
     * convert String to Date value for Between And Not-Between Columns
     */
    getBetWeenDateValue(betweenValue){
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

    async onGridReady (params) { 
        await this.setState({
            gridApi:params.api,
            gridColumnApi:params.columnApi,
        })
        this.state.gridApi.hideOverlay();
    }
 
    async onTopGridReady (params) {
        await this.setState({
            topGridApi:params.api,
            topGridColumnApi:params.columnApi,
        })
        this.state.topGridApi.hideOverlay();
    }

   async setNoOfSUint(value){
        this.setState({isDirty: true, isAGLoading: true});
        if  (value >= 0 && value < 501){
            await this.setState({
                noOfSU: value
            })
        }  else  {
            await this.setState({
                noOfSU: 500
            })
        }

        let noOfSU = this.state.noOfSU;
        this.tmpRowData = [];
        if (this.state.rowData && this.state.rowData.length >0 && this.state.emptyRow) {
            if (this.state.totalCount <= noOfSU) {
                for (var count = 0; count < noOfSU; count++) {
                    if(this.state.rowData.length > count ) {
                        this.tmpRowData.push(_.cloneDeep(this.state.rowData[count]));
                    }   else {
                        this.tmpRowData.push(_.cloneDeep(this.state.emptyRow));
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
     
    /**
     * Show the content in custom dialog
     */
    showDialogContent(){
        if (typeof this.state.errorDisplay === 'undefined' || this.state.errorDisplay.length === 0 ){
            return "";
        }
        else {
            return <> <br/>Invalid Rows:- Row # and Invalid columns <br/>{this.state.errorDisplay && this.state.errorDisplay.length>0 && 
                this.state.errorDisplay.map((msg, index) => (
                <React.Fragment key={index+10} >
                    <span key={'label1-'+ index}>{msg}</span> <br />
                </React.Fragment>
            ))} </>
        }
    }

    /**
     * Set default value for empty rows
     */
    async setDefaultCellValue(){
        if(this.state.rowData && this.state.rowData.length > 0){
            if (!this.state.showDefault){
                let tmpRowData = this.state.rowData;
                let defaultValueColumns = Object.keys(this.state.defaultCellValues);
                await tmpRowData.forEach(rowData => {
                    defaultValueColumns.forEach(key => {
                        if(!this.isNotEmpty(rowData[key])){
                            rowData[key] = this.state.defaultCellValues[key];
                        }
                    })
                });
                await this.setState({
                    rowData: tmpRowData,
                   // showDefault: true,
                });
               
            }
            {this.state.gridApi && 
                this.state.gridApi.setRowData(this.state.rowData);
            }
        }
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
                Object.keys(row).forEach(key => {
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

    /**
     * Update isDirty when ever cell value updated in AG grid
     * @param {*} params 
     */
    cellValueChageEvent(params) {
        if( params.value && !_.isEqual(params.value, params.oldValue)) {
            this.setState({isDirty: true});
        }
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
    
    async refreshSchedulingSet(){
        this.schedulingSets = await ScheduleService.getSchedulingSets();
        const filteredSchedluingSets = _.filter(this.schedulingSets, {'project_id': this.state.schedulingUnit.project});
        this.setState({saveDialogVisible: false, confirmDialogVisible: false, schedulingSets: filteredSchedluingSets});
    }

    close(){
        this.setState({confirmDialogVisible: false});
    }

    showAddSchedulingSet() {
        this.showIcon = false;
        this.dialogType = "success";
        this.dialogHeader = "Add Scheduling Set’";
        this.dialogMsg = <SchedulingSet project={this.state.selectedProject[0]} onCancel={this.refreshSchedulingSet} />;
        this.dialogContent = "";
        this.showIcon = false;
        this.callBackFunction = this.refreshSchedulingSet;
        this.onClose = this.refreshSchedulingSet;
        this.onCancel = this.refreshSchedulingSet;
        this.setState({
            confirmDialogVisible: true,
        });
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
                <CustomDialog type={this.dialogType} visible={this.state.confirmDialogVisible} width="40vw" height={this.dialogHeight}
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