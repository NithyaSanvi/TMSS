import React, { Component } from 'react';
import _ from 'lodash';
import moment from 'moment';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';

import { CustomDialog } from '../../layout/components/CustomDialog';
import { appGrowl } from '../../layout/components/AppGrowl';
import AppLoader from "../../layout/components/AppLoader";
import ViewTable from '../../components/ViewTable';
import PageHeader from '../../layout/components/PageHeader';

import UnitService from '../../utils/unit.converter';
import UIConstants from '../../utils/ui.constants';
import ReservationService from '../../services/reservation.service'; 
import CycleService from '../../services/cycle.service';

export class ReservationList extends Component{
    constructor(props){
        super(props);
        this.state = {
            validFields: {},
            fStartTime: null,   // Filter Start time
            fEndTime: null,     // Filter End Time
            reservationsList: [],
            filteredRowsList: [],
            cycle: [],
            errors: {},
            dialog: {},
            defaultcolumns: [{
                name:"System Id",
                description:"Description",
                start_time: {
                    name: "Start Time",
                    filter: "fromdatetime",
                    format:UIConstants.CALENDAR_DATETIME_FORMAT
                },
                stop_time: {
                    name: "End Time",
                    filter: "todatetime",
                    format:UIConstants.CALENDAR_DATETIME_FORMAT
                },
                duration:{
                    name:"Duration (HH:mm:ss)",
                    format:UIConstants.CALENDAR_TIME_FORMAT
                },
                type: {
                    name:"Reservation type",
                    filter:"select"
                },
                subject: {
                    name:"Subject",
                    filter:"select"
                },
                planned: {
                    name: "Planned",
                    filter:"switch"
                },
                stations:{
                    name: "Stations",
                    filter:"multiselect"
                },
                manual:  {
                    name: "Manual",
                    filter:"switch"
                },
                dynamic: {
                    name: "Dynamic",
                    filter:"switch"
                },
                project_exclusive: {
                    name: "Fixed project",
                    filter:"switch"
                },
                project_id: {
                    name: "Project",
                    filter:"select"
                },
                expert: "Expert",
                hba_rfi: "HBA-RFI",
                lba_rfi: "LBA-RFI",
                actionpath: "actionpath"
            }],
            optionalcolumns:  [{ 
            }],
            columnclassname: [{
                "Duration (HH:mm:ss)":"filter-input-75",
                "Reservation type":"filter-input-100",
                "Subject":"filter-input-75",
                "Planned":"filter-input-50",
                "Stations":"filter-input-150,multi-select",
                "Manual":"filter-input-50",
                "Dynamic":"filter-input-50",
                "Fixed project":"filter-input-50",
                "Expert":"filter-input-50",
                "HBA-RFI":"filter-input-50",
                "LBA-RFI":"filter-input-50",
                
            }],
            defaultSortColumn: [{id: "System Id", desc: false}],
            isLoading: true,
            cycleList: [],
        }

        this.formRules = {
           // fStartTime: {required: true, message: "Start Date can not be empty"},
           // fEndTime: {required: true, message: "Stop Date can not be empty"} 
        };
        this.reservations= [];
        this.cycleList= [];
        this.selectedRows = [];
        
        this.onRowSelection = this.onRowSelection.bind(this);
        this.confirmDeleteReservations = this.confirmDeleteReservations.bind(this);
        this.deleteReservations = this.deleteReservations.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
        this.getReservationDialogContent = this.getReservationDialogContent.bind(this);
    }
    
    async componentDidMount() {
        const promises = [  ReservationService.getReservations(),
            CycleService.getAllCycles(),
        ];
             
        this.reservations = [];
        await Promise.all(promises).then(responses => {
            let reservation = {};
            this.cycleList = responses[1];
            for( const response  of responses[0]){
                reservation = response;
                reservation = this.mergeResourceWithReservation( reservation, response.specifications_doc.activity) ;
                reservation = this.mergeResourceWithReservation( reservation, response.specifications_doc.effects );
                reservation = this.mergeResourceWithReservation( reservation, response.specifications_doc.schedulability );
                if (response.specifications_doc.resources.stations ) {
                    reservation['stations'] = response.specifications_doc.resources.stations.join(', ');
                } else {
                    reservation['stations'] = '';
                }
                if(reservation.duration === null || reservation.duration === ''){
                    reservation.duration = 'Unknown';
                    reservation['stop_time']= 'Unknown';
                } else {
                    let duration = reservation.duration;
                    reservation.duration = UnitService.getSecsToHHmmss(reservation.duration);
                    reservation['stop_time']= moment(reservation['stop_time']).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                }
                reservation['start_time']= moment(reservation['start_time']).format(UIConstants.CALENDAR_DATETIME_FORMAT);
                reservation['actionpath'] = `/reservation/view/${reservation.id}`;
                reservation['canSelect'] = true;
                this.reservations.push(reservation);
            };
            this.cycleList.map(cycle => {
                cycle['url'] = cycle.name;
            });
            
            this.setState({
                isLoading: false,
                reservationsList: this.reservations,
                filteredRowsList: this.reservations,
                cycleList: this.cycleList,
            });
        });
    }
 
