/**
 * This is the custom component to use "@json-editor/json-editor"
 * to create form using JSON Schema and get JSON output
 */
import React, {useEffect, useRef} from 'react';
import _ from 'lodash';
import $RefParser from "@apidevtools/json-schema-ref-parser";

import "@fortawesome/fontawesome-free/css/all.css";
import "flatpickr/dist/flatpickr.css";
const JSONEditor = require("@json-editor/json-editor").JSONEditor;

function Jeditor(props) {
    // console.log("In JEditor");
    const editorRef = useRef(null);
    let pointingProps = useRef(null);
    let editor = null;

    const getSchema = async () => {
        const observStrategy = props.observStrategy;
        const tasks = props.observationStartegyTasks;
        let paramsOutput = {};
        let schema = { type: 'object', additionalProperties: false, 
                        properties: {}, definitions:{}
                     };

        for (const taskName of _.keys(tasks)) {
            const task = tasks[taskName];
            //Resolve task from the strategy template
            const $taskRefs = await $RefParser.resolve(task);

            // Identify the task specification template of every task in the strategy template
            const taskTemplate = _.find(props.taskTemplates, {'name': task['specifications_template']});
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
                        console.log(property);
                    }
                    console.log(property);
                    if (property['$ref'] && !property['$ref'].startsWith("#")) {
                        const $propDefinition = await $RefParser.resolve(property['$ref']);
                        const propDefinitions = $propDefinition.get("#/definitions");
                        for (const propDefinition in propDefinitions) {
                            schema.definitions[propDefinition] = propDefinitions[propDefinition];
                            property['$ref'] = "#/definitions/"+ propDefinition ;
                        } 
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
        return { initialValue: paramsOutput, schema }
    };
    
    useEffect(async () => {
        const element = document.getElementById('editor_holder');
        let tempSchema,initialValue;
        if (!props.schema) {
            const response = await getSchema();
            tempSchema = response.schema;
            initialValue = response.initialValue
        } else {
            tempSchema = {...props.schema}; 
            initialValue = props.initialValuel
        }
        let schema = {};
        Object.assign(schema, tempSchema ? tempSchema : {});
        pointingProps = [];
        // Customize the pointing property to capture angle1 and angle2 to specified format
        for (const definitionKey in schema.definitions) {
            if (definitionKey === 'pointing') {
                const defintion = schema.definitions[definitionKey];
                let defProperties = defintion.properties;
                if (defProperties) {
                    for (const propName in defProperties) {
                        if (propName === 'angle1' || propName === 'angle2') {
                            let defProperty = getAngleProperty(defProperties[propName], propName === 'angle2');
                            defProperties[propName] = defProperty; 
                        }
                        if (defProperties[propName].options) {
                            defProperties[propName].options.grid_columns = 4;
                        }   else {
                            defProperties[propName].options = {grid_columns: 4};
                        }
                    }
                }
            }
        }
        
        // Customize datatype of certain properties like subbands, duration, etc.,
        getCustomProperties(schema.properties);
        schema.title = props.title;
        const subbandValidator = validateSubbandOutput;
        const timeValidator = validateTime;
        const angleValidator = validateAngle;
        JSONEditor.defaults.custom_validators.push((schema, value, path) => {
            const errors = [];
            if (schema.validationType === "subband_list") {
                if (!subbandValidator(value)) {
                    errors.push({
                        path: path,
                        property: 'validationType',
                        message: 'Not a valid input for Subband List'
                    });
                }
            }   else if (schema.validationType === "time") {
                if (!timeValidator(value)) {
                    errors.push({
                        path: path,
                        property: 'validationType',
                        message: 'Not a valid input. Mimimum: 00:00:00, Maximum:23:59:59'
                    });
                }
            }   else if (schema.validationType === "angle") {
                if (!angleValidator(value)) {
                    errors.push({
                        path: path,
                        property: 'validationType',
                        message: 'Not a valid input. Mimimum: 00:00:00, Maximum:90:00:00'
                    });
                }
            }
            return errors;
        });
        schema.format = "grid"
        const editorOptions = {
            form_name_root: "specification",
            schema: schema,
            theme: 'bootstrap4',
            iconlib: 'fontawesome5',
            // theme: 'tailwind',
            // iconlib: 'spectre',
            display_required_only: false,
            remove_button_labels: true,
            disable_edit_json: true,
            disable_properties: true,
            disable_collapse: true,
            show_errors: props.errorsOn?props.errorsOn:'change',        // Can be 'interaction', 'change', 'always', 'never'
            compact: true,
            ajax: true
        };
        // Set Initial value to the editor
        if (initialValue) {
            editorOptions.startval = updateInput(_.cloneDeep(initialValue));
        }
        editor = new JSONEditor(element, editorOptions);
        // editor.getEditor('root').disable();
        if (props.disabled) {
            editor.disable();
        }
        if (props.parentFunction) {
            props.parentFunction(editorFunction);
        }
        editorRef.current = editor;
        editor.on('change', () => {setEditorOutput()});
    }, [props.observStrategy]);

    /**
     * Function to call on button click and send the output back to parent through callback
     * 
     */
    function setEditorOutput(){
        const editorOutput = editorRef.current.getValue();
        const formattedOutput = updateOutput(_.cloneDeep(editorOutput));
        const editorValidationErrors = editorRef.current.validate();
        if (props.callback) {
            props.callback(formattedOutput, editorValidationErrors);
        }
    }

    /**
     * Function called by the parent component to perform certain action ib JEditor
     */
    function editorFunction() {
        editorRef.current.destroy();
    }

    /**
     * Function to convert the angle fields in HH:mm:ss or DD:mm:ss format based on isDegree value.
     * @param {Object} defProperty 
     * @param {Boolean} isDegree 
     */
    function getAngleProperty(defProperty, isDegree) {
        let newProperty = {
            type: "string",
            title: defProperty.title,
            description: (defProperty.description + (isDegree?'(Degrees:Minutes:Seconds)':'(Hours:Minutes:Seconds)')),
            default: "00:00:00",
            validationType: isDegree?'angle':'time',
            options: {
                "grid_columns": 4,
                "inputAttributes": {
                    "placeholder": isDegree?"DD:mm:ss":"HH:mm:ss"
                },
                "cleave": {
                    date: true,
                    datePattern: ['HH','mm','ss'],
                    delimiter: ':'
                }
            }
        }
        return newProperty;
    }

    /**
     * Function to get the schema change for specified properties like subbands, duration, column width, etc
     * @param {Object} properties 
     */
    function getCustomProperties(properties) {
        for (const propertyKey in properties) {
            const propertyValue = properties[propertyKey];
            if (propertyKey === 'subbands') {
                let newProperty = {};
                newProperty.additionalItems = false;
                newProperty.title = propertyValue.title;
                newProperty.type = 'string';
                newProperty.default = '';
                newProperty.description = "For Range enter Start and End seperated by 2 dots. Mulitple ranges can be separated by comma. Minimum should be 0 and maximum should be 511. For exmaple 11..20, 30..50";
                newProperty.validationType = 'subband_list';
                // newProperty.options = {
                //     grid_columns: 4
                // };
                properties[propertyKey] = newProperty;
            }   else if (propertyKey.toLowerCase() === 'duration') {
                let newProperty = {
                    "type": "string",
                    "format": "time",
                    "title": "Duration",
                    "description": `${propertyValue.description} (Hours:Minutes:Seconds)`,
                    "options": {
                        "grid_columns": 3,
                        "inputAttributes": {
                            "placeholder": "Enter time"
                        },
                        "flatpickr": {
                            "wrap": true,
                            "showClearButton": false,
                            "inlineHideInput": true,
                            "defaultHour": 0,
                            "defaultMinute": 1,
                            "enableSeconds": true,
                            "defaultSecond": 0,
                            "hourIncrement": 1,
                            "minuteIncrement": 1,
                            "secondIncrement": 5,
                            "time_24hr": true,
                            "allowInput": true
                        }
                    }
                };

                properties[propertyKey] = newProperty;
            }   else if (propertyValue instanceof Object) {
                if (propertyKey !== 'properties' && propertyKey !== 'default') {
                    propertyValue.format = "grid";
                }
                if (propertyKey === 'average' || propertyKey === 'calibrator' || propertyKey === 'stations') {
                    propertyValue.propertyOrder = 1;
                }   else if (propertyKey === 'demix') {
                    propertyValue.propertyOrder = 2;
                }   else if (propertyKey === 'QA' || propertyKey === 'beams') {
                    propertyValue.propertyOrder = 10000;
                }
                if (propertyKey === 'storage_cluster' || propertyKey === 'integration_time' || propertyKey === 'storage_manager') {
                    let options = propertyValue.options?propertyValue.options:{};
                    options.grid_columns = 3;
                    propertyValue.options = options;
                }   else if (propertyKey === 'flag') {
                    let options = propertyValue.options?propertyValue.options:{};
                    options.grid_columns = 9;
                    propertyValue.options = options;
                }
                if (propertyValue['$ref'] && propertyValue['$ref'].endsWith("/pointing")) {
                    pointingProps.push(propertyKey);
                }
                getCustomProperties(propertyValue);
            }
        }
    }

    /**
     * Function to format the input for custom fields when the editor receive the inital values from the parent component
     * @param {*} editorInput 
     */
    function updateInput(editorInput) {
        for (const inputKey in editorInput) {
            const inputValue = editorInput[inputKey];
            if (inputValue instanceof Object) {
                if (_.indexOf(pointingProps, inputKey) >= 0) {
                    inputValue.angle1 = getAngleInput(inputValue.angle1);
                    inputValue.angle2 = getAngleInput(inputValue.angle2, true);
                }  else if (inputKey === 'subbands') {
                    editorInput[inputKey] = getSubbandInput(inputValue);
                }  else {
                    updateInput(inputValue);
                }
            }  else if (inputKey.toLowerCase() === 'duration') {
                // editorInput[inputKey] = inputValue/60;
                editorInput[inputKey] = getTimeInput(inputValue);
            }
        }
        return editorInput;
    }

    /**
     * Function to format the output of the customized fields
     * @param {*} editorOutput 
     */
    function updateOutput(editorOutput) {
        for (const outputKey in editorOutput) {
            let outputValue = editorOutput[outputKey];
            if (outputValue instanceof Object) {
                if (_.indexOf(pointingProps, outputKey) >= 0) {
                    outputValue.angle1 = getAngleOutput(outputValue.angle1, false);
                    outputValue.angle2 = getAngleOutput(outputValue.angle2, true);
                } else {
                    updateOutput(outputValue);
                }
            } else if (outputKey === 'subbands') {
                editorOutput[outputKey] = getSubbandOutput(outputValue);
            } else if (outputKey.toLowerCase() === 'duration') {
                // editorOutput[outputKey] = outputValue * 60;
                const splitOutput = outputValue.split(':');
                editorOutput[outputKey] = (splitOutput[0] * 3600 + splitOutput[1] * 60  + splitOutput[2]*1);
            }
        }
        return editorOutput;
    }

    /**
     * Function to format angle values in the input of inital values
     * @param {*} prpInput 
     * @param {Boolean} isDegree 
     */
    function getAngleInput(prpInput, isDegree) {
        const degrees = prpInput * 180 / Math.PI;
        if (isDegree) {
            const dd = Math.floor(prpInput * 180 / Math.PI);
            const mm = Math.floor((degrees-dd) * 60);
            const ss = +((degrees-dd-(mm/60)) * 3600).toFixed(0);
            return (dd<10?`0${dd}`:`${dd}`) + ':' + (mm<10?`0${mm}`:`${mm}`) + ':' + (ss<10?`0${ss}`:`${ss}`);
        }   else {
            const hh = Math.floor(degrees/15);
            const mm = Math.floor((degrees - (hh*15))/15 * 60 );
            const ss = +((degrees -(hh*15)-(mm*15/60))/15 * 3600).toFixed(0);
            return (hh<10?`0${hh}`:`${hh}`) + ':' + (mm<10?`0${mm}`:`${mm}`) + ':' + (ss<10?`0${ss}`:`${ss}`);
        }
    }

    /**
     * Function to format subband list inout arrived as Array to String
     * @param {Array} prpInput 
     */
    function getSubbandInput(prpInput) {
        let subbandString = "";
        for (let index=0; index < prpInput.length; index++) {
            if (subbandString.length > 0) {
                subbandString += ",";
            }
            let firstVal = prpInput[index]
            let nextVal = prpInput[index];
            if (prpInput[index+1] - nextVal === 1) {
                subbandString += firstVal + "..";
                while( prpInput[index+1] - nextVal === 1) {
                    index++;
                    nextVal = prpInput[index];
                }
                subbandString += nextVal;
            }   else {
                subbandString += firstVal;
            }
        }
        return subbandString;
    }

    /**
     * Convert time value in seconds to string format of HH:mm:ss
     * @param {Number} seconds 
     */
    function getTimeInput(seconds) {
        const hh = Math.floor(seconds/3600);
        const mm = Math.floor((seconds - hh*3600) / 60 );
        const ss = +((seconds -(hh*3600)-(mm*60)) / 1);
        return (hh<10?`0${hh}`:`${hh}`) + ':' + (mm<10?`0${mm}`:`${mm}`) + ':' + (ss<10?`0${ss}`:`${ss}`);
    }

    /**
     * Converts the angle input to radians
     * @param {String} prpOutput 
     * @param {Boolean} isDegree 
     */
    function getAngleOutput(prpOutput, isDegree) {
        const splitOutput = prpOutput.split(':');
        if (isDegree) {
            return ((splitOutput[0]*1 + splitOutput[1]/60 + splitOutput[2]/3600)*Math.PI/180);
        }   else {
            return ((splitOutput[0]*15 + splitOutput[1]/4  + splitOutput[2]/240)*Math.PI/180);
        }
    }

    /**
     * Validate time entered as string in HH:mm:ss format
     * @param {String} prpOutput 
     */
    function validateTime(prpOutput) {
        const splitOutput = prpOutput.split(':');
        if (splitOutput.length < 3) {
            return false;
        }   else {
            if (parseInt(splitOutput[0]) > 23 || parseInt(splitOutput[1])>59 || parseInt(splitOutput[2])>59) {
                return false;
            }
            const timeValue = parseInt(splitOutput[0]*60*60) + parseInt(splitOutput[1]*60) + parseInt(splitOutput[2]);
            if (timeValue >= 86400) {
                return false;
            }
        }
        return true;
    }

    /**
     * Validate angle input to not exceed 90 degrees
     * @param {String} prpOutput 
     */
    function validateAngle(prpOutput) {
        const splitOutput = prpOutput.split(':');
        if (splitOutput.length < 3) {
            return false;
        }   else {
            if (parseInt(splitOutput[0]) > 90 || parseInt(splitOutput[1])>59 || parseInt(splitOutput[2])>59) {
                return false;
            }
            const timeValue = parseInt(splitOutput[0]*60*60) + parseInt(splitOutput[1]*60) + parseInt(splitOutput[2]);
            if (timeValue > 324000) {
                return false;
            }
        }
        return true;
    }

    /**
     * Validates if the subband list custom field
     * @param {String} prpOutput 
     */
    function validateSubbandOutput(prpOutput){
        try {
            if (prpOutput) {
                const subbandArray = prpOutput.split(",");
                for (const subband of subbandArray ) {
                    const subbandRange = subband.split('..');
                    if (subbandRange.length > 1) {
                        const firstVal = parseInt(subbandRange[0]);
                        const nextVal = parseInt(subbandRange[1]) + 1;
                        if (isNaN(firstVal * nextVal) || firstVal < 0 || firstVal > 510
                            || nextVal < 0 || nextVal > 511
                            || firstVal >nextVal) {
                                return false;
                            }
                    }   else {
                        if (isNaN(parseInt(subbandRange[0]))) {
                            return false;
                        }
                        if (parseInt(subbandRange[0]) < 0 || parseInt(subbandRange[0]) > 511) {
                            return false;
                        }
                    }
                }
            }   else {
                return false
            }
        }   catch(exception) {
            return false;
        }
        return true;
    }

    /**
     * Convert the string input for subband list to Array
     * @param {String} prpOutput 
     */
    function getSubbandOutput(prpOutput) {
        const subbandArray = prpOutput.split(",");
        let subbandList = [];
        for (const subband of subbandArray ) {
            const subbandRange = subband.split('..');
            if (subbandRange.length > 1) {
                subbandList = subbandList.concat( _.range(subbandRange[0], (parseInt(subbandRange[1])+1)));
            }   else {
                subbandList = subbandList.concat(parseInt(subbandRange[0]));
            }
        }
        prpOutput = subbandList;
        return prpOutput;
    }

    return (
        <React.Fragment>
            <div id='editor_holder'></div>
        </React.Fragment>
    );
};

export default Jeditor;