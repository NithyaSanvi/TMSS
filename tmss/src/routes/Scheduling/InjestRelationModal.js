import React from 'react';
import { Dialog } from 'primereact/dialog';
import {Checkbox} from 'primereact/checkbox';
import { useState } from 'react';

export default (props) => {
    const [ingestRelation, setInjestRelation] = useState(props.ingestGroup);

    const isAllTaskChecked = (groupName) => !ingestRelation[groupName].filter(task => !task.isProducer).length;

    const toggleCheckItem = (group, index) => {
        const relationGroup = { ...ingestRelation };
        relationGroup[group][index].isProducer = ! relationGroup[group][index].isProducer;
        setInjestRelation(relationGroup);
    };

    const toggleGroup = (group) => {
        if (isAllTaskChecked(group)) {
            const relationGroup = { ...ingestRelation };
            relationGroup[group].map(task => task.isProducer = false);
            setInjestRelation(relationGroup);
        } else {
            const relationGroup = { ...ingestRelation };
            relationGroup[group].map(task => task.isProducer = true);
            setInjestRelation(relationGroup);
        }
    };

    return (
        <Dialog header="Producer Details"
            visible={props.showProducerDialog} maximizable maximized={false} position="center" style={{ width: '50vw' }}
            onHide={props.toggle} >
            <div>
                {Object.keys(ingestRelation).map(group => (
                    <>
                        {group !== 'ingest' && (
                            <>
                                <div className="p-col-12">
                                    <Checkbox inputId="Observations" value="Observation" onChange={() => toggleGroup(group)} checked={isAllTaskChecked(group)}></Checkbox>
                                    <label htmlFor="Observations" className="p-checkbox-label capitalize">{group}</label>
                                </div>
                                <div className="pl-2">
                                    {props.ingestGroup[group].map((task, index) => (
                                        <div className="p-col-12">
                                            <Checkbox inputId={task.name} onChange={() => toggleCheckItem(group, index)} checked={task.isProducer}></Checkbox>
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
