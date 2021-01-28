import React, {Component} from 'react';
import { Redirect } from 'react-router-dom';

import {Dropdown} from 'primereact/dropdown';
import { Button } from 'primereact/button';
import {Dialog} from 'primereact/components/dialog/Dialog';
import {Growl} from 'primereact/components/growl/Growl';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModules } from '@ag-grid-community/all-modules';
import $RefParser from "@apidevtools/json-schema-ref-parser";

import TimeInputmask from './../../components/Spreadsheet/TimeInputmask'
import DegreeInputmask from './../../components/Spreadsheet/DegreeInputmask'
import NumericEditor from '../../components/Spreadsheet/numericEditor';
import BetweenEditor from '../../components/Spreadsheet/BetweenEditor'; 
import BetweenRenderer from '../../components/Spreadsheet/BetweenRenderer';
import MultiSelector from '../../components/Spreadsheet/MultiSelector';
import AppLoader from '../../layout/components/AppLoader';

import PageHeader from '../../layout/components/PageHeader';
import { CustomDialog } from '../../layout/components/CustomDialog';
import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import TaskService from '../../services/task.service';
import CustomDateComp from '../../components/Spreadsheet/CustomDateComp';

import Validator from  '../../utils/validator';
import UnitConverter from '../../utils/unit.converter'
import UIConstants from '../../utils/ui.constants';
import UnitConversion from '../../utils/unit.converter';
import StationEditor from '../../components/Spreadsheet/StationEditor';


import moment from 'moment';
import _ from 'lodash';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const BG_COLOR= '#f878788f';

/**
 * Component to create / update Scheduling Unit Drafts using Spreadsheet
 */
export class SchedulingSetCreate extends Component {
    constructor(props) {
        super(props);
        this.gridApi = ''
        this.gridColumnApi = ''
        this.rowData = [];
        this.tmpRowData = [];
        this.defaultCellValues = [];
        this.daily = [];

        this.state = {
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
            saveDialogVisible: false,
        }

        this.onGridReady = this.onGridReady.bind(this);
        this.validateForm = this.validateForm.bind(this);
        this.validateEditor = this.validateEditor.bind(this);
        this.saveSchedulingUnit = this.saveSchedulingUnit.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.clipboardEvent = this.clipboardEvent.bind(this);
        this.reset = this.reset.bind(this);
        this.close = this.close.bind(this);
        this.saveSU = this.saveSU.bind(this);
        this.validateGridAndSave = this.validateGridAndSave.bind(this);
        this.showDialogContent = this.showDialogContent.bind(this);

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
                this.setState({isLoading: false, schedulingSets: projectSchedluingSets});
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
        const projectSchedluingSets = _.filter(this.schedulingSets, {'project_id': projectName});
        let schedulingUnit = this.state.schedulingUnit;
        schedulingUnit.project = projectName;
        this.setState({schedulingUnit: schedulingUnit, schedulingSets: projectSchedluingSets, validForm: this.validateForm('project'), rowData: [],observStrategy: {}});
    }
 
