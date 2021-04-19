import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import {Checkbox} from 'primereact/checkbox';
import { Button } from 'primereact/button';
import _ from 'lodash';

export default (props) => {
    let taskRelationDraft=[];
    const [ingestRelation, setInjestRelation] = useState(_.cloneDeep(props.ingestGroup));
    const [isToggle, setToggle] = useState(true);
    const [addTaskRelationDraft, setAddTaskRelationDraft] = useState([]);
    //console.log('ingestRelation',ingestRelation);
    const isAllTaskChecked = (groupName) => !ingestRelation[groupName].filter(task => !task.canIngest).length;

    const toggleCheckItem = (group,task, index) => {
        setToggle(false);
        const relationGroup = { ...ingestRelation };
        relationGroup[group][index].canIngest = ! relationGroup[group][index].canIngest;
        //console.log('relationGroup',relationGroup)
        let ingestType = relationGroup[group][index].canIngest;
        setInjestRelation({...relationGroup}); 
        if(!ingestType && addTaskRelationDraft){
            let taskRelationDraft = addTaskRelationDraft.filter((rt)=> rt.task.id !== task.id);
            setAddTaskRelationDraft([...taskRelationDraft]);
        } else{
            taskRelationDraft.push({'task':task,'ingest':relationGroup.ingest[0]});
            setAddTaskRelationDraft([...taskRelationDraft]);
        }
        
        
    };

    const toggleGroup = (group) => {
        setToggle(false);
        if (isAllTaskChecked(group)) {
            const relationGroup = { ...ingestRelation };
            relationGroup[group].map(task => task.canIngest = false);
            setInjestRelation(relationGroup);
        } else {
            const relationGroup = { ...ingestRelation };
            relationGroup[group].map(task => task.canIngest = true);
            setInjestRelation(relationGroup);
        }
    };
    const submitToIngest = ()=>{
        //console.log('addTaskRelationDraft',addTaskRelationDraft);
        props.submitTRDToIngest(addTaskRelationDraft);
        setAddTaskRelationDraft([]);
    };
   
    useEffect(() => {
        setInjestRelation(_.cloneDeep(props.ingestGroup));
    }, [props.ingestGroup]);

    return (
        <Dialog header="Data Product To Ingest"
            visible={props.showTaskRelationDialog} maximizable maximized={false} position="center" style={{ width: '50vw' }}
            onHide={props.toggle} >
            <label><h3>From Task</h3></label>
            <div>
            {Object.keys(ingestRelation).sort().map(group => (
                    <>
                        {group !== 'ingest' && (
                            <>
                            <div className="p-col-12">
                                    <Checkbox inputId={group} value={group} onChange={() => toggleGroup(group)} checked={isAllTaskChecked(group)}></Checkbox>
                                    <label htmlFor={group} className="p-checkbox-label capitalize">{group}</label>
                                </div>
                               <div className="pl-4">
                                    {ingestRelation[group].map((task, index) => (
                                        <div className="p-col-12 pl-3">
                                            <Checkbox inputId={task.name} onChange={() => toggleCheckItem(group,task, index)} checked={task.canIngest}></Checkbox>
                                            <label htmlFor={task.name} className="p-checkbox-label">{task.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </>
                            
                        )}
                    </>
                    ))}
                     <div className="p-grid p-justify-end">
                            <Button label="Save" className="p-button-primary p-mr-2" icon="pi pi-check" disabled={isToggle} onClick={submitToIngest}  data-testid="save-btn" />
                            <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={props.toggle} />
                    </div>
            </div>
        </Dialog>
    )
};