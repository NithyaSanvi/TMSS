import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Link } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';

export default ({ data, tasks, schedulingUnit }) => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const toggleDialog = () => {
        setShowConfirmDialog(!showConfirmDialog)
    };

    return (
        <div className="p-fluid">
            <div className="p-field p-grid">
                {data.observation && (
                    <>
                        <label htmlFor="suName" className="col-lg-2 col-md-2 col-sm-12">Observation</label>
                        <div className="col-lg-3 col-md-3 col-sm-12">
                            <span>{data.observation}</span>
                        </div>
                    </>
                )}
                <div className="col-lg-1 col-md-1 col-sm-12"></div>
                {data.observation_deletedSince && (
                    <>
                        <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Observation Deleted Since</label>
                        <div className="col-lg-3 col-md-3 col-sm-12">
                            <span>{data.observation_deletedSince}</span>
                        </div>
                    </>
                )}

                {data.pipeline && (
                    <>
                        <label htmlFor="suName" className="col-lg-2 col-md-2 col-sm-12">Pipeline</label>
                        <div className="col-lg-3 col-md-3 col-sm-12">
                            <span>{data.pipeline}</span>
                        </div>
                    </>
                )}
                <div className="col-lg-1 col-md-1 col-sm-12"></div>
                {data.pipeline_deletedSince && (
                    <>
                        <label htmlFor="suStatus" className="col-lg-2 col-md-2 col-sm-12">Pipeline Deleted Since</label>
                        <div className="col-lg-3 col-md-3 col-sm-12">
                            <span>{data.pipeline_deletedSince}</span>
                        </div>
                    </>
                )}
                <label htmlFor="viewPlots" className="col-lg-2 col-md-2 col-sm-12">View Data Product</label>
                <div className="col-lg-3 col-md-3 col-sm-12" style={{ paddingLeft: '2px' }}>
                    {tasks.map(task => (
                        <>
                            {(task.dataProducts || []).length > 0 && <label className="col-sm-10 ">
                                <Link to={{ pathname: `/task/view/blueprint/${task.id}/dataproducts` }}>{task.name}</Link>
                            </label>}
                        </>
                    ))}
                </div>
            </div>
            <div className="p-grid p-justify-start">
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