    /**
     * Function to set form values to the SU object
     * @param {string} key 
     * @param {object} value 
     */
    async setSchedulingSetParams(key, value) {
        this.setState({isAGLoading: true});

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

    async setDefaultStationGroup(observStrategy) {
        let station_group = [];
        const tasks = observStrategy.template.tasks;    
        for (const taskName of _.keys(tasks)) {
            const task = tasks[taskName];
            //Resolve task from the strategy template
            const $taskRefs = await $RefParser.resolve(task);
            // Identify the task specification template of every task in the strategy template
            const taskTemplate = _.find(this.taskTemplates, {'name': task['specifications_template']});
            if (taskTemplate.type_value==='observation' && task.specifications_doc.station_groups) {
                station_group = task.specifications_doc.station_groups;
            }
        }
        await this.setState({
            defaultStationGroups: station_group,
        })
    }
    /**
     * Function called when observation strategy template is changed. 
     *
     * @param {number} strategyId 
     */
    async changeStrategy (strategyId) {
        this.setState({isAGLoading: true});
        const observStrategy = _.find(this.observStrategies, {'id': strategyId});
        let schedulingUnitList= await ScheduleService.getSchedulingBySet(this.state.selectedSchedulingSetId);
        schedulingUnitList = _.filter(schedulingUnitList,{'observation_strategy_template_id': strategyId}) ;
        this.setDefaultStationGroup(observStrategy);
        await this.setState({
            schedulingUnitList: schedulingUnitList,
            observStrategy: observStrategy,
        })
        
        if  (schedulingUnitList && schedulingUnitList.length >0){
            await this.prepareScheduleUnitListForGrid();
        }  else  {
            this.setState({
                rowData: []
            })
        }
        // this.state.gridApi.setRowData(this.state.rowData)
        //this.state.gridApi.redrawRows();
        this.setState({isAGLoading: false});
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

    async getConstraintSchema(scheduleUnit){
       let constraintSchema = await ScheduleService.getSchedulingConstraintTemplate(scheduleUnit.scheduling_constraints_template_id);
       return constraintSchema;
    }
   
    /**
     * Function to generate AG-Grid column definition. 
     * @param {number} strategyId 
     */
    async createGridColumns(scheduleUnit){
        let schema = await this.getTaskSchema(scheduleUnit);
        schema = await this.resolveSchema(schema);
        let constraintSchema =  await this.getConstraintSchema(scheduleUnit);
        constraintSchema = await this.resolveSchema(constraintSchema);

        // AG Grid Cell Specific Properties
        let dailyOption= [];
        let dailyProps = Object.keys( constraintSchema.schema.properties.daily.properties); 
        this.daily = [];
        dailyProps.forEach(prop => {
            dailyOption.push({'Name':prop, 'Code':prop});
            this.daily.push(prop);
        }) 

        this.setState({
            dailyOption: this.dailyOption,
            schedulingConstraintsDoc: scheduleUnit.scheduling_constraints_doc,
            constraintUrl: scheduleUnit.scheduling_constraints_template,
            constraintId: scheduleUnit.scheduling_constraints_template_id,
            daily: this.daily,
        });

        let cellProps =[];
        cellProps['angle1'] = {isgroup: true, type:'numberValueColumn', cellRenderer: 'timeInputMask',cellEditor: 'timeInputMask', valueSetter: 'valueSetter', };
        cellProps['angle2'] = {isgroup: true, type:'numberValueColumn', cellRenderer: 'degreeInputMask',cellEditor: 'degreeInputMask', valueSetter: 'valueSetter' };
        cellProps['angle3'] = {isgroup: true, cellEditor: 'numericEditor', cellStyle: function(params) { if  (params.value){
			if (!Number(params.value)) {
				return { backgroundColor: BG_COLOR};
			}
			else if ( Number(params.value) < 0||   Number(params.value) > 90) {
				return { backgroundColor: BG_COLOR};
			} else{
				return { backgroundColor: ''};
			}
		}}}; 
        cellProps['direction_type'] = {isgroup: true, cellEditor: 'agSelectCellEditor',default: schema.definitions.pointing.properties.direction_type.default,
            cellEditorParams: {
                values: schema.definitions.pointing.properties.direction_type.enum,
            }, 
        };
       
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
                        if  (params.data.suname && params.data.suname !== '' && params.value === '') {
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
               
            {headerName: 'Between',field: 'between',cellRenderer: 'betweenRenderer',cellEditor: 'betweenEditor',valueSetter: 'newValueSetter', },
            {headerName: 'Not Between',field: 'notbetween',cellRenderer: 'betweenRenderer',cellEditor: 'betweenEditor',valueSetter: 'newValueSetter'},
            {headerName: 'Daily',field: 'daily',cellEditor: 'multiselector', valueSetter: 'valueSetter'},
            {
            headerName: 'Sky',
            children: [
                {headerName: 'Min Target Elevation',field: 'min_target_elevation', cellStyle: function(params) {
                    if  (params.value){
                        if ( !Number(params.value)){
                            return { backgroundColor: BG_COLOR};
                        }
                        else if ( Number(params.value) < 0||   Number(params.value) > 90) {
                            return { backgroundColor: BG_COLOR};
                        } else{
                            return { backgroundColor: ''};
                        }
                    }
                }, },
                {headerName: 'Min Calibrator Elevation',field: 'min_calibrator_elevation',  cellStyle: function(params) {
                    if  (params.value){
                        if ( !Number(params.value)){
                            return { backgroundColor: BG_COLOR};
                        }
                        else if ( Number(params.value) < 0||   Number(params.value) > 90) {
                            return { backgroundColor: BG_COLOR};
                        } else{
                            return { backgroundColor: ''};
                        }
                    }
                }, },
                {headerName: 'Offset Window From',field: 'offset_from', cellStyle: function(params) {
                    if  (params.value){
                        if  (params.value === 'undefined' || params.value === ''){
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
                {headerName: 'Offset Window To',field: 'offset_to', cellStyle: function(params) {
                    if  (params.value){
                        if  (params.value === 'undefined' || params.value === ''){
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
                {headerName: 'Sun',field: 'md_sun', cellStyle: function(params) {
                    if  (params.value){
                        if ( !Number(params.value)){
                            return { backgroundColor: BG_COLOR};
                        }
                        else if ( Number(params.value) < 0 ||   Number(params.value) > 180) {
                            return { backgroundColor: BG_COLOR};
                        } else{
                            return { backgroundColor: ''};
                        }
                    }
                   
                },},
                {headerName: 'Moon',field: 'md_moon', cellStyle: function(params) {
                    if  (params.value){
                        if ( !Number(params.value)){
                            return { backgroundColor: BG_COLOR};
                        }
                        else if ( Number(params.value) < 0 ||   Number(params.value) > 180) {
                            return { backgroundColor: BG_COLOR};
                        } else{
                            return { backgroundColor: ''};
                        }
                    }
                }, },
                {headerName: 'Jupiter',field: 'md_jupiter', cellStyle: function(params) {
                    if  (params.value){
                        if ( !Number(params.value)){
                            return { backgroundColor: BG_COLOR};
                        }
                        else if ( Number(params.value) < 0 ||   Number(params.value) > 180) {
                            return { backgroundColor: BG_COLOR};
                        } else{
                            return { backgroundColor: ''};
                        }
                    }
                }, },
            ],
            },
        ];
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

        colProperty ={'ID':'id', 'Name':'suname', 'Description':'sudesc'};
        columnMap['Scheduling Unit'] = colProperty;

        let definitions = schema.definitions.pointing.properties;
        let properties = schema.properties;
        const propsKeys = Object.keys(properties);
        for(const propKey of propsKeys){
            let property = properties[propKey];
            let childern = [];
            colProperty = {};
            
            let childalias = property.title;
            childalias = _.lowerCase(childalias).split(' ').map(x => x[0]).join('');
            const paramKeys = Object.keys(property.default);
            paramKeys.forEach(key =>{
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
            })
            columnDefs.push({
                headerName:property.title,
                children:childern
            })
            columnMap[property.title] = colProperty;
        }
        columnDefs.push({headerName: 'Stations', field: 'stations', cellRenderer: 'betweenRenderer', cellEditor: 'station', valueSetter: 'newValueSetter'});
        colKeyOrder.push('stations');
        this.setState({
            columnDefs:columnDefs,
            columnMap:columnMap,
            colKeyOrder:colKeyOrder
        })
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
        
        let taskDrafts= [];
        await ScheduleService.getTasksDraftBySchedulingUnitId(scheduleUnit.id).then(response =>{
            taskDrafts= response.data.results;
        })
     
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
        return schema;
    }
    /**
     * CallBack Function : update time value in master grid
     */
    async updateTime(rowIndex, field, value) {
        let row = this.state.rowData[rowIndex];
        row[field] = value;
        let tmpRowData =this.state.rowData;
        tmpRowData[rowIndex]= row;
        await this.setState({
           rowData: tmpRowData
        });
        this.state.gridApi.setRowData(this.state.rowData);
        this.state.gridApi.redrawRows();
      }

      /**
       * Update the Daily column value from external component
       * @param {*} rowIndex 
       * @param {*} field 
       * @param {*} value 
       */
    async updateDailyCell(rowIndex, field, value) {
        let row = this.state.rowData[rowIndex];
        row[field] = value;
        let tmpRowData =this.state.rowData;
        tmpRowData[rowIndex]= row;
        await this.setState({
           rowData: tmpRowData
        });
    }
 
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
                  if (targetObservation && targetObservation.specifications_doc.station_groups){
                    stationGroups = targetObservation?targetObservation.specifications_doc.station_groups:[];
                  }  else  {
                     targetObservation = taskDrafts.data.results.find(task => {return task.specifications_doc.station_groups?true:false});
                     stationGroups = targetObservation?targetObservation.specifications_doc.station_groups:[];
                  }
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

    /**
     * Function to prepare ag-grid row data. 
     */
    async prepareScheduleUnitListForGrid(){
        if (this.state.schedulingUnitList.length===0) {
            return;
        }
        this.tmpRowData = [];
        let totalSU = this.state.noOfSU;
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

            let parameters = scheduleunit['requirements_doc'].parameters;
            for(const parameter of parameters){
                let refUrl = parameter['refs'];
                let valueItem = (await $RefParser.resolve( scheduleunit['requirements_doc'])).get(refUrl[0]);
                let excelColumns = this.state.columnMap[parameter.name];
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
            observationProps['stations'] = await this.getStationGrops(scheduleunit);
            let constraint = scheduleunit.scheduling_constraints_doc;
            if  (constraint){
                if  (constraint.scheduler){
                    observationProps['scheduler'] = constraint.scheduler;
                }
                observationProps['timeat'] = moment.utc(constraint.time.at).format(DATE_TIME_FORMAT);
                observationProps['timeafter'] = moment.utc(constraint.time.after).format(DATE_TIME_FORMAT);
                observationProps['timebefore'] = moment.utc(constraint.time.before).format(DATE_TIME_FORMAT);
                if  (constraint.time.between){
                    observationProps['between'] = this.getBetweenStringValue(constraint.time.between);
                }
                if  (constraint.time.between){
                    observationProps['notbetween'] = this.getBetweenStringValue(constraint.time.not_between);
                }
               
                observationProps['daily'] = this.fetchDailyFieldValue(constraint.daily);
                UnitConversion.radiansToDegree(constraint.sky);
                observationProps['min_target_elevation'] = constraint.sky.min_target_elevation;
                observationProps['min_calibrator_elevation'] = constraint.sky.min_calibrator_elevation;
                if  ( constraint.sky.transit_offset ){
                    observationProps['offset_from'] = (constraint.sky.transit_offset.from)?constraint.sky.transit_offset.from:'';
                    observationProps['offset_to'] = (constraint.sky.transit_offset.to)?constraint.sky.transit_offset.to:'';
                }
                
               if  (constraint.sky.min_distance){
                observationProps['md_sun'] = (constraint.sky.min_distance.sun)?constraint.sky.min_distance.sun:'';
                observationProps['md_moon'] =  (constraint.sky.min_distance.moon)?constraint.sky.min_distance.moon:'';
                observationProps['md_jupiter'] =  (constraint.sky.min_distance.jupiter)?constraint.sky.min_distance.jupiter:'';
               }
                
            }
            observationPropsList.push(observationProps);
        }
         
        this.tmpRowData = observationPropsList;
        // find No. of rows filled in array
        let totalCount = this.tmpRowData.length;
         // Prepare No. Of SU for rows for UI
        if  (this.tmpRowData && this.tmpRowData.length>0){
            const paramsOutputKey = Object.keys( this.tmpRowData[0]);
            const availableCount = this.tmpRowData.length;
            if  (availableCount >= totalSU){
                totalSU = availableCount+5;
            }
            for(var i = availableCount; i<totalSU; i++){
                let emptyRow =  {};
                paramsOutputKey.forEach(key =>{
                    if  (key === 'id'){
                        emptyRow[key]= 0;
                    }  else  {
                        emptyRow[key]= '';
                    }
                })
                this.tmpRowData.push(emptyRow);
            } 
        }
        this.setState({
            rowData: this.tmpRowData,
            totalCount: totalCount,
            noOfSU: totalSU,
            emptyRow: this.tmpRowData[this.tmpRowData.length-1]
        });
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
        let row = this.state.rowData[rowIndex];
        row[field] = value;
        row['isValid'] = isValid;
        //Convertverted value for Angle 1 & 2, set in SU Row 
        row[field+'value'] = UnitConverter.getAngleOutput(value,isDegree);
        let tmpRowData =this.state.rowData;
        tmpRowData[rowIndex]= row;
        await this.setState({
           rowData: tmpRowData
        });
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

 /*
 // to resolve the invalid degree and time
    resolveCellData(data){
        console.log('data >',data)
        let angleData = _.split(data, ":");
        let returnValue ='';
        if  (angleData.length === 3){
            returnValue = (angleData[0].length === 2)?angleData[0] :'0'+angleData[0]+":";
            returnValue += (angleData[1].length === 2)?angleData[1] :'0'+angleData[1]+":";
            returnValue += (angleData[2].length === 2)?angleData[2] :'0'+angleData[2];
           
        }
        console.log('returnValue',returnValue)
        return returnValue;    
    } 
    */

      /**
     * Copy data to/from clipboard
     * @param {*} e 
     */
    async clipboardEvent(e){
        //let angleCellKey = ['tp1angle1','tp1angle2','tp2angle1','tp2angle2','tpangle1','tpangle2'];
        var key = e.which || e.keyCode;
        var ctrl = e.ctrlKey ? e.ctrlKey : ((key === 17) ? true : false);
        if ( key === 86 && ctrl ) {
            // Ctrl+V
            this.tmpRowData = this.state.rowData;
            let dataRowCount = this.state.totalCount;
            try {
                let clipboardData = '';
                try{
                     //Read Clipboard Data
                    clipboardData = await this.readClipBoard();
                }catch(err){
                    console.log("error :",err);
                }
              if  (clipboardData){
                    clipboardData = _.trim(clipboardData);
                    let suGridRowData= this.state.emptyRow;
                    clipboardData = _.trim(clipboardData);
                    let suRows = clipboardData.split("\n");
                    suRows.forEach(line =>{
                        let colCount = 0;
                        suGridRowData ={};
                        let suRow = line.split("\t");
                        suGridRowData['id']= 0;
                        suGridRowData['isValid']= true;
                        for(const key of this.state.colKeyOrder){
                            /* if  (_.includes(angleCellKey, key)){
                                 suGridRowData[key]= this.resolveCellData(suRow[colCount]);
                             }  else  {*/
                                suGridRowData[key]= suRow[colCount];
                          //  }
                            colCount++;
                        }
                        this.tmpRowData[dataRowCount]= (suGridRowData);
                        dataRowCount++
                    }) 
                }
                let emptyRow = this.state.emptyRow;
                let tmpNoOfSU= this.state.noOfSU;
                if  (dataRowCount >= tmpNoOfSU){
                    tmpNoOfSU = dataRowCount+5;
                    //Create additional empty row at the end
                    for(let i= this.tmpRowData.length; i<=tmpNoOfSU; i++){
                        this.tmpRowData.push(emptyRow);
                    }
                }

                await this.setState({
                    rowData: this.tmpRowData,
                    noOfSU: this.tmpRowData.length,
                    totalCount: dataRowCount,
                })
                
                this.state.gridApi.setRowData(this.state.rowData);
                this.state.gridApi.redrawRows();

              }catch (err) {
                console.error('Error: ', err);
              }
             
        } else if ( key === 67 && ctrl ) {
            //Ctrl+C
            var selectedRows = this.state.gridApi.getSelectedRows();
            let clipboardData = '';
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
        } else if ( key  === 46){
            // Delete selected rows
            let tmpRowData = this.state.rowData;
          
            var selectedRows = this.state.gridApi.getSelectedNodes();
            if  (selectedRows){
               await selectedRows.map(delRow =>{
                    delete tmpRowData[delRow.rowIndex]
                });
                await this.setState({
                    rowData: tmpRowData
                 });
                 this.state.gridApi.setRowData(this.state.rowData);
                this.state.gridApi.redrawRows();
            }
        }
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
            let errorMsg =  'Row Id ['+(Number(node.rowIndex)+1) +'] : ';
            tmpMandatoryKeys = [];
            const rowData = node.data;
            let isManualScheduler = false;
            if  (rowData) {
                for(const key of mandatoryKeys) {
                    if  (rowData[key] === '') {
                        tmpMandatoryKeys.push(key);
                    }   else if (key === 'scheduler' && rowData[key] === 'manual' ) {
                        isManualScheduler = true;
                    }
                }
                if  (tmpMandatoryKeys.length !== mandatoryKeys.length) {
                    let rowNoColumn = {};
                    isValidRow = true;
                    for (var i = 0; i< node.columnController.gridColumns.length; i++) {
                       let column = node.columnController.gridColumns[i];
                        if  (column.colId === '0'){
                            rowNoColumn = column;
                        }  else  {
                            if  (_.includes(tmpMandatoryKeys, column.colId)){
                                isValidRow = false;
                                errorMsg += column.colDef.headerName+", ";
                                //column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                //rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                            }  else  {
                                if  (column.colId === 'timeat' && isManualScheduler && rowData[column.colId] === ''){
                                    isValidRow = false;
                                     errorMsg += column.colDef.headerName+", ";
                                   // column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                   // rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                } else if (column.colId === 'min_target_elevation' || column.colId === 'min_calibrator_elevation' || _.endsWith(column.colId, "angle3")){
                                    if  (Number(rowData[column.colId]) < 0 ||   Number(rowData[column.colId]) > 90){
                                        isValidRow = false;
                                         errorMsg += column.colDef.headerName+", ";
                                      //  column.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                      //  rowNoColumn.colDef.cellStyle = { backgroundColor: BG_COLOR};
                                    }
                                } else if (column.colId === 'offset_from' || column.colId === 'offset_to'){
                                    if ( !Number(rowData[column.colId])){
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
                                }
                            }
                        }
                    }
                }
            }
            if (isValidRow)  {
                validCount++; 
                tmpRowData[node.rowIndex]['isValid'] = true;
            } else {
                inValidCount++;
                tmpRowData[node.rowIndex]['isValid'] = false;
                errorDisplay.push(errorMsg.slice(0, -2));
            }
        });

        
        if (validCount > 0 && inValidCount === 0) {
            // save SU directly
            this. saveSU();
        } else if (validCount === 0 && inValidCount === 0) {
            // leave with no change
        }  else  {
            this.setState({
                validCount: validCount,
                inValidCount: inValidCount,
                tmpRowData: tmpRowData,
                saveDialogVisible: true,
                errorDisplay: errorDisplay,
            });
            this.state.gridApi.redrawRows();
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
                saveDialogVisible: false
            })
            let observStrategy = _.cloneDeep(this.state.observStrategy);
            const $refs = await $RefParser.resolve(observStrategy.template);
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
                    resultKeys.forEach(key =>{
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
                        }  else  {
                            paramOutput[key] = suRow[result[key]];
                        }
                    })
                    paramsOutput['param_'+index] = paramOutput;
                    index++;
                } 
                if  (!validRow){
                    continue;
                }
                observStrategy.template.parameters.forEach(async(param, index) => {
                    $refs.set(observStrategy.template.parameters[index]['refs'][0], paramsOutput['param_' + index]);
                });

                //Stations
                let sgCellValue = suRow.stations;
                let tmpStationGroups = [];
                if  (sgCellValue && sgCellValue.length >0){
                    tmpStationGroups = [];
                    let tmpStationGroup = {};
                    let stationGroups = _.split(sgCellValue,  "|");
                    stationGroups.map(stationGroup =>{
                      tmpStationGroup = {};
                      let sgValue = _.split(stationGroup, ":");
                      if  (sgValue && sgValue[0].length>0){
                        let stationArray = _.split(sgValue[0], ",");
                         
                        tmpStationGroup['stations'] = stationArray;
                        tmpStationGroup['max_nr_missing'] = sgValue[1];
                        tmpStationGroups.push(tmpStationGroup);
                      }
                      
                    })
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
                if  (suRow.id >0){
                    newSU = _.find(this.state.schedulingUnitList, {'id': suRow.id}); 
                    constraint = newSU.scheduling_constraints_doc;
                } 
                
                if  ( constraint === null || constraint === 'undefined' || constraint === {}){
                    constraint = this.state.schedulingConstraintsDoc;
                    isNewConstraint = true;
                }
                
                //If No SU Constraint create default ( maintan default struc)
                constraint['scheduler'] = suRow.scheduler;
                if  (suRow.scheduler === 'online'){
                    if  (!constraint.time.at){
                        delete constraint.time.at;
                    }
                    if (!constraint.time.after) {
                        delete constraint.time.after;
                    }
                    if (!constraint.time.before) {
                        delete constraint.time.before;
                     }
                }  else  {
                    constraint.time.at = `${moment(suRow.timeat).format("YYYY-MM-DDTHH:mm:ss.SSSSS", { trim: false })}Z`;
                    constraint.time.after = `${moment(suRow.timeafter).format("YYYY-MM-DDTHH:mm:ss.SSSSS", { trim: false })}Z`;
                    constraint.time.before = `${moment(suRow.timebefore).format("YYYY-MM-DDTHH:mm:ss.SSSSS", { trim: false })}Z`;
                }
                if  (between && between.length>0){
                    constraint.time.between = between;
                }
                if  (notbetween && notbetween.length>0){
                    constraint.time.not_between = notbetween; 
                }
                let dailyValueSelected = _.split(suRow.daily, ",");
                this.state.daily.forEach(daily =>{
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

                if  (suRow.id >0 && suRow.suname.length>0 && suRow.sudesc.length>0){
                    newSU = _.find(this.state.schedulingUnitList, {'id': suRow.id}); 
                    newSU['name'] = suRow.suname;
                    newSU['description'] = suRow.sudesc;
 
                    newSU.requirements_doc.tasks= observStrategy.template.tasks;
                    await ScheduleService.updateSUDraftFromObservStrategy(observStrategy, newSU, this.state.taskDrafts, this.state.tasksToUpdate);
                    existingSUCount++;
                }
                else if  (suRow.id === 0 && suRow.suname.length>0 && suRow.sudesc.length>0){
                    newSU['id'] = suRow.id;
                    newSU['name'] = suRow.suname;
                    newSU['description'] = suRow.sudesc;
                    await ScheduleService.saveSUDraftFromObservStrategy(observStrategy, newSU, newConstraint);
                    newSUCount++;
                }
            }
            
            if  ((newSUCount+existingSUCount)>0){
                const dialog = {header: 'Success', detail: '['+newSUCount+'] Scheduling Units are created & ['+existingSUCount+'] Scheduling Units are updated successfully.'};
                this.setState({  dialogVisible: true, dialog: dialog});
            }  else  {
                this.growl.show({severity: 'error', summary: 'Warning', detail: 'No Scheduling Units create/update '});
            }
        }catch(err){
            this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to create/update Scheduling Units'});
        }
    }
  
    /**
     * Convert the date to string value for Between And Not-Between Columns
     * @param {*} dates 
     */
    getBetweenStringValue(dates){
        let returnDate = '';
        if  (dates){
            dates.forEach(utcDateArray =>{
                returnDate +=moment.utc(utcDateArray.from).format(DATE_TIME_FORMAT)+",";
                returnDate +=moment.utc(utcDateArray.to).format(DATE_TIME_FORMAT)+"|";
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
                    dateres['from'] = `${moment(betweendate[0]).format("YYYY-MM-DDTHH:mm:SS.SSSSS", { trim: false })}Z`;
                    dateres['to'] = `${moment(betweendate[1]).format("YYYY-MM-DDTHH:mm:SS.SSSSS", { trim: false })}Z`;
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
        let schedulingUnitList= await ScheduleService.getSchedulingBySet(this.state.selectedSchedulingSetId);
        schedulingUnitList = _.filter(schedulingUnitList,{'observation_strategy_template_id': this.state.observStrategy.id}) ;
        this.setState({
            schedulingUnitList:  schedulingUnitList,
            dialogVisible: false
        })
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
 
   async setNoOfSUint(value){
    this.setState({isAGLoading: true});
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
        let totalCount = this.state.totalCount;
        if (this.state.rowData && this.state.rowData.length >0 && this.state.emptyRow) {
            if (this.state.totalCount <= noOfSU) {
                // set API data
                for (var i = 0; i < totalCount; i++) {
                    this.tmpRowData.push(this.state.rowData[i]);
                }
                // add empty row
                for(var i = this.state.totalCount; i < noOfSU; i++) {
                    this.tmpRowData.push(this.state.emptyRow);
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

    close(){
        this.setState({saveDialogVisible: false})
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
        return <> Invalid Rows:- Row # and Invalid columns, <br/>{this.state.errorDisplay && this.state.errorDisplay.length>0 && 
            this.state.errorDisplay.map((msg, index) => (
            <React.Fragment key={index+10} className="col-lg-9 col-md-9 col-sm-12">
                <span key={'label1-'+ index}>{msg}</span> <br />
            </React.Fragment>
        ))} </>
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        return (
            <React.Fragment>
                 <Growl ref={(el) => this.growl = el} />
                 <PageHeader location={this.props.location} title={'Scheduling Set - Add'} 
                actions={[{icon: 'fa-window-close',title:'Close', props:{pathname: '/schedulingunit' }}]}
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
                                            onChange={(e) => {this.setSchedulingSetParams('scheduling_set_id',e.value)}} 
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
                                            tooltip="Observation Strategy Template to be used to create the Scheduling Unit" tooltipOptions={this.tooltipOptions}
                                            value={this.state.observStrategy.id} 
                                            options={this.observStrategies} 
                                            onChange={(e) => {this.changeStrategy(e.value)}} 
                                            placeholder="Select Strategy" />
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
                        </div>
                        <>
                        { this.state.isAGLoading ? <AppLoader /> :
                        <>
                            {this.state.observStrategy.id &&
                                <div className="ag-theme-alpine" style={ {overflowX: 'inherit !importent', height: '500px', marginBottom: '10px' } } onKeyDown={this.clipboardEvent}>
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
                                        rowSelection={this.state.rowSelection}
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
                                <Button key="back" onClick={this.reset} label="Close" />
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

                <CustomDialog type="confirmation" visible={this.state.saveDialogVisible} width="40vw"
                    header={'Save Scheduling Unit(s)'} message={' Some of the Scheduling Unit(s) has invalid data, Do you want to ignore and save valid Scheduling Unit(s) only?'} 
                    content={this.showDialogContent} onClose={this.close} onCancel={this.close} onSubmit={this.saveSU}>
                </CustomDialog>
 
            </React.Fragment>
        );
    }
}

export default SchedulingSetCreate;