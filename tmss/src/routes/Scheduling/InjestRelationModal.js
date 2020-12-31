import React from 'react';
import { Dialog } from 'primereact/dialog';
import {Checkbox} from 'primereact/checkbox';

export default (props) => {
    const isAllTaskChecked = (groupName) => !props.ingestGroup[groupName].filter(task => !task.isProducer).length
    return (
        <Dialog header="Producer Details"
            visible={props.showProducerDialog} maximizable maximized={false} position="center" style={{ width: '50vw' }}
            onHide={props.toggle} >
            <div>
                {Object.keys(props.ingestGroup).map(group => (
                    <>
                        {group !== 'ingest' && (
                            <>
                                <div className="p-col-12">
                                    <Checkbox inputId="Observations" value="Observation" disabled checked={isAllTaskChecked(group)}></Checkbox>
                                    <label htmlFor="Observations" className="p-checkbox-label capitalize">{group}</label>
                                </div>
                                <div className="pl-2">
                                    {props.ingestGroup[group].map(task => (
                                        <div className="p-col-12">
                                            {task.isProducer}
                                            <Checkbox inputId={task.name} disabled checked={task.isProducer}></Checkbox>
                                            <label htmlFor={task.name} className="p-checkbox-label">{task.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ))}
            </div>
        </Dialog>
    )
};
