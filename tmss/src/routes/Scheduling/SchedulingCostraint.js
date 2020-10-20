import React, { useState, useEffect } from 'react';
import moment from 'moment';
import Jeditor from '../../components/JSONEditor/JEditor'; 

export default (props) => {
    const { parentFunction = () => {} } = props;
    const [constraintSchema, setConstraintSchema] = useState();
    const [initialValue, setInitialValue] = useState();

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
            if(propertyKey === 'at'){
                propertyValue.propertyOrder=3;
                setDateTimeOption(propertyValue);
            }
            if(propertyKey === 'after'){
                propertyValue.propertyOrder=3;
                setDateTimeOption(propertyValue);
            }
            if(propertyKey === 'before'){
                setDateTimeOption(propertyValue);
                propertyValue.propertyOrder=4;
            }
            if(propertyKey === 'between'){
                propertyValue.propertyOrder=5;
            }
            if(propertyKey === 'not_between'){
                propertyValue.propertyOrder=6;
            }
            if(propertyKey === 'daily'){
                propertyValue.propertyOrder=7;
                propertyValue.format= 'checkbox';
                propertyValue.skipFormat = true;
            }
            if (propertyKey === 'require_night'){
                propertyValue.propertyOrder=8;
            }
            if (propertyKey === 'require_day'){
                propertyValue.propertyOrder=9;
            }
            if (propertyKey === 'avoid_twilight'){
                propertyValue.propertyOrder=10;
            }
            if(propertyKey === 'sky'){
                propertyValue.propertyOrder=11;
            }
            if(propertyKey === 'min_calibrator_elevation'){
                propertyValue.propertyOrder=12;
                propertyValue.validationType= 'elevation';
                propertyValue.options = {
                    inputAttributes: {
                        "placeholder": "30"
                    }
                }
            }
            if(propertyKey === 'min_target_elevation'){
                propertyValue.propertyOrder=13;
                propertyValue.validationType= 'elevation';
                propertyValue.options = {
                    inputAttributes: {
                        "placeholder": "30"
                    }
                }
            }
            if(propertyKey === 'transit_offset'){
                propertyValue.propertyOrder=14;
                for (let type in propertyValue.properties) {
                    propertyValue.properties[type].minimum = 0;
                    propertyValue.properties[type].maximum = 60;
                }
            }
            if(propertyKey === 'min_distance'){
                propertyValue.propertyOrder=15;
            }
            if(propertyKey === 'sun' || propertyKey === 'moon' || propertyKey === 'jupiter'){
                propertyValue.validationType= 'distanceOnSky';
            } 
            if(propertyKey === 'avoid_twilight' || propertyKey === 'require_day' || propertyKey === 'require_night'){
                propertyValue.format= 'checkbox';
                propertyValue.skipFormat = true;
            } 
        }
    };

    const setDateTimeOption = (propertyValue) => {
        propertyValue.format = 'datetime-local';
        propertyValue.validationType = 'dateTime';
        propertyValue.skipFormat = true;
        propertyValue.options = {
            "inputAttributes": {
                "placeholder": "mm/dd/yyyy,--:--"
              },
            "flatpickr": {
                "inlineHideInput": true,
                "wrap": true,
                "enableSeconds": true
            }          
        };
    };

    const configureDefinitions = (schema) => {
        for (const definitionName in schema.definitions) {
            if (definitionName === 'timestamp') {
                schema.definitions.timestamp ={
                    validationType: 'datetime',
                    type: schema.definitions.timestamp.type
                };
            } else if (definitionName != 'timewindow' && definitionName !== 'timestamp') {
                schema.definitions[definitionName] = {
                    type: schema.definitions[definitionName].type
                };
            } else if(definitionName == 'timewindow') {
                for (let property in schema.definitions.timewindow.properties) {
                    if(property === 'to' || property === 'from'){
                        setDateTimeOption(schema.definitions.timewindow.properties[property]);
                        if (property === 'from') {
                            schema.definitions.timewindow.properties[property].propertyOrder = 1;
                        } else {
                            schema.definitions.timewindow.properties[property].propertyOrder = 2;
                            schema.definitions.timewindow.properties[property].title = 'Until';
                        }
                    }
                }
            }
        }
    }

    const onEditForm = (jsonOutput, errors, ref) => {
        if (ref.editors['root.scheduler'] && ref.editors['root.scheduler'].value !== 'manual') {
            const list = ref.editors['root.time.at'].container.className.split(' ');
            if (!list.includes('disable-field')) {
                list.push('disable-field');
            }
            ref.editors['root.time.at'].container.className = list.join(' ');
        } else {
            ref.editors['root.time.at'].container.className = ref.editors['root.time.at'].container.className.replace('disable-field', '');
        }
        if (props.callback) {
            props.callback(jsonOutput, errors);
        }
    }

    const constraintStrategy = () => {
        const constraintTemplate = { ...props.constraintTemplate }
        if (constraintTemplate.schema) {
            configureProperties(constraintTemplate.schema.properties);
            configureDefinitions(constraintTemplate.schema);
        }
        setConstraintSchema(constraintTemplate);
    };

   const radiusToDegree = (object) => {
        for(let type in object) {
            if (typeof object[type] === 'object') {
                radiusToDegree(object[type]);
            } else {
                object[type] = (object[type] * 180) / Math.PI;
            }
        }
    }

    const modififyInitiValue = () => {
        const initValue = { ...props.initValue }
        // For Time
        for (let key in initValue.time) {
            if (typeof initValue.time[key] === 'string') {
                initValue.time[key] = moment(new Date((initValue.time[key] || '').replace('Z', ''))).format("YYYY-MM-DD hh:mm:ss");
            } else {
                initValue.time[key].map(time => {
                    for (let subKey in time) {
                        time[subKey] = moment(new Date((time[subKey] || '').replace('Z', ''))).format("YYYY-MM-DD hh:mm:ss");
                    }
                })
            }
        }
        if (!initValue.time.at) {
            initValue.time.at = '';
        }
        for (let type in initValue.sky.transit_offset) {
            initValue.sky.transit_offset[type] = initValue.sky.transit_offset[type] / 60;
        }
        radiusToDegree(initValue.sky);
        setInitialValue(initValue);
    }

    useEffect(() => {
        if (!props.constraintTemplate) {
            return;
        }
        if (props.initValue) {
            modififyInitiValue();
        }
        constraintStrategy();
    }, [props.constraintTemplate, props.initValue]);

    return (
        <>
            {constraintSchema && React.createElement(Jeditor, {
                title: "Scheduling Constraints specification",
                schema: constraintSchema.schema,
                callback: onEditForm,
                initValue: initialValue,
                disabled: props.disable,
                parentFunction: parentFunction
            })}
        </>
    );
};