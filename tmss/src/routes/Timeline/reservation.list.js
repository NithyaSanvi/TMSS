import React, { Component } from 'react';
import ReservationService from '../../services/reservation.service'; 
import AppLoader from "../../layout/components/AppLoader";
import ViewTable from '../../components/ViewTable';
import PageHeader from '../../layout/components/PageHeader';
import CycleService from '../../services/cycle.service';
import _ from 'lodash';
import moment from 'moment';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import UnitService from '../../utils/unit.converter';
import UIConstants from '../../utils/ui.constants';

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
            defaultcolumns: [{
                name:"System Id",
                description:"Description",
                start_time: {
                    name: "Start Time",
                    filter: "fromdatetime",
                    format:UIConstants.CALENDAR_DATETIME_FORMAT
                },
                end_time: {
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
                    reservation['stations'] = response.specifications_doc.resources.stations.join();
                } else {
                    reservation['stations'] = '';
                }
                if(reservation.duration === null || reservation.duration === ''){
                    reservation.duration = 'Unknown';
                    reservation['end_time']= 'Unknown';
                } else {
                    let duration = reservation.duration;
                    reservation.duration = UnitService.getSecsToHHmmss(reservation.duration);
                    let endDate = moment(reservation.start_time);
                    endDate = moment(endDate).add(duration, 's');
                    reservation['end_time']= moment( reservation['end_time'], moment.ISO_8601).format('YYYY-MM-DD HH:mm:ss');
                }
                reservation['start_time']= moment(reservation['start_time'], moment.ISO_8601).format('YYYY-MM-DD HH:mm:ss');
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
                key !== 'description'? reservation[key]= params[key] : ''      
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
                        let res_End_time = moment.utc(moment(reservation['end_time']).format("YYYY-MM-DD"));  
                        if (cycle_Start_time.isSameOrBefore(res_Start_time) && cycle_End_time.isSameOrAfter(res_Start_time)) {
                            if ( reservation['end_time'] === 'Unknown'|| cycle_End_time.isSameOrAfter(res_End_time)) {
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
                if(reservation['end_time'] === 'Unknown') {
                    if(res_Start_time <= fEndTime){
                        const tmpList = _.filter(reservationList, function(o) { return o.id === reservation.id });
                        if( tmpList.length === 0) {
                            reservationList.push(reservation);
                        }
                    }
                } 
                else {
                    res_End_time = moment.utc(moment(reservation['end_time'])).valueOf();
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
    
    render() {
        return ( 
            <React.Fragment>
                <PageHeader location={this.props.location} title={'Reservation - List'} 
                           actions={[{icon: 'fa-plus-square', title:'Add Reservation', props : { pathname: `/su/timelineview/reservation/create`}},
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
                     
                    <ViewTable 
                        data={this.state.filteredRowsList} 
                        defaultcolumns={this.state.defaultcolumns} 
                        optionalcolumns={this.state.optionalcolumns}
                        columnclassname={this.state.columnclassname}
                        defaultSortColumn={this.state.defaultSortColumn}
                        showaction="false"
                        paths={this.state.paths}
                        keyaccessor="name"
                        unittest={this.state.unittest}
                        tablename="reservation_list"
                        showCSV= {true}
                    />
                </>
                : <div>No Reservation found </div>
                }
            </React.Fragment>
        );
    }
}
