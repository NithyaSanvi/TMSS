/**
 * This is the custom component to use "@json-editor/json-editor"
 * to create form using JSON Schema and get JSON output
 */
import React, {useEffect, useRef} from 'react';
import _ from 'lodash';
import flatpickr from 'flatpickr';

import "@fortawesome/fontawesome-free/css/all.css";
import "flatpickr/dist/flatpickr.css";
const JSONEditor = require("@json-editor/json-editor").JSONEditor;

function Jeditor(props) {
    // console.log("In JEditor");
    const editorRef = useRef(null);
    let editor = null;
    useEffect(() => {
        const element = document.getElementById('editor_holder');
        let schema = {};
        Object.assign(schema, props.schema?props.schema:{});
        
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
            compact: true
        };
        // Set Initial value to the editor
        if (props.initValue) {
            editorOptions.startval = updateInput(_.cloneDeep(props.initValue));
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
    }, [props.schema]);

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
        /*let newProperty = {
            "type": "object",
            "additionalProperties": false,
            "format": "grid",
            // "title": defProperty.title,
            // "description": defProperty.description};
            "title": "Duration",
            "description": "Duration of the observation"};
        let subProperties = {};
        if (isDegree) {
            subProperties["dd"] = {  "type": "number",
                                      "title": "DD",
                                      "description": "Degrees",
                                      "default": 0,
                                      "minimum": 0,
                                      "maximum": 90 };
        }   else {
            subProperties["hh"] = {  "type": "number",
                                      "title": "HH",
                                      "description": "Hours",
                                      "default": 0,
                                      "minimum": 0,
                                      "maximum": 23 };
            
        }
        subProperties["mm"] = {  "type": "number",
                                      "title": "MM",
                                      "description": "Minutes",
                                      "default": 0,
                                      "minimum": 0,
                                      "maximum": 59 };
        subProperties["ss"] = {  "type": "number",
                                      "title": "SS",
                                      "description": "Seconds",
                                      "default": 0,
                                      "minimum": 0,
                                      "maximum": 59 };

        newProperty.properties = subProperties;
        newProperty.required = isDegree?["dd", "mm", "ss"]:["hh", "mm", "ss"];*/
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
                /*propertyValue.title = "Duration (minutes)";
                propertyValue.default = "1";
                propertyValue.description = "Duration of this observation. Enter in decimal for seconds. For example 0.5 for 30 seconds";
                propertyValue.minimum = 0.25;
                propertyValue.options = {
                    grid_columns: 6
                };*/
                /*propertyValue.title = "Duration";
                propertyValue.default = "1H20M30S";
                propertyValue.type = "string";
                propertyValue.description = "Duration of the observation (H-hours,M-minutes,S-seconds & should be in the order of H, M and S respectively)";
                /*let newProperty = {
                    type: "string",
                    title: "Duration",
                    description: `${propertyValue.description} (Hours:Minutes:Seconds)`,
                    default: "00:00:00",
                    "options": {
                        "grid_columns": 5,
                        "inputAttributes": {
                            "placeholder": "HH:mm:ss"
                        },
                        "cleave": {
                            date: true,
                            datePattern: ['HH','mm','ss'],
                            delimiter: ':'
                        }
                    }
                }*/
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
                if (inputKey.endsWith('pointing')) {
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
                if (outputKey.endsWith('pointing')) {
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
            /*return {
                dd: dd,
                mm: mm,
                ss: ss
            }*/
            return (dd<10?`0${dd}`:`${dd}`) + ':' + (mm<10?`0${mm}`:`${mm}`) + ':' + (ss<10?`0${ss}`:`${ss}`);
        }   else {
            const hh = Math.floor(degrees/15);
            const mm = Math.floor((degrees - (hh*15))/15 * 60 );
            const ss = +((degrees -(hh*15)-(mm*15/60))/15 * 3600).toFixed(0);
            /*return {
                hh: hh,
                mm: mm,
                ss: ss
            }*/
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
        /*if ('dd' in prpOutput) {
            return ((prpOutput.dd + prpOutput.mm/60 + prpOutput.ss/3600)*Math.PI/180);
        }   else {
            return ((prpOutput.hh*15 + prpOutput.mm/4  + prpOutput.ss/240)*Math.PI/180);
        }*/
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
            {/* <div><input type="button" onClick={setEditorOutput} value="Show Output" /></div> */}
        </React.Fragment>
    );
};

export default Jeditor;