    mergeResourceWithReservation ( reservation, params) {
        if( params ){
            Object.keys(params).map((key, i) => (
                ['name', 'description'].indexOf(key)<0? reservation[key]= params[key] : ''      
              ));
        }
        return reservation;
    }

    /**
     * Filter reservation based on cycle filter selected
     * table data = Cycle.start_time < Reservation Start time and End time/Unknown > Cycle.end time
     */
    async filterTableData(cycleValues) {
        let reservationList= [];
        if (cycleValues.length === 0) {
            await this.setState({
                cycle: cycleValues,
                filteredRowsList: this.state.reservationsList,
            })
        } else {
            cycleValues.forEach( cycleValue => {
                const filterCycleList = _.filter(this.cycleList, function(o) { return o.name === cycleValue });
                if (filterCycleList) {
                    let cycle = filterCycleList[0];
                    let cycle_Start_time = moment.utc(moment(cycle['start']).format("YYYY-MM-DD"));  
                    let cycle_End_time = moment.utc(moment(cycle['stop']).format("YYYY-MM-DD"));  
                    this.state.reservationsList.forEach( reservation => {
                        let res_Start_time = moment.utc(moment(reservation['start_time']).format("YYYY-MM-DD"));  
                        let res_End_time = moment.utc(moment(reservation['stop_time']).format("YYYY-MM-DD"));  
                        if (cycle_Start_time.isSameOrBefore(res_Start_time) && cycle_End_time.isSameOrAfter(res_Start_time)) {
                            if ( reservation['stop_time'] === 'Unknown'|| cycle_End_time.isSameOrAfter(res_End_time)) {
                                const tmpList = _.filter(reservationList, function(o) { return o.id === reservation.id });
                                if( tmpList.length === 0) {
                                    reservationList.push(reservation);
                                }
                            }
                        }
                    });
                }
              });
            await this.setState({
                cycle: cycleValues,
                filteredRowsList: reservationList,
            })
        }
    }

    /**
     * Set Filter: Start/End date and time. It will display the reservation which is active during the time frame
     * @param {*} type - Date Filter Name
     * @param {*} value - Date Value
     */
    async setDateRange(type, value) {
        let fStartTime, fEndTime = 0;
        let reservationList= [];
        if(value !== 'undefine' && type === 'fStartTime'){
            await this.setState({'fStartTime': value, validForm: this.validateForm(type)});
        }
        else if(value !== 'undefine' && type === 'fEndTime'){
            await this.setState({'fEndTime': value, validForm: this.validateForm(type)});
        }
        if(this.state.fStartTime !== null && this.state.fEndTime !== null) {
            fStartTime = moment.utc(moment(this.state.fStartTime)).valueOf();
            fEndTime = moment.utc(moment(this.state.fEndTime)).valueOf();
            await this.state.reservationsList.forEach( reservation => {
                let res_Start_time =  moment.utc(moment(reservation['start_time'])).valueOf();
                let res_End_time = 'Unknown';
                if(reservation['stop_time'] === 'Unknown') {
                    if(res_Start_time <= fEndTime){
                        const tmpList = _.filter(reservationList, function(o) { return o.id === reservation.id });
                        if( tmpList.length === 0) {
                            reservationList.push(reservation);
                        }
                    }
                } 
                else {
                    res_End_time = moment.utc(moment(reservation['stop_time'])).valueOf();
                    if(res_Start_time <= fStartTime && res_End_time >= fStartTime) {
                        const tmpList = _.filter(reservationList, function(o) { return o.id === reservation.id });
                        if( tmpList.length === 0) {
                            reservationList.push(reservation);
                        }
                    }
                    else if(res_Start_time >= fStartTime  && res_Start_time <=fEndTime) {
                        const tmpList = _.filter(reservationList, function(o) { return o.id === reservation.id });
                        if( tmpList.length === 0) {
                            reservationList.push(reservation);
                        }
                    }
                } 
            });
            await this.setState({filteredRowsList: reservationList,});
        }
        else {
            await this.setState({filteredRowsList: this.state.reservationsList,});
        }
        
    }

