import React from 'react';
import { Dialog } from 'primereact/dialog';
import {Checkbox} from 'primereact/checkbox';

export default (props) => (
    <Dialog header="Producer Details"
        visible={props.showProducerDialog} maximizable maximized={false} position="center" style={{ width: '50vw' }}
        onHide={props.toggle} >
        <div>
            <div className="p-col-12">
                <Checkbox inputId="Observations" value="Observation" disabled checked={props.isContainsAllObservation}></Checkbox>
                <label htmlFor="Observations" className="p-checkbox-label">Observations</label>
            </div>
            <div className="pl-2">
                <div className="p-col-12">
                    <Checkbox inputId="cb1" value="Calibrator Observation 1" disabled checked={props.producers.includes('Calibrator Observation 1')}></Checkbox>
                    <label htmlFor="cb1" className="p-checkbox-label">Calibrator Observation 1</label>
                </div>
                <div className="p-col-12">
                    <Checkbox inputId="cb2" value="Target Observation" disabled checked={props.producers.includes('Target Observation')}></Checkbox>
                    <label htmlFor="cb2" className="p-checkbox-label">Target Observation</label>
                </div>
                <div className="p-col-12">
                    <Checkbox inputId="cb3" value="Calibrator Observation 2" disabled checked={props.producers.includes('Calibrator Observation 2')}></Checkbox>
                    <label htmlFor="cb3" className="p-checkbox-label">Calibrator Observation 2</label>
                </div>
            </div>
            <div className="p-col-12">
                <Checkbox inputId="Pipelines" value="Pipelines" disabled checked={props.isContainsAllPipeLine}></Checkbox>
                <label htmlFor="Pipelines" className="p-checkbox-label">Pipelines</label>
            </div>
            <div className="pl-2">
                <div className="p-col-12">
                    <Checkbox inputId="cb4" value="Calibrator Pipeline 1" disabled checked={props.producers.includes('Pipeline 1')}></Checkbox>
                    <label htmlFor="cb4" className="p-checkbox-label">Calibrator Pipeline 1</label>
                </div>
                <div className="p-col-12">
                    <Checkbox inputId="cb5" value="San Francisco" disabled checked={props.producers.includes('Pipeline target1')}></Checkbox>
                    <label htmlFor="cb5" className="p-checkbox-label">Target Pipeline 1</label>
                </div>
                <div className="p-col-12">
                    <Checkbox inputId="cb6" value="Los Angeles" disabled checked={props.producers.includes('Pipeline target2')}></Checkbox>
                    <label htmlFor="cb6" className="p-checkbox-label">Target Pipeline 2</label>
                </div>
                <div className="p-col-12">
                    <Checkbox inputId="cb7" value="Calibrator Pipeline 2" disabled checked={props.producers.includes('Pipeline 2')}></Checkbox>
                    <label htmlFor="cb7" className="p-checkbox-label">Calibrator Pipeline 2</label>
                </div>
            </div>
        </div>
    </Dialog>
);
