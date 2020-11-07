import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import {MultiSelect} from 'primereact/multiselect';
import { OverlayPanel } from 'primereact/overlaypanel';
import {InputText} from 'primereact/inputtext';
import { Button } from 'primereact/button';
import UIConstants from '../../utils/ui.constants';
import ScheduleService from '../../services/schedule.service';

/*
const props = {
    selectedStations,
    stationOptions,
    selectedStrategyId,
    observStrategies,
    customSelectedStations,
    customStations
}
*/

export default (props) => {
    const { tooltipOptions } = UIConstants;
    let op;

    const [selectedStations, setSelectedStations] = useState([]);
    const [stationOptions, setStationOptions] = useState([]);
    const [customSelectedStations, setCustomSelectedStations] = useState([]);
    const [customStations, setCustomStations] = useState([]);
    const [stations, setStations] = useState([]);
    const [missingFieldsErrors, setMissingFieldsErrors] = useState([]);
    const [state, setState] = useState({
        Custom: {
            stations: []
        }
    });
    
    useEffect(() => {
        if (props.selectedStrategyId || props.targetObservation) {
            getAllStations();
        }
    }, [props.selectedStrategyId, props.targetObservation]);

    const getAllStations = async () => {
        const stationList = await ScheduleService.getStationGroup();
        
        const promises = [];
        stationList.forEach(st => {
            promises.push(ScheduleService.getStations(st.value))
        });
        Promise.all(promises).then(responses => {
            getStationsDetails(stationList, responses);
        });
        setStationOptions(stationList);
    };

    const getStationsDetails = (stationList, responses) => {
        let copyState = {
            Custom: {
                stations: []  
            }
        };
        let copyCustomStations = [];
        stationList.push({
            value: 'Custom'
        });
        setStationOptions(stationList);
        let cpSelectedStations = [];
        responses.forEach((response, index) => {
            const e = stationList[index].value;
            let stationGroups;
            if (!props.targetObservation) {
                const observStrategy = _.find(props.observStrategies, {'id': props.selectedStrategyId});
                stationGroups = observStrategy.template.tasks['Target Observation'].specifications_doc.station_groups; 
            } else {
                stationGroups = props.targetObservation.specifications_doc.station_groups; 
            }
            const missingFields = stationGroups.find(i => {
                if (i.stations.length === response.stations.length && i.stations[0] === response.stations[0]) {
                    i.stationType = e;
                    return true;
                }
                return false;
            });
            if (missingFields) {
                cpSelectedStations = [...cpSelectedStations, e];
            }
            copyState ={
                ...copyState,
                [e]: {
                    stations: response.stations,
                    missingFields: missingFields ? missingFields.max_nr_missing : ''
                },
                ['Custom']: {
                    stations: [...copyState['Custom'].stations, ...response.stations], 
                },
            };
            copyCustomStations = [...copyCustomStations, ...response.stations];
        });
        // Find the custom one
        const observStrategy = _.find(props.observStrategies, {'id': props.selectedStrategyId});
        let stationGroups;
        if (!props.targetObservation) {
            stationGroups = observStrategy.template.tasks['Target Observation'].specifications_doc.station_groups; 
        } else {
            stationGroups = props.targetObservation.specifications_doc.station_groups;
        }
        const custom = stationGroups.find(i => !i.stationType);
        copyState = {
            ...copyState,
            ['Custom']: {
                ...copyState['Custom'],
                missingFields: custom.max_nr_missing
            },
        };
        setSelectedStationGroup([...cpSelectedStations, 'Custom']);
        setState(copyState);
        setCustomSelectedStations(custom.stations);
        setCustomStations(copyCustomStations);
        if (props.onUpdateStations) {
            props.onUpdateStations(copyState, [...cpSelectedStations, 'Custom'], missingFieldsErrors, custom.stations);
        }
    };

    const setSelectedStationGroup = (e) => {
        setSelectedStations(e);
        if (props.onUpdateStations) {
            props.onUpdateStations(state, e, missingFieldsErrors, customSelectedStations);
        }
    };

    const onChangeCustomSelectedStations = (value) => {
        setCustomSelectedStations(value);
    };

    const showStations = (e, key) => {
        op.toggle(e);
        setStations((state[key] && state[key].stations ) || []);
    };

    const setNoOfMissingFields = (key, value) => {
        let cpMissingFieldsErrors = [...missingFieldsErrors];
        if (value > state[key].stations.length) {
            if (!cpMissingFieldsErrors.includes(key)) {
                cpMissingFieldsErrors.push(key);
            }
        } else {
            cpMissingFieldsErrors = cpMissingFieldsErrors.filter(i => i !== key);
        }
        setMissingFieldsErrors(cpMissingFieldsErrors);
        const copyState = {
            ...state,
            [key]: {
                ...state[key],
                missingFields: value,
                error: value > state[key].stations.length
            },
        };
        setState(copyState);
        if (props.onUpdateStations) {
            props.onUpdateStations(copyState, selectedStations, cpMissingFieldsErrors, customSelectedStations);
        }
    }

    return (
        <div className="p-field p-grid grouping p-fluid">
            <fieldset>
                <legend>
                    <label>Stations:<span style={{color:'red'}}>*</span></label>
                </legend>
                {!props.view && <div className="col-lg-3 col-md-3 col-sm-12" data-testid="stations">
                    <MultiSelect data-testid="stations" id="stations" optionLabel="value" optionValue="value" filter={true}
                        tooltip="Select Stations" tooltipOptions={tooltipOptions}
                        value={selectedStations} 
                        options={stationOptions} 
                        placeholder="Select Stations"
                        onChange={(e) => setSelectedStationGroup(e.value)}
                    />
                </div>}
                {selectedStations.length ? <div className="col-sm-12 selected_stations" data-testid="selected_stations">
                    {!props.view && <label>Selected Stations:</label>}
                    <div className="col-sm-12 p-0 d-flex flex-wrap">
                        {selectedStations.map(i => {
                            return i !== 'Custom' ? (
                                <div className="p-field p-grid col-md-6" key={i}>
                                    <label className="col-sm-6 text-caps">
                                        {i}
                                        <Button icon="pi pi-info-circle" className="p-button-rounded p-button-secondary p-button-text info" onClick={(e) => showStations(e, i)} />
                                    </label>
                                    <div className="col-sm-6">
                                        <InputText id="schedUnitName" data-testid="name" 
                                            className={(state[i] && state[i].error) ?'input-error':''}
                                            tooltip="No. of Missing Stations" tooltipOptions={tooltipOptions} maxLength="128"
                                            placeholder="No. of Missing Stations"
                                            value={state[i] && state[i].missingFields ? state[i].missingFields : ''}
                                            disabled={props.view}
                                            onChange={(e) => setNoOfMissingFields(i, e.target.value)}/>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-field p-grid col-md-12" key={i}>
                                    <div className="col-md-6 p-field p-grid">
                                        <label className="col-sm-6 text-caps custom-label">
                                            {i}
                                        </label>
                                        <div className="col-sm-6 pr-8 custom-value">
                                            <MultiSelect data-testid="stations" id="stations" filter={true}
                                                tooltip="Select Stations" tooltipOptions={tooltipOptions}
                                                value={customSelectedStations} 
                                                options={customStations} 
                                                placeholder="Select Stations"
                                                disabled={props.view}
                                                onChange={(e) => onChangeCustomSelectedStations(e.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-sm-6 custom-field">
                                        <InputText id="schedUnitName" data-testid="name" 
                                            className={(state[i] && state[i].error) ?'input-error':''}
                                            tooltip="No. of Missing Stations" tooltipOptions={tooltipOptions} maxLength="128"
                                            placeholder="No. of Missing Stations"
                                            value={state[i] && state[i].missingFields ? state[i].missingFields : ''}
                                            disabled={props.view}
                                            onChange={(e) => setNoOfMissingFields(i, e.target.value)}/>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    
                </div> : null}
                <OverlayPanel ref={(el) => op = el} dismissable  style={{width: '450px'}}>
                    <div className="station-container">
                        {(stations || []).map(i => (
                            <label>{i}</label>
                        ))}
                    </div>
                </OverlayPanel>
            </fieldset>
        </div>
    );
};
