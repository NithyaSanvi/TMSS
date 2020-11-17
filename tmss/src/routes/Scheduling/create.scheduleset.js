import React, {Component} from 'react';
import { Link, Redirect } from 'react-router-dom';
import _ from 'lodash';

import {Dropdown} from 'primereact/dropdown';
import { Button } from 'primereact/button';
import {Dialog} from 'primereact/components/dialog/Dialog';
import {Growl} from 'primereact/components/growl/Growl';
import AppLoader from '../../layout/components/AppLoader';
import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import TaskService from '../../services/task.service';
import UIConstants from '../../utils/ui.constants';
import $RefParser from "@apidevtools/json-schema-ref-parser";
import TimeInputmask from './../../components/Spreadsheet/TimeInputmask'
import DegreeInputmask from './../../components/Spreadsheet/DegreeInputmask'
import NumericEditor from '../../components/Spreadsheet/numericEditor';

import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModules } from '@ag-grid-community/all-modules';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import UnitConverter from '../../utils/unit.converter'
import Validator from  '../../utils/validator';
import PageHeader from '../../layout/components/PageHeader';
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
 
        this.state = {
            projectDisabled: (props.match?(props.match.params.project? true:false):false),
            isLoading: true,                        // Flag for loading spinner
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
            },
            noOfSUOptions: [
                { label: '10', value: '10' },
                { label: '50', value: '50' },
                { label: '100', value: '100' },
                { label: '250', value: '250' },
                { label: '500', value: '500' }
                ],
        }

        this.onGridReady = this.onGridReady.bind(this);
        this.validateForm = this.validateForm.bind(this);
        this.validateEditor = this.validateEditor.bind(this);
        this.saveSchedulingUnit = this.saveSchedulingUnit.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.clipboardEvent = this.clipboardEvent.bind(this);
        this.reset = this.reset.bind(this);
        
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
        this.setState({schedulingUnit: schedulingUnit, schedulingSets: projectSchedluingSets, validForm: this.validateForm('project')});
    }
 
    /**
     * Function to set form values to the SU object
     * @param {string} key 
     * @param {object} value 
     */
    async setSchedingSetParams(key, value) {
        let schedulingUnit = this.state.schedulingUnit;
        schedulingUnit[key] = value;

        let schedulingUnitList = await ScheduleService.getSchedulingBySet(value);
        if(schedulingUnitList){
            const schedulingSetIds = _.uniq(_.map(schedulingUnitList, 'observation_strategy_template_id'));
            if(schedulingSetIds.length === 1){
                const observStrategy = _.find(this.observStrategies, {'id': schedulingUnitList[0].observation_strategy_template_id});
                this.setState({
                    schedulingUnit: schedulingUnit, validForm: this.validateForm(key), validEditor: this.validateEditor(),
                    schedulingUnitList: schedulingUnitList, schedulingSetId: value, selectedSchedulingSetId: value, observStrategy: observStrategy
                });
                await this.prepareScheduleUnitListForGrid();
            }else{ 
                /* Let user to select Observation Strategy */
                this.setState({
                    rowData:[], schedulingUnit: schedulingUnit, validForm: this.validateForm(key), validEditor: this.validateEditor(),
                    schedulingUnitList:schedulingUnitList, selectedSchedulingSetId: value,  observStrategy: {}
                });
            }
        }else{
            this.setState({schedulingUnit: schedulingUnit, validForm: this.validateForm(key), validEditor: this.validateEditor(),
                selectedSchedulingSetId: value});
        }
    }

    /**
     * Function called when observation strategy template is changed. 
     *
     * @param {number} strategyId 
     */
    async changeStrategy (strategyId) {
        const observStrategy = _.find(this.observStrategies, {'id': strategyId});
        let schedulingUnitList= await ScheduleService.getSchedulingBySet(this.state.selectedSchedulingSetId);
        schedulingUnitList = _.filter(schedulingUnitList,{'observation_strategy_template_id': strategyId}) ;
       
        await this.setState({
            schedulingUnitList: schedulingUnitList,
            observStrategy: observStrategy
        })
        
        if(schedulingUnitList && schedulingUnitList.length >0){
            await this.prepareScheduleUnitListForGrid();
        }else{
            this.setState({
                rowData: []
            })
        }
        this.state.gridApi.setRowData(this.state.rowData)
        this.state.gridApi.redrawRows();
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
                    }   else {                   // General object to resolve if any reference in child level
                        property = await this.resolveSchema((await $RefParser.resolve(refUrl)).get(newRef));
                    }
                }   else if(property["type"] === "array") {             // reference in array items definition
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
     * Function to generate AG-Grid column definition. 
     * @param {number} strategyId 
     */
    async createGridColumns(scheduleUnit){
        let schema = await this.getTaskSchema(scheduleUnit);
        schema = await this.resolveSchema(schema);
        // AG Grid Cell Specific Properties
        const cellProps =[];
        cellProps['angle1'] = {type:'numberValueColumn', cellRenderer: 'timeInputMask',cellEditor: 'timeInputMask', valueSetter: 'valueSetter' };
        cellProps['angle2'] = {type:'numberValueColumn', cellRenderer: 'degreeInputMask',cellEditor: 'degreeInputMask', valueSetter: 'valueSetter' };
        cellProps['angle3'] = {cellEditor: 'numericEditor',};
        cellProps['direction_type'] = {cellEditor: 'agSelectCellEditor',default: schema.definitions.pointing.properties.direction_type.default,
                cellEditorParams: {
                    values: schema.definitions.pointing.properties.direction_type.enum,
                }, 
            };
        //Ag-grid Colums definition

        let colKeyOrder = [];
        let columnMap = [];
        let colProperty = {};
        let columnDefs = [
            { // Row Index 
              headerName: '',
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
                {headerName: 'Description',field: 'sudesc'}
              ],
              }
        ];
        colKeyOrder.push("suname");
        colKeyOrder.push("sudesc");

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
        colProperty ={'From':'bfrom', 'Until':'buntil'};
        columnMap['Between'] = colProperty;
        this.setState({
            columnDefs:columnDefs,
            columnMap:columnMap,
            colKeyOrder:colKeyOrder
        })

    }
    
    async getTaskSchema(scheduleUnit){
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
     * Function to prepare ag-grid row data. 
     */
    async prepareScheduleUnitListForGrid(){
        if(this.state.schedulingUnitList.length===0){
            return;
        }
        this.tmpRowData = [];
        let totalSU = this.state.noOfSU;
        let paramsOutput = {};
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
                let rurl = parameter['refs'];
                let valueItem = (await $RefParser.resolve( scheduleunit['requirements_doc'])).get(rurl[0]);
                let excelColumns = this.state.columnMap[parameter.name];
                let excelColumnsKeys =  Object.keys(excelColumns);
                for(const eColKey of excelColumnsKeys){
                    if(eColKey === 'angle1'){
                        observationProps[excelColumns[eColKey]] = UnitConverter.getAngleInput(valueItem[eColKey], false);
                    }
                    else if(eColKey === 'angle2'){
                        observationProps[excelColumns[eColKey]] = UnitConverter.getAngleInput(valueItem[eColKey], true);
                    }
                    else{
                        observationProps[excelColumns[eColKey]] = valueItem[eColKey];
                    }
               }
            }
            observationPropsList.push(observationProps);
        }
         
        this.tmpRowData = observationPropsList;
        // find No. of rows filled in array
        let totalCount = this.tmpRowData.length;
         // Prepare No. Of SU for rows for UI
        if(this.tmpRowData && this.tmpRowData.length>0){
            const paramsOutputKey = Object.keys( this.tmpRowData[0]);
            const availableCount = this.tmpRowData.length;
            if(availableCount>= totalSU){
                totalSU = availableCount+10;
            }
            for(var i = availableCount; i<totalSU; i++){
                let emptyRow =  {};
                paramsOutputKey.forEach(key =>{
                    if(key === 'id'){
                        emptyRow[key]= 0;
                    }else{
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
            const permissionStatus = await navigator.permissions.query(queryOpts);
            let data = await navigator.clipboard.readText();
            return data;
        }catch(err){
            console.log("Error",err);
        }
    }  

    /**
     * Check the content is JSON format
     * @param {*} jsonData 
     */
    async isJsonData(jsonData){
        try{
            let jsonObj = JSON.parse(jsonData);
            return true;
        }catch(err){
            console.log("error :",err)
            return false;
        }
    }  

      /**
     * Copy data to/from clipboard
     * @param {*} e 
     */
    async clipboardEvent(e){
        var key = e.which || e.keyCode; // keyCode detection
        var ctrl = e.ctrlKey ? e.ctrlKey : ((key === 17) ? true : false); // ctrl detection
        if ( key == 86 && ctrl ) {
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
              if(clipboardData){
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
                            suGridRowData[key]= suRow[colCount];
                            colCount++;
                        }
                        this.tmpRowData[dataRowCount]= (suGridRowData);
                        dataRowCount++
                    }) 
                }
                let emptyRow = this.state.emptyRow;
                let tmpNoOfSU= this.state.noOfSU;
                if(dataRowCount >= tmpNoOfSU){
                    tmpNoOfSU = dataRowCount+10;
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
             
        } else if ( key == 67 && ctrl ) {
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
        }
    }


    /**
     * Function to create Scheduling unit
     */
    async saveSchedulingUnit() {
        let newSUCount = 0;
        let existingSUCount = 0;
        try{
            let observStrategy = _.cloneDeep(this.state.observStrategy);
            const $refs = await $RefParser.resolve(observStrategy.template);
            let newSU = this.state.schedulingUnit;
            let parameters = this.state.schedulingUnitList[0]['requirements_doc'].parameters;
            let columnMap = this.state.columnMap;

            for(const suRow of this.state.rowData){
                if(!suRow['isValid']){
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
                        if(key === 'angle1'){
                            if(!Validator.validateTime(suRow[result[key]])){
                                validRow = false;
                                return;
                            }
                            paramOutput[key] = UnitConverter.getAngleOutput(suRow[result[key]],false);
                        }else if(key === 'angle2'){
                            if(!Validator.validateAngle(suRow[result[key]])){
                                validRow = false;
                                return;
                            }
                            paramOutput[key] = UnitConverter.getAngleOutput(suRow[result[key]],true);
                        }else{
                            paramOutput[key] = suRow[result[key]];
                        }
                    })
                    paramsOutput['param_'+index] = paramOutput;
                    index++;
                } 
                if(!validRow){
                    continue;
                }
                observStrategy.template.parameters.forEach(async(param, index) => {
                    $refs.set(observStrategy.template.parameters[index]['refs'][0], paramsOutput['param_' + index]);
                });
                if(suRow.id >0 && suRow.suname.length>0 && suRow.sudesc.length>0){
                    newSU = _.find(this.state.schedulingUnitList, {'id': suRow.id}); 
                    newSU['name'] = suRow.suname;
                    newSU['description'] = suRow.sudesc;
                    newSU.requirements_doc.tasks= observStrategy.template.tasks;
                    await ScheduleService.updateSUDraftFromObservStrategy(observStrategy, newSU, this.state.taskDrafts, this.state.tasksToUpdate);
                    existingSUCount++;
                }
                else if(suRow.id === 0 && suRow.suname.length>0 && suRow.sudesc.length>0){
                    newSU['id'] = suRow.id;
                    newSU['name'] = suRow.suname;
                    newSU['description'] = suRow.sudesc;
                    await ScheduleService.saveSUDraftFromObservStrategy(observStrategy, newSU);
                    newSUCount++;
                }
            }
            
            if((newSUCount+existingSUCount)>0){
                const dialog = {header: 'Success', detail: '['+newSUCount+'] Scheduling Units are created & ['+existingSUCount+'] Scheduling Units are updated successfully.'};
                this.setState({  dialogVisible: true, dialog: dialog});
            }else{
                this.growl.show({severity: 'error', summary: 'Warning', detail: 'No Scheduling Units create/update '});
            }
        }catch(err){
            this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to create/update Scheduling Units'});
        }
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
       if(value >= 0 && value < 501){
            await this.setState({
                noOfSU: value
            })
        }else{
            await this.setState({
                noOfSU: 500
            })
        }
        //refresh row data
        await this.prepareScheduleUnitListForGrid();
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
                                            onChange={(e) => {this.setSchedingSetParams('scheduling_set_id',e.value)}} 
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
                        {this.state.observStrategy.id && 
                            <div className="ag-theme-alpine" style={ { height: '500px', marginBottom: '10px' } } onKeyDown={this.clipboardEvent}>
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
            </React.Fragment>
        );
    }
}

export default SchedulingSetCreate;