import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import {Checkbox} from 'primereact/checkbox';
import { Button } from 'primereact/button';
import _ from 'lodash';
import UtilService from '../../services/util.service';
/* eslint-disable no-unused-expressions */

export default (props) => {
    //let taskRelationDraft=[],tempTasksRelDraft=[];
    const [ingestRelation, setInjestRelation] = useState(_.cloneDeep(props.ingestGroup));
    const [isToggle, setToggle] = useState(true);
    const [addTaskRelationDraft, setAddTaskRelationDraft] = useState([]);
    const [taskRelationDraft, setTaskRelationDraft] = useState([]);
    const [allTasksRel, setAllTasksRel] = useState([]);
    console.log('ingestRelation',ingestRelation);
    const isAllTaskChecked = (groupName) => !ingestRelation[groupName].filter(task => !task.canIngest).length;

    const addOrDeleteAction = (tempTask,task,isGroup)=>{ 
        let tcanIngest = task.canIngest ;
        let tpCanIngest = tempTask.canIngest;
        if((tpCanIngest && !tcanIngest && isGroup) || (tpCanIngest && !tcanIngest && !isGroup) ){
            tempTask.action='delete';
        }else if((!tpCanIngest && tcanIngest && !isGroup) || (!tpCanIngest && tcanIngest && isGroup)){
            tempTask.action='add';
        }else{
            tempTask.action='';
        }
        return tempTask;
    }
    const processTasks = (taskRelationDraft,task,isGroup)=>{
        let tempTask = UtilService.findObject(taskRelationDraft,task,'id','id');
        let tpTaskPos = UtilService.findObjectIndex(taskRelationDraft,task,'id','id');
        let taskAction = addOrDeleteAction(tempTask,task,isGroup);
        taskRelationDraft[tpTaskPos]=taskAction;
        setTaskRelationDraft([...taskRelationDraft]);
    }
    const toggleCheckItem = (group,task, index) => {
        setToggle(false);
        console.log('allTasksRel',allTasksRel);
        console.log('toggleCheckItem-task',task);  
        const relationGroup = { ...ingestRelation };
        let tasCanIngest =  !relationGroup[group][index].canIngest;
        relationGroup[group][index].canIngest = tasCanIngest;
        //console.log('relationGroup',relationGroup)
        //let ingestType = relationGroup[group][index].canIngest;
        setInjestRelation({...relationGroup}); 
        task.canIngest=tasCanIngest;
        processTasks(taskRelationDraft,task,false,'');//false-Group
        console.log('taskRelationDraft',taskRelationDraft); 
        /* if(!ingestType && addTaskRelationDraft){
            let taskRelationDraft = addTaskRelationDraft.filter((rt)=> rt.task.id !== task.id);
            setAddTaskRelationDraft([...taskRelationDraft]);
        } else{
            taskRelationDraft.push({'task':task,'ingest':relationGroup.ingest[0]});
            setAddTaskRelationDraft([...taskRelationDraft]);
        } */
        
        
    };

    const toggleGroup = (group) => {
        setToggle(false);
        console.log('toggleGroup-task',group); 
        const relationGroup = { ...ingestRelation };
        const findRelGroup = relationGroup[group];
        if (isAllTaskChecked(group)) {
            findRelGroup.map(task => task.canIngest = false);
        } else {
            findRelGroup.map(task => task.canIngest = true);
        }
        findRelGroup.forEach(task => processTasks(taskRelationDraft,task,true));//true-Group
        setInjestRelation(relationGroup);
        console.log('taskRelationDraft',taskRelationDraft); 
    };
    const submitToIngest = ()=>{
        console.log('taskRelationDraft',taskRelationDraft);
        props.submitTRDToIngest({'ingest':ingestRelation.ingest[0],'taskRelationDraft':taskRelationDraft});//addTaskRelationDraft
        setTaskRelationDraft([]);
        //setAddTaskRelationDraft([]);
    };
    const setAllTasks = (group,task)=>{ 
        if (!allTasksRel.some(item => item.id === task.id)) {
            setAllTasksRel(allTasksRel.concat(task));
            setTaskRelationDraft(taskRelationDraft.concat(task));
        }
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
                                    {ingestRelation[group].map((task, index) => 
                                    (
                                        <div className="p-col-12 pl-3">
                                            <Checkbox inputId={task.name} onL onChange={() => toggleCheckItem(group,task, index)} checked={task.canIngest}></Checkbox>
                                            <label htmlFor={task.name} className="p-checkbox-label">{task.name}{setAllTasks(group,task)}</label>
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