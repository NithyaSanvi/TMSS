import React, { useState, useEffect } from 'react';
import moment from 'moment';
import _ from 'lodash';
import Jeditor from '../../components/JSONEditor/JEditor'; 
import UnitConversion from '../../utils/unit.converter';
import UIConstants from '../../utils/ui.constants';
import UtilService from '../../services/util.service';
/* eslint-disable react-hooks/exhaustive-deps */

export default (props) => {
    let editorFunction = null;
    const { parentFunction = (editorFn) => { editorFunction = editorFn;} } = props;
    const [constraintSchema, setConstraintSchema] = useState();
    const [initialValue, setInitialValue] = useState();
    const [systemTime, setSystemTime] = useState();
    //SU Constraint Editor Property Order,format and validation
    const configureProperties = (properties) => {
        for (const propertyKey in properties) {
            const propertyValue = properties[propertyKey];
            if (propertyValue instanceof Object) {
                configureProperties(propertyValue)
            }
            if(propertyKey === 'scheduler'){
                propertyValue.propertyOrder=1;
            }
            if(propertyKey === 'time'){
                propertyValue.propertyOrder=2;
            }
            if(propertyKey === 'at' || propertyKey === 'after' || propertyKey === 'before'){
                propertyValue.propertyOrder=3;
                setDateTimeOption(propertyValue);
            }

            if(propertyKey === 'between' || propertyKey === 'not_between' ){
                propertyValue.propertyOrder=4;
            }
            if(propertyKey === 'daily'){
                propertyValue.propertyOrder=5;
                propertyValue.format= 'checkbox';
                propertyValue.skipFormat = true;
            }
            if (propertyKey === 'require_night' || propertyKey === 'require_day' || propertyKey === 'avoid_twilight' ){
                propertyValue.propertyOrder=6;
            }
            if(propertyKey === 'sky'){
                propertyValue.propertyOrder=7;
            }
            if(propertyKey === 'min_calibrator_elevation' || propertyKey === 'min_target_elevation'){
                propertyValue.default = (propertyValue.default * 180) / Math.PI;
                propertyValue.propertyOrder=8;
                propertyValue.validationType= 'elevation';
            }
            if(propertyKey === 'transit_offset'){
                propertyValue.propertyOrder=9;
            }
            if(propertyKey === 'from' ){
                propertyValue.propertyOrder=10;
            }
            if(propertyKey === 'to'){
                propertyValue.propertyOrder=11;
            }
            if(propertyKey === 'sun' || propertyKey === 'moon' || propertyKey === 'jupiter'){
                propertyValue.default = (propertyValue.default * 180) / Math.PI;
                propertyValue.propertyOrder=12;
                propertyValue.validationType= 'distanceOnSky';
            } 
            if(propertyKey === 'avoid_twilight' || propertyKey === 'require_day' || propertyKey === 'require_night'){
                propertyValue.format= 'checkbox';
                propertyValue.skipFormat = true;
            } 
        }
    };
    //DateTime flatPicker component enabled with seconds
    const setDateTimeOption = async(propertyValue) => {
        const systemTime = moment.utc((await UtilService.getUTC()));
        propertyValue.format = 'datetime-local';
        propertyValue.validationType = 'dateTime';
        propertyValue.skipFormat = true;
        propertyValue.options = {
            "inputAttributes": {
                "placeholder": "YYYY-MM-DD HH:mm:ss"
              },
            "flatpickr": {
                "inlineHideInput": true,
                "wrap": true,
                "enableSeconds": true,
                "time_24hr": true,
                "allowInput": true,
                "defaultDate": systemTime.format(UIConstants.CALENDAR_DEFAULTDATE_FORMAT),
                "defaultHour": systemTime.hour(),
                "defaultMinute": systemTime.minutes()
           }          
        };
    };
    //Configuring Schema Definitions
    const configureDefinitions = (schema) => {
        for (const definitionName in schema.definitions) {
            if (definitionName === 'timestamp') {
                schema.definitions.timestamp ={
                    validationType: 'datetime',
                    type: schema.definitions.timestamp.type
                };
            } else if (definitionName !== 'timewindow' && definitionName !== 'timestamp') {
                schema.definitions[definitionName] = {
                    type: schema.definitions[definitionName].type
                };
            } else if(definitionName === 'timewindow') {
                for (let property in schema.definitions.timewindow.properties) {
                    if(property === 'to' || property === 'from'){
                        // setDateTimeOption(schema.definitions.timewindow.properties[property]);
                        if (property === 'from') {
                            schema.definitions.timewindow.properties[property].propertyOrder = 1;
                        } else {
                            schema.definitions.timewindow.properties[property].propertyOrder = 2;
                            schema.definitions.timewindow.properties[property].title = 'until';
                        }
                    }
                }
            }
        }
    }
   
    //Disable 'AT' field when schedular -> online
    const onEditForm = (jsonOutput, errors, ref) => {
        if (ref.editors['root.scheduler'] && ref.editors['root.scheduler'].value.toLowerCase()!== 'manual') {
            if (ref.editors['root.time.at']) {
                const list = ref.editors['root.time.at'].container.className.split(' ');
                if (!list.includes('disable-field')) {
                    list.push('disable-field');
                }
                ref.editors['root.time.at'].container.className = list.join(' ');
                if (ref.editors['root.time.at'].control) {
                    Array.prototype.slice.call(ref.editors['root.time.at'].control.getElementsByTagName('input')).forEach(input => input.disabled = true);
                    Array.prototype.slice.call(ref.editors['root.time.at'].control.getElementsByTagName('button')).forEach(button => button.disabled = true);
                }
            }
        } else {
            if (ref.editors['root.time.at']) {
                ref.editors['root.time.at'].container.className = ref.editors['root.time.at'].container.className.replace('disable-field', '');
                if (ref.editors['root.time.at'].control) {
                    Array.prototype.slice.call(ref.editors['root.time.at'].control.getElementsByTagName('input')).forEach(input => input.disabled = false);
                    Array.prototype.slice.call(ref.editors['root.time.at'].control.getElementsByTagName('button')).forEach(button => button.disabled = false);
                }
            }
        }
        if (props.callback) {
            // Remove 'time' fields if it is empty
            for (const key of _.keys(jsonOutput.time)) {
                if (!jsonOutput.time[key]) {
                    delete jsonOutput.time[key];
                }
            }
            props.callback(jsonOutput, errors);
        }
    }

    const constraintStrategy = async() => {
        const currentSystemTime = moment.utc(await UtilService.getUTC())
        setSystemTime(currentSystemTime);
        // const constraintTemplate = { ...props.constraintTemplate }
        const constraintTemplate = _.cloneDeep(props.constraintTemplate);
        if (constraintTemplate.schema) {
            configureProperties(constraintTemplate.schema.properties);
            configureDefinitions(constraintTemplate.schema);
        }
        setConstraintSchema(constraintTemplate);
    };
  
    const modifyInitiValue = () => {
        const initValue = _.cloneDeep(props.initValue);
        // For DateTime
        for (let key in initValue.time) {
            if (typeof initValue.time[key] === 'string') {
                initValue.time[key] = moment(new Date((initValue.time[key] || '').replace('Z', ''))).format(UIConstants.CALENDAR_DATETIME_FORMAT);
            } else {
                initValue.time[key].forEach(time => {
                    for (let subKey in time) {
                        time[subKey] = moment(new Date((time[subKey] || '').replace('Z', ''))).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                    }
                    return true;
                })
            }
        }
        if (!initValue.time.at) {
          initValue.time.at= '';
        }
        if (!initValue.time.after) {
            initValue.time.after= '';
        }
        if (!initValue.time.before) {
            initValue.time.before= '';
        }
        
    /*   for (let type in initValue.sky.transit_offset) {
            initValue.sky.transit_offset[type] = initValue.sky.transit_offset[type] / 60;
        }*/
        UnitConversion.radiansToDegree(initValue.sky);
        setInitialValue(initValue);
    }

    let jeditor = null;

    useEffect(() => {
        if (!props.constraintTemplate) {
            return;
        }
        UtilService.getUTC().then(utcTime => {
            setSystemTime(moment.utc(utcTime));
        });
        if (props.initValue) {
            modifyInitiValue();
        }
        constraintStrategy();
        if (editorFunction) {
            editorFunction();
        }
    }, [props.constraintTemplate, props.initValue]);

    if (constraintSchema && !jeditor) {
        jeditor = React.createElement(Jeditor, {
                        id: "constraint_editor",
                        title: "Scheduling Constraints specification",
                        schema: constraintSchema.schema,
                        callback: onEditForm,
                        initValue: initialValue,
                        disabled: props.disable,
                        formatOutput: props.formatOutput,
                        parentFunction: parentFunction,
                        defintionFormatter: configureDefinitions
                    });
    }

    return (
        <>
            {constraintSchema?jeditor:""}
        </>
    );
};
