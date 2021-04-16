import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'
import moment from 'moment';
import _ from 'lodash';
import Jeditor from '../../components/JSONEditor/JEditor';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import UIConstants from '../../utils/ui.constants';
import { CustomDialog } from '../../layout/components/CustomDialog';
import { appGrowl } from '../../layout/components/AppGrowl';
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import ReservationService from '../../services/reservation.service';

export class ReservationView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            confirmDialogVisible: false,
        };
        this.showIcon = false;
        this.dialogType = "confirmation";
        this.dialogHeader = "";
        this.dialogMsg = "";
        this.dialogContent = "";
        this.callBackFunction = "";
        this.dialogWidth = '40vw';
        this.onClose = this.close;
        this.onCancel =this.close;
        this.deleteReservation = this.deleteReservation.bind(this);
        this.showConfirmation = this.showConfirmation.bind(this);
        this.close = this.close.bind(this);
        this.getDialogContent = this.getDialogContent.bind(this);
        
        if (this.props.match.params.id) {
            this.state.taskId  = this.props.match.params.id;
        }
        if (this.props.match.params.type) {
            this.state.taskType = this.props.match.params.type;
        }
        
    }

    componentDidMount() {
        const reserId = this.props.match?this.props.match.params.id: null;
        this.getReservationDetails(reserId);
    }

     
    /**
     * To get the Reservation details from the backend using the service
     * @param {number} Reservation Id
     */
    getReservationDetails(id) {
        if (id) {
            ReservationService.getReservation(id)
            .then((reservation) => {
                if (reservation) {
                    ReservationService.getReservationTemplate(reservation.specifications_template_id)
                    .then((reservationTemplate) => {
                        if (this.state.editorFunction) {
                            this.state.editorFunction();
                        }
                        this.setState({redirect: null, reservation: reservation, isLoading: false, reservationTemplate: reservationTemplate});
                    });
                }   else {
                    this.setState({redirect: "/not-found"});
                }
            });
        }   else {
            this.setState({redirect: "/not-found"});
        }
    }

    /**
     * Show confirmation dialog
     */
    showConfirmation() {
        this.dialogType = "confirmation";
        this.dialogHeader = "Confirm to Delete Reservation";
        this.showIcon = false;
        this.dialogMsg = "Do you want to delete this Reservation?";
        this.dialogWidth = '55vw';
        this.dialogContent = this.getDialogContent;
        this.callBackFunction = this.deleteReservation;
        this.onClose = this.close;
        this.onCancel =this.close;
        this.setState({confirmDialogVisible: true});
    }

    /**
     * Prepare Reservation details to show on confirmation dialog
     */
    getDialogContent() {
        let reservation = this.state.reservation;
        reservation['start_time'] = (reservation['start_time'] && reservation['start_time'] !== 'Unknown' )?moment.utc(reservation['start_time']).format(UIConstants.CALENDAR_DATETIME_FORMAT): 'Unknown';
        reservation['stop_time'] = (reservation['stop_time'] && reservation['stop_time'] !== 'Unknown' )?moment.utc(reservation['stop_time']).format(UIConstants.CALENDAR_DATETIME_FORMAT): 'Unknown';
        return  <> 
                   <DataTable value={[reservation]} resizableColumns columnResizeMode="expand" className="card" style={{paddingLeft: '0em'}}>
                        <Column field="id" header="Reservation Id"></Column>
                        <Column field="name" header="Name"></Column>
                        <Column field="start_time" header="From Date"></Column>
                        <Column field="stop_time" header="To Date"></Column>
                    </DataTable>
                </>
    }

    close() {
        this.setState({confirmDialogVisible: false});
    }

    /**
     * Delete Reservation
     */
    async deleteReservation() {
        let hasError = false;
        const reserId = this.props.match?this.props.match.params.id: null;
        if(!await ReservationService.deleteReservation(reserId)){
            hasError = true;
        }
        if(hasError){
            appGrowl.show({severity: 'error', summary: 'error', detail: 'Error while deleting Reservation'});
            this.setState({confirmDialogVisible: false});
        }   else {
            appGrowl.show({severity: 'success', summary: 'Success', detail: 'Reservation deleted successfully'});
            this.setState({confirmDialogVisible: false});
            this.setState({redirect: `/reservation/list`});
        }
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        let jeditor = null;
        if (this.state.reservationTemplate) {
            if (this.state.reservation.specifications_doc && this.state.reservation.specifications_doc.$id) {
                delete this.state.reservation.specifications_doc.$id;
                delete this.state.reservation.specifications_doc.$schema;
            }
            jeditor = React.createElement(Jeditor, {title: "Reservation Parameters", 
                                                        schema: this.state.reservationTemplate.schema,
                                                        initValue: this.state.reservation.specifications_doc,
                                                        disabled: true,
                                                    });
        }

        let actions = [ ];
        actions.push({ icon: 'fa-edit', title:'Click to Edit Reservation', props : { pathname:`/reservation/edit/${this.state.reservation?this.state.reservation.id:null}`}}); 
        actions.push({ icon: 'fa fa-trash',title:'Click to Delete Reservation',  
                        type: 'button',  actOn: 'click', props:{ callback: this.showConfirmation}});
        actions.push({  icon: 'fa-window-close', link: this.props.history.goBack,
                        title:'Click to Close Reservation', props : { pathname:'/reservation/list' }});
        return (
            <React.Fragment>
                <PageHeader location={this.props.location} title={'Reservation – Details'} actions={actions}/>
                { this.state.isLoading? <AppLoader /> : this.state.reservation &&
                    <React.Fragment>
                        <div className="main-content">
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Name</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.reservation.name}</span>
                            <label className="col-lg-2 col-md-2 col-sm-12">Description</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.reservation.description}</span>
                        </div>
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Start Time</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{moment.utc(this.state.reservation.start_time).format(UIConstants.CALENDAR_DATETIME_FORMAT)}</span>
                            <label className="col-lg-2 col-md-2 col-sm-12">End Time</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{(this.state.reservation.stop_time && this.state.reservation.stop_time !== 'Unknown')?moment.utc(this.state.reservation.stop_time).format(UIConstants.CALENDAR_DATETIME_FORMAT): 'Unknown'}</span>
                        </div>
                        <div className="p-grid">
                            <label className="col-lg-2 col-md-2 col-sm-12">Project</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{(this.state.reservation.project_id)?this.state.reservation.project_id:''}</span>
                            {/* <label className="col-lg-2 col-md-2 col-sm-12">Reservation Strategy</label>
                            <span className="col-lg-4 col-md-4 col-sm-12">{this.state.reservation.specifications_doc.activity.name}</span> */}
                        </div>
                       
                        <div className="p-fluid">
                            <div className="p-grid"><div className="p-col-12">
                                {this.state.reservationTemplate?jeditor:""}
                            </div></div>
                        </div>
                        </div>
                    </React.Fragment>
                }
                 <CustomDialog type={this.dialogType} visible={this.state.confirmDialogVisible} width={this.dialogWidth}
                    header={this.dialogHeader} message={this.dialogMsg} 
                    content={this.dialogContent} onClose={this.onClose} onCancel={this.onCancel} onSubmit={this.callBackFunction}
                    showIcon={this.showIcon} actions={this.actions}>
                </CustomDialog>
            </React.Fragment>
        );
    }
}