    /**
     * Validate Filter : start/End time
     * @param {*} fieldName 
     */
   async validateForm(fieldName) {
        let validForm = false;
        let errors = this.state.errors;
        let validFields = this.state.validFields;
        if (fieldName) {
            delete errors[fieldName];
            delete validFields[fieldName];
            if (this.formRules[fieldName]) {
                const rule = this.formRules[fieldName];
                const fieldValue = this.state[fieldName];
                if (rule.required) {
                    if (!fieldValue) {
                        errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
                    }   else {
                        validFields[fieldName] = true;
                    }
                }
            }
        }  else {
            errors = {};
            validFields = {};
            for (const fieldName in this.formRules) {
                const rule = this.formRules[fieldName];
                const fieldValue = this.state[fieldName];
                if (rule.required) {
                    if (!fieldValue) {
                        errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
                    }   else {
                        validFields[fieldName] = true;
                    }
                }
            }
        }
        
        await this.setState({errors: errors, validFields: validFields});
        if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
            validForm = true;
        }

        if(this.state['fStartTime'] && this.state['fEndTime']){
            var isSameOrAfter = moment(this.state['fEndTime']).isSameOrAfter(this.state['fStartTime']);
            if(!isSameOrAfter){
                errors['fEndTime'] = `Reserved Between-To can not be before Reserved Between - From`;
                validForm = false;
            }else{
                validForm = true;
            }
        }
        return validForm;
    }
    
    /**
     * Set selected rows form view table
     * @param {Row} selectedRows - rows selected in view table
     */
    onRowSelection(selectedRows) {
        this.selectedRows = selectedRows;
    }

    /**
     * Callback function to close the dialog prompted.
     */
     closeDialog() {
        this.setState({dialogVisible: false});
    }

    /**
     * Create confirmation dialog details
     */
    confirmDeleteReservations() {
        if(this.selectedRows.length === 0) {
            appGrowl.show({severity: 'info', summary: 'Select Row', detail: 'Select Reservation to delete.'});
        }   else {
            let dialog = {};
            dialog.type = "confirmation";
            dialog.header= "Confirm to Delete Reservation(s)";
            dialog.detail = "Do you want to delete the selected Reservation(s)?";
            dialog.content = this.getReservationDialogContent;
            dialog.actions = [{id: 'yes', title: 'Yes', callback: this.deleteReservations},
            {id: 'no', title: 'No', callback: this.closeDialog}];
            dialog.onSubmit = this.deleteReservations;
            dialog.width = '55vw';
            dialog.showIcon = false;
            this.setState({dialog: dialog, dialogVisible: true});
        }
    }

     /**
     * Prepare Reservation(s) details to show on confirmation dialog
     */
      getReservationDialogContent() {
        return  <>  
                <DataTable value={this.selectedRows} resizableColumns columnResizeMode="expand" className="card" style={{paddingLeft: '0em'}}>
                        <Column field="id" header="Reservation Id"></Column>
                        <Column field="name" header="Name"></Column>
                        <Column field="start_time" header="Start time"></Column>
                        <Column field="stop_time" header="End Time"></Column>
                </DataTable>
        </>
    }

    /**
     * Delete selected Reservation(s)
     */
     async deleteReservations() {
        let hasError = false;
        for(const reservation of this.selectedRows) {
            if(!await  ReservationService.deleteReservation(reservation.id)) {
                hasError = true;
            }
        }
        if(hasError){
            appGrowl.show({severity: 'error', summary: 'error', detail: 'Error while deleting Reservation(s)'});
            this.setState({dialogVisible: false});
        }   else {
            this.selectedRows = [];
            this.setState({dialogVisible: false});
            this.componentDidMount();
            appGrowl.show({severity: 'success', summary: 'Success', detail: 'Reservation(s) deleted successfully'});
        }
    }

    render() {
        return ( 
            <React.Fragment>
                <PageHeader location={this.props.location} title={'Reservation - List'} 
                           actions={[{icon: 'fa-plus-square', title:'Add Reservation', props : { pathname: `/reservation/create`}},
                                     {icon: 'fa-window-close', title:'Click to close Reservation list', props : { pathname: `/su/timelineview`}}]}/>     
                 {this.state.isLoading? <AppLoader /> : (this.state.reservationsList && this.state.reservationsList.length>0) ?
                 <>
                    <div className="p-select " style={{position: 'relative'}}>
                        <div className="p-field p-grid">
                            <div className="col-lg-3 col-md-3 col-sm-12 ms-height">
                                <span className="p-float-label">
                                    <MultiSelect data-testid="cycle" id="cycle" optionLabel="name" optionValue="url" filter={true}
                                            tooltip="Select Cycle" tooltipOptions={this.tooltipOptions}
                                            value={this.state.cycle} 
                                            options={this.state.cycleList} 
                                            onChange={(e) => {this.filterTableData(e.value)}} 
                                            className="ms-width"
                                           // placeholder= 'Select Cycle'
                                    />
                                    <label htmlFor="cycle" >Filter by Cycle</label>
                                </span>
                            </div>
                            <div className="col-lg-3 col-md-3 col-sm-6 ms-height" style={{ marginLeft: '1em'}}>
                                <span className="p-float-label">
                                    <Calendar
                                        id="fstartdate"
                                        d dateFormat={UIConstants.CALENDAR_DATE_FORMAT}
                                        value= {this.state.fStartTime}
                                       // placeholder="Select Start Date Time"
                                        onChange= {e => this.setDateRange('fStartTime', e.value)}
                                        tooltip="Select Reserved Between - From"  tooltipOptions={this.tooltipOptions}
                                        showIcon={true}
                                        showTime={true} 
                                        showSeconds={true}
                                    /> 
                                    <label htmlFor="fstartdate" style={{width: '13em'}}>Reserved Between - From</label>
                                </span> 
                                {this.state.fStartTime && <i className="pi pi-times pi-primary" style={{position: 'relative', left:'7.5em', bottom:'25px', cursor:'pointer'}} 
                                                         onClick={() => {this.setDateRange('fStartTime', null)}}></i>    
                                }
                                <label className={this.state.errors.fStartTime?"error":"info"} style={{position: 'relative', bottom: '27px'}}>
                                    {this.state.errors.fStartTime ? this.state.errors.fStartTime : ""}
                                </label>
                            </div>
                            <div className="col-lg-3 col-md-3 col-sm-6 ms-height" style={{ marginLeft: '4em'}}>
                                <span className="p-float-label">
                                    <Calendar
                                        id="fenddate"
                                        d dateFormat={UIConstants.CALENDAR_DATE_FORMAT}
                                        value= {this.state.fEndTime}
                                    // placeholder="Select End Date Time"
                                        onChange= {e => this.setDateRange('fEndTime', e.value)}
                                        tooltip="Select Reserved Between-To" tooltipOptions={this.tooltipOptions}
                                        showIcon={true}
                                        showTime={true} 
                                        showSeconds={true}
                                    />  
                                    <label htmlFor="fenddate" style={{width: '13em'}}>Reserved Between-To</label>
                                </span>
                                 {this.state.fEndTime && <i className="pi pi-times pi-primary" style={{position: 'relative', left:'7.5em', bottom:'25px', cursor:'pointer'}} 
                                                        onClick={() => {this.setDateRange('fEndTime', null)}}></i>    
                                }
                                <label className={this.state.errors.fEndTime?"error":"info"} style={{position: 'relative', bottom: '27px'}} >
                                    {this.state.errors.fEndTime ? this.state.errors.fEndTime : ""}
                                </label>
                            </div>
                        </div>

                    </div>
                    <div className="delete-option">
                        <div >
                            <span className="p-float-label">
                                <a href="#" onClick={this.confirmDeleteReservations}  title="Delete selected Reservation(s)">
                                    <i class="fa fa-trash" aria-hidden="true" ></i>
                                </a>
                            </span>
                        </div>                           
                    </div>
                    <ViewTable 
                        data={this.state.filteredRowsList} 
                        defaultcolumns={this.state.defaultcolumns} 
                        optionalcolumns={this.state.optionalcolumns}
                        columnclassname={this.state.columnclassname}
                        defaultSortColumn={this.state.defaultSortColumn}
                        showaction="true"
                        paths={this.state.paths}
                        tablename="reservation_list"
                        showCSV= {true}
                        allowRowSelection={true}
                        onRowSelection = {this.onRowSelection}
                    />
                </>
                : <div>No Reservation found </div>
                }

                <CustomDialog type="confirmation" visible={this.state.dialogVisible}
                    header={this.state.dialog.header} message={this.state.dialog.detail} actions={this.state.dialog.actions}
                    content={this.state.dialog.content} width={this.state.dialog.width} showIcon={this.state.dialog.showIcon}
                    onClose={this.closeDialog} onCancel={this.closeDialog} onSubmit={this.state.dialog.onSubmit}/>
            </React.Fragment>
        );
    }
}
