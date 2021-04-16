import React, { Component } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import $RefParser from "@apidevtools/json-schema-ref-parser";
import UtilService from '../../services/util.service';
import Jeditor from '../JSONEditor/JEditor'; 
import _ from 'lodash';

export default class Beamformer extends Component {
    constructor(props) {
        super(props);
        this.tmpRowData = [];
        this.state = {
            showDialog: false,
            dialogTitle: 'Beamformer - Specification',
            validEditor: false,                     // For JSON editor validation
            validFields: {},                        // For Form Validation     
        };

        this.formRules = {};                          // Form validation rules
        this.previousValue = [{}];

        this.copyBeamformersValue = this.copyBeamformersValue.bind(this);
        this.setEditorFunction = this.setEditorFunction.bind(this);
        this.setEditorOutput = this.setEditorOutput.bind(this);
        this.validateForm = this.validateForm.bind(this);
        this.doCancel = this.doCancel.bind(this);
        this.keyEventHandler = this.keyEventHandler.bind(this);
    }
  
    isPopup() {
        return true;
    }

    /**
    * Get beamformer details if exists
    */
    async componentDidMount(){
        let parentRows = this.props.agGridReact.props.rowData[this.props.node.rowIndex];
        let parentCellData = parentRows[this.props.colDef.field];
        let observStrategy = this.props.context.componentParent.state.observStrategy;
        this.changeStrategy(observStrategy)
        await this.setState({
            showDialog: true,
            parentCellData: parentCellData,
        });
        this.previousValue= parentCellData;
    }

    /** Prepare data for JEditor  */
    async changeStrategy(observStrategy) {
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
                const taskTemplate = _.find(this.props.context.componentParent.taskTemplates, {'name': task['specifications_template']});
                schema['$id'] = taskTemplate.schema['$id'];
                schema['$schema'] = taskTemplate.schema['$schema'];
                let index = 0;
                let param = _.find(observStrategy.template.parameters, function(o) { return o.name === 'Beamformers' || o.name === 'beamformers' ;});
                if(param) {
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
            if(this.state.parentCellData && JSON.stringify(this.state.parentCellData) !== '[{}]') {
            if(this.state.parentCellData['param_0']) {
                paramsOutput = this.state.parentCellData;
            }   else {
                paramsOutput = {'param_0': this.state.parentCellData};
            }
        }
        await this.setState({observStrategy: observStrategy, paramsSchema: schema, paramsOutput: paramsOutput,});
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
     * Copy JEditor value to AG Grid cell
     */
    async copyBeamformersValue(){
        this.previousValue = this.state.paramsOutput;
        await this.props.context.componentParent.updateCell(
            this.props.node.rowIndex,this.props.colDef.field, this.state.paramsOutput 
        );
        this.setState({ showDialog: false});
    }

    /**
   * While cancel retain existing value
   */
    async doCancel(){
        await this.props.context.componentParent.updateCell(
            this.props.node.rowIndex,this.props.colDef.field, this.previousValue 
        );
        this.setState({paramsOutput: this.previousValue, showDialog: false});
    }

   /**
     * JEditor's function that to be called when parent wants to trigger change in the JSON Editor
     * @param {Function} editorFunction 
     */
    setEditorFunction(editorFunction) {
        this.setState({editorFunction: editorFunction});
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
        }
        this.setState({errors: errors, validFields: validFields});
        if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
            validForm = true;
        }
        return validForm && !this.state.missingStationFieldsErrors;
    }
    /**
     * Handle Tab key event in Beamformers Editor. It will be invoked when press Tab key in Beamformes editor
     * @param {*} e 
     */
     keyEventHandler(e){
        var key = e.which || e.keyCode;
        if(key === 9) {
            this.copyBeamformersValue();
        }
    }
    
    render() {
        const schema = this.state.paramsSchema;
        let jeditor = null;
        if (schema) {
            jeditor = React.createElement(Jeditor, {title: "Beamformer Specification", 
                                                        schema: schema,
                                                        initValue: this.state.paramsOutput, 
                                                        callback: this.setEditorOutput,
                                                        parentFunction: this.setEditorFunction
                                                    }); 
        }
        return (
            <div onKeyDown={this.keyEventHandler}>  
                <Dialog header={_.startCase(this.state.dialogTitle)} style={{width: '60vw', height: '80vh'}} visible={this.state.showDialog} maximized={false}  
                onHide={() => {this.doCancel()}} inputId="confirm_dialog"
                footer={<div>
                        <Button  label="OK" icon="pi pi-check"  onClick={() => {this.copyBeamformersValue()}}  disabled={!this.state.validEditor} style={{width: '6em'}} />
                        <Button className="p-button-danger" icon="pi pi-times" label="Cancel" onClick={() => {this.doCancel()}} />
                    
                    </div>
                } 
                >
                    <div className="ag-theme-balham" style={{ height: '65vh' }}>
                        <div className="p-fluid">
                            <div className="p-grid">
                                <div className="p-col-12">
                                    {this.state.paramsSchema?jeditor:""}
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </div>
        );
    }
}