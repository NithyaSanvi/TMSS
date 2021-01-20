import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Link } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import ViewTable from './../../components/ViewTable';

export default ({ tasks, schedulingUnit }) => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const defaultcolumns = [ {
        name: "Name",
        totalSize:{
          name:"Total Size", 
          filter:"minMax"
        },
        totalDeletedSize:{
          name:"Deleted Since",
          filter:"minMax"
        }
    }];
    const optionalcolumns = [{
        actionpath:"actionpath",
    }];
    const defaultSortColumn = [{name: "Name", desc: true}];
    const columnclassname = [{
        "Name" : "filter-input-50", "Total Size" : "filter-input-50", "Deleted Since": "filter-input-50"
    }];

    const toggleDialog = () => {
        setShowConfirmDialog(!showConfirmDialog)
    };

    return (
        <div className="p-fluid mt-2">
            <ViewTable 
                data={tasks.filter(task => task.template.name !== 'ingest' && (task.totalSize || task.totalDeletedSize))} 
                optionalcolumns={optionalcolumns}
                defaultcolumns={defaultcolumns} 
                defaultSortColumn={defaultSortColumn}
                columnclassname={columnclassname}
                showaction="true"
                keyaccessor="id"
                defaultpagesize={tasks.length}
            />
            <div className="p-grid p-justify-start mt-2">
                <div className="p-col-1">
                    <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={toggleDialog} />
                </div>
                <div className="p-col-1">
                    <Button label="Cancel" className="p-button-danger" icon="pi pi-times" style={{ width: '90px' }} />
                </div>
            </div>
            <div className="p-grid" data-testid="confirm_dialog">
                <Dialog header={'Confirmation'} visible={showConfirmDialog} style={{ width: '40vw' }} inputId="confirm_dialog"
                    modal={true} onHide={() => setShowConfirmDialog(false)}
                    footer={<div>
                        <Button key="back" onClick={() => setShowConfirmDialog(false)} label="No" />
                        <Button key="submit" type="primary" onClick={() => setShowConfirmDialog(false)} label="Yes" />
                    </div>
                    } >
                    <div className="p-grid">
                        <div className="col-lg-2 col-md-2 col-sm-2" style={{ margin: 'auto' }}>
                            <i className="pi pi-check-circle pi-large pi-success"></i>
                        </div>
                        <div className="col-lg-10 col-md-10 col-sm-10">
                            Are you sure want to delete
                            <div>SU {schedulingUnit.id}</div>
                            <div>SU Name {schedulingUnit.name}</div>
                            <div>SU Desc {schedulingUnit.description}</div>
                            <div>SU Status {schedulingUnit.status}?</div>
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    )
}