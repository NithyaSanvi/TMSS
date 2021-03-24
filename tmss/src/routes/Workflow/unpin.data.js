import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import ViewTable from './../../components/ViewTable';
import WorkflowService from '../../services/workflow.service';

export default ({ tasks, schedulingUnit, onCancel, getCurrentTaskDetails }) => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const defaultcolumns = [ {
        name: "Name",
        totalDataSize:"Total Data Size(TB)", 
        dataSizeNotDeleted :"Data Size on Disk(TB)"
    }];
    const optionalcolumns = [{
        actionpath:"actionpath",
    }];
    const defaultSortColumn = [{name: "Name", desc: true}];
    const columnclassname = [{
        "Name" : "filter-input-150", "Total Data Size(TB)" : "filter-input-100", "Data Size Not Deleted(TB)": "filter-input-100"
    }];
    const toggleDialog = () => {
        setShowConfirmDialog(!showConfirmDialog)
    };

    /**
     * Method will trigger on click next buton
     * here onNext props coming from parent, where will handle redirection to other page
     */
    const Next = async () => {
        const currentWorkflowTask = await this.props.getCurrentTaskDetails();
        const promise = [];
        if (currentWorkflowTask && !currentWorkflowTask.fields.owner) {
            promise.push(WorkflowService.updateAssignTo(currentWorkflowTask.pk, { owner: this.state.assignTo }));
        }
        promise.push(WorkflowService.updateQA_Perform(this.props.id, {}));
        Promise.all(promise).then((responses) => {
            if (responses.indexOf(null)<0) {
                this.props.onNext();
            }   else {
                this.props.onError();
            } 
        });
        setShowConfirmDialog(false)
    }

    return (
        <div className="p-fluid mt-2">
        <label><h6>Details of data products of Tasks</h6></label>
         <ViewTable 
                 data={tasks.filter(task => (task.totalDataSize || task.dataSizeNotDeleted))} 
                optionalcolumns={optionalcolumns}
                defaultcolumns={defaultcolumns} 
                defaultSortColumn={defaultSortColumn}
                columnclassname={columnclassname}
                showColumnFilter={false}
                showGlobalFilter={false}
                showTopTotal={false}
                allowColumnSelection={false}
                showaction="true"
                keyaccessor="id"
                defaultpagesize={tasks.length}
             />
           <div className="p-grid p-justify-start mt-2">
                <div className="p-col-1">
                    <Button label="Delete" className="p-button-primary" icon="pi pi-trash" onClick={toggleDialog} />
                </div>
                <div className="p-col-1">
                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times" style={{ width: '90px' }}
                            onClick={(e) => { onCancel()}} />
                </div>
            </div>
            <div className="p-grid" data-testid="confirm_dialog">
                <Dialog header={'Confirm'} visible={showConfirmDialog} style={{ width: '40vw' }} inputId="confirm_dialog"
                    modal={true} onHide={() => setShowConfirmDialog(false)}
                    footer={<div>
                        <Button key="back" onClick={Next} label="Yes" />
                        <Button key="submit" type="primary" onClick={() => setShowConfirmDialog(false)} label="No" />
                    </div>
                    } >
                    <div className="p-grid">
                        <div className="col-lg-2 col-md-2 col-sm-2" style={{ margin: 'auto' }}>
                            <i className="pi pi-large pi-question-circle pi-warning"></i>
                        </div>
                        <div className="col-lg-10 col-md-10 col-sm-10">
                            Are you sure you want to delete dataproducts for scheduling unit {schedulingUnit.id} - {schedulingUnit.name} - {schedulingUnit.description} with status {schedulingUnit.status} 
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    )
}
