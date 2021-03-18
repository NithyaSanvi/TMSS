import React, { useState, useEffect } from 'react';
import {MultiSelect} from 'primereact/multiselect';
import { OverlayPanel } from 'primereact/overlaypanel';
import {InputText} from 'primereact/inputtext';
import { Button } from 'primereact/button';
import UIConstants from '../../utils/ui.constants';
import ScheduleService from '../../services/schedule.service';
/* eslint-disable react-hooks/exhaustive-deps */
/*
const props = {
    selectedStations,
    stationOptions,
    selectedStrategyId,
    observStrategies,
    customStations
}
*/

export default (props) => {
    const { tooltipOptions } = UIConstants;
    let op;

    const [selectedStations, setSelectedStations] = useState([]);
    const [stationOptions, setStationOptions] = useState([]);
    const [customStations, setCustomStations] = useState([]);
    const [customStationsOptions, setCustomStationsOptions] = useState([]);
    const [stations, setStations] = useState([]);
    const [missing_StationFieldsErrors, setmissing_StationFieldsErrors] = useState([]);
    const [state, setState] = useState({
        Custom: {
            stations: []
        }
    });
    
    useEffect(() => {
           reset();
           getAllStations();
    }, [props.stationGroup]);

    // Restting the stations
    const reset = () => {
        setStations([]);
        setSelectedStations([]);
        setStationOptions([]);
        setCustomStations([]);
        setCustomStationsOptions([]);
        setmissing_StationFieldsErrors([]);
    };

    /**
     * Fetches all stations
     */
    const getAllStations = async () => {
        const stationGroup = await ScheduleService.getStationGroup();
        
        const promises = [];
        stationGroup.forEach(st => {
            promises.push(ScheduleService.getStations(st.value))
        });
        Promise.all(promises).then(responses => {
            getStationsDetails(stationGroup, responses);
        });
        setStationOptions(stationGroup);
    };

    /**
     * Cosntruct and set appropriate values to each station by finding station from station_group
     * like error, missing fields, etc.
     * Also will construct stations for custom group by merging all the stations
     */
    const getStationsDetails = (stations, responses) => {
        let stationState = {
            Custom: {
                stations: []  
            }
        };
        let custom_Stations = [];
        setStationOptions(stations);
        let selected_Stations = [];
        responses.forEach((response, index) => {
            const StationName = stations[index].value;
            const missing_StationFields = props.stationGroup.find(i => {
                if (i.stations.length === response.stations.length && i.stations[0] === response.stations[0]) {
                    i.stationType = StationName;
                    return true;
                }
                return false;
            });
            // Missing fields present then it matched with station type otherwise its a custom...
            if (missing_StationFields) {
                selected_Stations = [...selected_Stations, StationName];
            }
            stationState ={
                ...stationState,
                [StationName]: {
                    stations: response.stations,
                    missing_StationFields: missing_StationFields ? isNaN(missing_StationFields.max_nr_missing)? 0: missing_StationFields.max_nr_missing : ''
                },
                Custom: {
                    stations: [...stationState['Custom'].stations, ...response.stations], 
                },
            };
            // Setting in Set to avoid duplicate, otherwise have to loop multiple times.
            custom_Stations = new Set([...custom_Stations, ...response.stations]);
        });
        // Find the custom one
        const custom_stations = props.stationGroup.filter(i => !i.stationType);
        stationState = {
            ...stationState
        };
        setCustomStations(custom_stations);
        setSelectedStationGroup([...selected_Stations]);
        setState(stationState);
        let custom_stations_options = Array.from(custom_Stations);
        // Changing array of sting into array of objects to support filter in primereact multiselect
        custom_stations_options = custom_stations_options.map(i => ({ value: i })); 
        setCustomStationsOptions(custom_stations_options);
        if (props.onUpdateStations) {
            updateSchedulingComp(stationState, [...selected_Stations], missing_StationFieldsErrors, custom_stations);
        }
    };

    /**
     * Method will trigger on change of station group multiselect.
     * Same timw will update the parent component also
     * *param value* -> array of string 
     */
    const setSelectedStationGroup = (value) => {
        setSelectedStations(value);
        if (props.onUpdateStations) {
            updateSchedulingComp(state, value, missing_StationFieldsErrors, customStations);
        }
    };

    /**
     * Method will trigger on change of custom station dropdown.
     */
    const onChangeCustomSelectedStations = (value, index) => {
        const custom_selected_options = [...customStations];
        custom_selected_options[index].stations = value;
        if (value < custom_selected_options[index].max_nr_missing || !value.length) {
            custom_selected_options[index].error = true;
        } else {
            custom_selected_options[index].error = false;
        }
        setCustomStations(custom_selected_options);
        updateSchedulingComp(state, selectedStations, missing_StationFieldsErrors, custom_selected_options);
    };

    /**
     * Method will trigger on click of info icon to show overlay
     * param event -> htmlevent object
     * param key -> string - selected station
     */
    const showStations = (event, key) => {
        op.toggle(event);
        setStations((state[key] && state[key].stations ) || []);
    };

    /**
     * Method will trigger on change of missing fields.
     * Will store all fields error in array of string to enable/disable save button.
     */
    const setNoOfmissing_StationFields = (key, value) => {
        let cpmissing_StationFieldsErrors = [...missing_StationFieldsErrors];
        if (isNaN(value) || value > state[key].stations.length || value.trim() === '') {
            if (!cpmissing_StationFieldsErrors.includes(key)) {
                cpmissing_StationFieldsErrors.push(key);
            }
        } else {
            cpmissing_StationFieldsErrors = cpmissing_StationFieldsErrors.filter(i => i !== key);
        }
        setmissing_StationFieldsErrors(cpmissing_StationFieldsErrors);
        const stationState = {
            ...state,
            [key]: {
                ...state[key],
                missing_StationFields: value,
                error: isNaN(value) || value > state[key].stations.length || value.trim() === ''
            },
        };
        setState(stationState);
        if (props.onUpdateStations) {
            updateSchedulingComp(stationState, selectedStations, cpmissing_StationFieldsErrors, customStations);
        }
    }

    /**
     * Method will trigger onchange of missing fields in custom
     * @param {*} value string
     * @param {*} index number
     */
    const setMissingFieldsForCustom = (value, index) => {
        const custom_selected_options = [...customStations];
        if (isNaN(value) || value > custom_selected_options[index].stations.length || value.trim() === '' || !custom_selected_options[index].stations.length) {
            custom_selected_options[index].error = true;
        } else {
            custom_selected_options[index].error = false;
        }
        custom_selected_options[index].touched = true;
        custom_selected_options[index].max_nr_missing = value;
        setCustomStations(custom_selected_options);
        updateSchedulingComp(state, selectedStations, missing_StationFieldsErrors, custom_selected_options);
    };

    /**
     * Method will get trigger on click of add custom
     */
    const addCustom = () => {
        const custom_selected_options = [...customStations];
        custom_selected_options.push({
            stations: [],
            max_nr_missing: 0,
            error: true
        });
        setCustomStations(custom_selected_options);
        updateSchedulingComp(state, selectedStations, missing_StationFieldsErrors, custom_selected_options);
    };

    const updateSchedulingComp = (param_State, param_SelectedStations, param_missing_StationFieldsErrors, param_Custom_selected_options) => {
        const isError = param_missing_StationFieldsErrors.length || param_Custom_selected_options.filter(i => i.error).length;
       // debugger
        props.onUpdateStations(param_State, param_SelectedStations, isError, param_Custom_selected_options);
    };
    
    /**
     * Method to remove the custom stations
     * @param {*} index number
     */
    const removeCustomStations = (index) => {
        const custom_selected_options = [...customStations];
        custom_selected_options.splice(index,1);
        setCustomStations(custom_selected_options);
        updateSchedulingComp(state, selectedStations, missing_StationFieldsErrors, custom_selected_options);
    };
 
    return (
        <div className={`p-field p-grid grouping p-fluid ${props.isSummary && 'p-col-12'}`} style={{height: props.height}}>
            <fieldset>
                <legend>
                    <label>Station Groups<span style={{color:'red'}}>*</span></label>
                </legend>
                {!props.isSummary && <>
                    {!props.view && <div className="col-sm-12 p-field p-grid" data-testid="stations">
                        <div className="col-md-6 d-flex">
                            <label htmlFor="stationgroup" className="col-sm-6 station_header">Station Groups</label>
                            <div className="col-sm-6">
                                <MultiSelect data-testid="stations" id="stations" optionLabel="value" optionValue="value" filter={true}
                                    tooltip="Select Stations" tooltipOptions={tooltipOptions}
                                    value={selectedStations} 
                                    options={stationOptions} 
                                    placeholder="Select Stations"
                                    onChange={(e) => setSelectedStationGroup(e.value)}
                                />
                            </div>
                        </div>
                        <div className="add-custom">
                            <Button onClick={addCustom} label="Add Custom" icon="pi pi-plus" disabled={!stationOptions.length}/>
                        </div>
                    </div>}
                    {selectedStations.length || customStations.length ? <div className="col-sm-12 selected_stations" data-testid="selected_stations">
                        {<div className="col-sm-12"><label style={{paddingLeft: '8px'}}>Maximum number of stations that can be missed in the selected groups</label></div>}
                        <div className="col-sm-12 p-0 d-flex flex-wrap">
                            {selectedStations.map(i => ( 
                                    <div className="p-field p-grid col-md-6" key={i}>
                                        <label className="col-sm-6 text-caps">
                                            {i}
                                            <i className="pi pi-info-circle info label-icon" onClick={(e) => showStations(e, i)} />
                                        </label>
                                        <div className="col-sm-6">
                                            <InputText id="missingstation" data-testid="name" 
                                                className={(state[i] && state[i].error) ?'input-error':''}
                                                tooltip="Max No. of Missing Stations" tooltipOptions={tooltipOptions} maxLength="128"
                                                placeholder="Max No. of Missing Stations"
                                                value={state[i] ? (state[i].missing_StationFields || 0) : '0'}
                                                disabled={props.view}
                                                onChange={(e) => setNoOfmissing_StationFields(i, e.target.value)}/>
                                            {(state[i] && state[i].error) && <span className="error-message">{state[i].missing_StationFields ? `Max. no of missing stations is ${state[i] ? state[i].stations.length : 0}` : 'Max. no of missing stations required'}</span>}
                                        </div>
                                    </div>
                                ))}
                                {customStations.map((stat, index) => (
                                    <div className="p-field p-grid col-md-12 custom-station-wrapper" key={index}>
                                        {!props.view && <Button icon="pi pi-trash" className="p-button-secondary p-button-text custom-remove" onClick={() => removeCustomStations(index)} />}

                                        <div className="col-md-6 p-field p-grid">
                                            <label className="col-sm-6 text-caps custom-label">
                                                Custom {index + 1}
                                            </label>
                                            <div className="col-sm-6 pr-8 custom-value">
                                                <MultiSelect data-testid="custom_stations" id="custom_stations" filter
                                                    tooltip="Select Stations" tooltipOptions={tooltipOptions}
                                                    value={stat.stations} 
                                                    options={customStationsOptions} 
                                                    placeholder="Select Stations"
                                                    disabled={props.view}
                                                    optionLabel="value"
                                                    optionValue="value" 
                                                    onChange={(e) => onChangeCustomSelectedStations(e.value, index)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6 p-field p-grid">
                                            <label className="col-sm-6 customMissingStationLabel">
                                                Maximum No. Of Missing Stations
                                            </label>
                                        <div className="col-sm-6 pr-8 custom-field">
                                            <InputText id="missingStation" data-testid="name" 
                                            className={(stat.error && stat.touched) ?'input-error':''}
                                                tooltip="Max Number of Missing Stations" tooltipOptions={tooltipOptions} 
                                                placeholder="Max Number of Missing Stations"
                                                value={stat.max_nr_missing}
                                                disabled={props.view}
                                                onChange={(e) => setMissingFieldsForCustom(e.target.value, index)}/>
                                                {(stat.error && stat.touched) && <span className="error-message">{stat.max_nr_missing ? `Max. no of missing stations is ${stat.stations.length}` : 'Max. no of missing stations required'}</span>}
                                                {/* {props.view &&
                                                <span className="info">Max No. of Missing Stations</span>} */}
                                        
                                        </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        
                    </div> : null}
                </>}
                {/* For timeline view, displaying all stations in list */}
                {props.isSummary && (
                    <div className="list-stations-summary">
                        {state && Object.keys(state).map(key => {
                            if (key !== 'Custom') {
                                return (
                                    <>
                                        {state[key].stations.map((station, index) => <div key={index}>{station}</div>)}
                                    </>
                                )
                            }
                        })}
                         {customStations.map((stat, index) => (
                             <>
                                {stat.stations.map(station => <div key={index}>{station}</div>)}
                             </>
                         ))}
                    </div>
                )}
                <OverlayPanel ref={(el) => op = el} dismissable  style={{width: '200px'}}>
                    <h6 className="overlay-panel-header">Stations in group</h6>
                    <div className="station-container">
                        {(stations || []).map(i => (
                            <span>{i}</span>
                        ))}
                    </div>
                </OverlayPanel>
            </fieldset>
        </div>
    );
};