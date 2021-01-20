import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import ViewTable from './../../components/ViewTable';

export default ({ tasks, schedulingUnit }) => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const defaultcolumns = [ {
        name: "Name",
        totalSize:{
          name:"Total Data Size(TB)", 
          filter:"slider"
        },
        totalDeletedSize:{
          name:"Data Size Not Deleted(TB)",
          filter:"slider"
        }
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

    return (
        <div className="p-fluid mt-2">
        <label>Data Products Details of Task</label>
            <ViewTable 
                 data={tasks.filter(task => task.template.name !== 'ingest' && (task.totalSize || task.totalDeletedSize))} 
                optionalcolumns={optionalcolumns}
                defaultcolumns={defaultcolumns} 
                defaultSortColumn={defaultSortColumn}
                columnclassname={columnclassname}
                showGlobalFilter={false}
                showTopTotal={false}
                allowColumnSelection={false}
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
                <Dialog header={'Request confirmation for data deletion'} visible={showConfirmDialog} style={{ width: '40vw' }} inputId="confirm_dialog"
                    modal={true} onHide={() => setShowConfirmDialog(false)}
                    footer={<div>
                        <Button key="back" onClick={() => setShowConfirmDialog(false)} label="Yes" />
                        <Button key="submit" type="primary" onClick={() => setShowConfirmDialog(false)} label="No" />
                    </div>
                    } >
                    <div className="p-grid">
                        <div className="col-lg-2 col-md-2 col-sm-2" style={{ margin: 'auto' }}>
                            <i className="pi pi-check-circle pi-large pi-success"></i>
                        </div>
                        <div className="col-lg-10 col-md-10 col-sm-10">
                            Are you sure you want to delete dataproducts for scheduling unit {schedulingUnit.id} - {schedulingUnit.name} - {schedulingUnit.description} with status {schedulingUnit.status} ?
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    )
}