import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import _ from 'lodash';
import moment from 'moment';
import { Growl } from 'primereact/components/growl/Growl';
import { Dropdown } from 'primereact/dropdown';
import {InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/components/dialog/Dialog';
import Flatpickr from "react-flatpickr";
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import UIConstants from '../../utils/ui.constants';
import { CustomDialog } from '../../layout/components/CustomDialog';

import ProjectService from '../../services/project.service';
import ReservationService from '../../services/reservation.service';
import Jeditor from '../../components/JSONEditor/JEditor';
import UtilService from '../../services/util.service';

import "flatpickr/dist/flatpickr.css";

/**
 * Component to create a new Reservation
 */
export class ReservationCreate extends Component {
    constructor(props) {
        super(props);
        this.state= {
            showDialog: false,
            isDirty: false,
            isLoading: true,
            redirect: null, 
            paramsSchema: null,                     // JSON Schema to be generated from strategy template to pass to JSON editor 
            dialog: { header: '', detail: ''},      // Dialog properties
            touched: {
                name: '',
            },
            reservation: { 
                name: '',
                description: '', 
                start_time: null,
                stop_time: null,
                project: (props.match?props.match.params.project:null) || null,
            },
            reservationStrategy: {
                id: null,
            },
            errors: {},                             // Validation Errors
            validFields: {},                        // For Validation
            validForm: false,                       // To enable Save Button
            validEditor: false
        };
        this.projects = [];                         // All projects to load project dropdown
        this.reservationTemplates = [];
        this.reservationStrategies = [];

        // Validateion Rules
        this.formRules = {
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
           // project: {required: true, message: "Project can not be empty"},
            start_time: {required: true, message: "Start Time can not be empty"},
        };
        this.tooltipOptions = UIConstants.tooltipOptions;
        this.setEditorOutput = this.setEditorOutput.bind(this);
        this.saveReservation = this.saveReservation.bind(this);
        this.reset = this.reset.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.checkIsDirty = this.checkIsDirty.bind(this);
        this.close = this.close.bind(this);
        this.initReservation = this.initReservation.bind(this);
        this.changeStrategy = this.changeStrategy.bind(this);
        this.setEditorFunction = this.setEditorFunction.bind(this);
    }

    async componentDidMount() {
        await this.initReservation();
    }
    
    /**
     * Initialize the reservation and relevant details
     */
    async initReservation() {
        const promises = [  ProjectService.getProjectList(),
                            ReservationService.getReservationTemplates(),
                            UtilService.getUTC(),
                            ReservationService.getReservationStrategyTemplates()
                        ];
        let emptyProjects = [{url: null, name: "Select Project"}];
        Promise.all(promises).then(responses => {
            this.projects = emptyProjects.concat(responses[0]);
            this.reservationTemplates = responses[1];
            let systemTime = moment.utc(responses[2]);
            this.reservationStrategies = responses[3];
            let reservationTemplate = this.reservationTemplates.find(reason => reason.name === 'resource reservation');
            let schema = {
                properties: {}
            };
            if(reservationTemplate) {
                schema = reservationTemplate.schema;
            }
            this.setState({
                paramsSchema: schema,
                isLoading: false,
                reservationTemplate: reservationTemplate,
                systemTime: systemTime,
            });
        });    
        
    }
    
    /**
     * 
     * @param {Id} strategyId - id value of reservation strategy template
     */
    async changeStrategy(strategyId) {
        this.setState({isLoading: true});
        const reservationStrategy = _.find(this.reservationStrategies, {'id': strategyId});
        let paramsOutput = {};
        if(reservationStrategy.template.parameters) {
            //if reservation strategy has parameter then prepare output parameter

        }   else {
            paramsOutput = _.cloneDeep(reservationStrategy.template);
            delete paramsOutput["$id"];
        }
        this.setState({ 
                isLoading: false,
                reservationStrategy: reservationStrategy,
                paramsOutput: paramsOutput,
                isDirty: true});
        this.initReservation();
    }

    /**
     * Function to set form values to the Reservation object
     * @param {string} key 
     * @param {object} value 
     */
    setReservationParams(key, value) {
        let reservation = _.cloneDeep(this.state.reservation);
        reservation[key] = value;
        if  ( !this.state.isDirty && !_.isEqual(this.state.reservation, reservation) ) {
            this.setState({reservation: reservation, validForm: this.validateForm(key), validEditor: this.validateEditor(), touched: { 
                ...this.state.touched,
                [key]: true
            }, isDirty: true});
        }   else {
            this.setState({reservation: reservation, validForm: this.validateForm(key), validEditor: this.validateEditor(),touched: { 
                ...this.state.touched,
                [key]: true
            }});
        }
    }

     /**
     * This function is mainly added for Unit Tests. If this function is removed Unit Tests will fail.
     */
    validateEditor() {
        return this.validEditor;
    }

    /**
     * Function to call on change and blur events from input components
     * @param {string} key 
     * @param {any} value 
     */
    setParams(key, value, type) {
        let reservation = this.state.reservation;
        switch(type) {
            case 'NUMBER': {
                reservation[key] = value?parseInt(value):0;
                break;
            }
            default: {
                reservation[key] = value;                
                break;
            }
        }
        this.setState({reservation: reservation, validForm: this.validateForm(key), isDirty: true});
    }
     
    /**
     * Validation function to validate the form or field based on the form rules.
     * If no argument passed for fieldName, validates all fields in the form.
     * @param {string} fieldName 
     */
    validateForm(fieldName) {
        let validForm = false;
        let errors = this.state.errors;
        let validFields = this.state.validFields;
        if (fieldName) {
            delete errors[fieldName];
            delete validFields[fieldName];
            if (this.formRules[fieldName]) {
                const rule = this.formRules[fieldName];
                const fieldValue = this.state.reservation[fieldName];
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
                const fieldValue = this.state.reservation[fieldName];
                if (rule.required) {
                    if (!fieldValue) {
                        errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
                    }   else {
                        validFields[fieldName] = true;
                    }
                }
            }
        }
        this.setState({errors: errors, validFields: validFields});
        if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
            validForm = true;
            delete errors['start_time'];
            delete errors['stop_time'];
        }
        if (!this.validateDates(this.state.reservation.start_time, this.state.reservation.stop_time)) {
            validForm = false;
            if (!fieldName || fieldName === 'start_time') {
                errors['start_time'] = "Start Time cannot be same or after End Time";
                delete errors['stop_time'];
            }
            if (!fieldName || fieldName === 'stop_time') {
                errors['stop_time'] = "End Time cannot be same or before Start Time";
                delete errors['start_time'];
            }
            this.setState({errors: errors});
        }
        return validForm;
    }

    /**
     * Function to validate if stop_time is always later than start_time if exists.
     * @param {Date} fromDate 
     * @param {Date} toDate 
     * @returns boolean
     */
    validateDates(fromDate, toDate) {
        if (fromDate && toDate && moment(toDate).isSameOrBefore(moment(fromDate))) {
            return false;
        }
        return true;
    }

    setEditorOutput(jsonOutput, errors) {
        this.paramsOutput = jsonOutput;
        this.validEditor = errors.length === 0;
        if  ( !this.state.isDirty && this.state.paramsOutput && !_.isEqual(this.state.paramsOutput, jsonOutput) ) {
            this.setState({ paramsOutput: jsonOutput, 
                validEditor: errors.length === 0,
                validForm: this.validateForm(),
                isDirty: true});
        }   else {
            this.setState({ paramsOutput: jsonOutput, 
                validEditor: errors.length === 0,
                validForm: this.validateForm()});
        }
    }

    async saveReservation(){
        let reservation = this.state.reservation;
        let project = this.projects.find(project => project.name === reservation.project);
        reservation['start_time'] = moment(reservation['start_time']).format(UIConstants.CALENDAR_DATETIME_FORMAT);
        reservation['stop_time'] = reservation['stop_time']?moment(reservation['stop_time']).format(UIConstants.CALENDAR_DATETIME_FORMAT):null;
        reservation['project']=  project ? project.url: null;
        reservation['specifications_template']= this.reservationTemplates[0].url;
        reservation['specifications_doc']= this.paramsOutput;
        reservation = await ReservationService.saveReservation(reservation); 
        if (reservation && reservation.id){
            const dialog = {header: 'Success', detail: 'Reservation is created successfully. Do you want to create another Reservation?'};
            this.setState({ dialogVisible: true, dialog: dialog,  paramsOutput: {}, showDialog: false, isDirty: false})
        }
    }

    /**
     * Reset function to be called when user wants to create new Reservation
     */
    reset() {
        let tmpReservation= { 
            name: '',
            description: '', 
            start_time: '',
            stop_time: '',
            project: '',
        }
        this.setState({
            dialogVisible: false,
            dialog: { header: '', detail: ''},      
            errors: [],
            reservation: tmpReservation,
            reservationStrategy: {
                id: null,
            },
            paramsSchema: null, 
            paramsOutput: null,
            validEditor: false,
            validFields: {},
            touched:false,
            stationGroup: [],
            showDialog: false, 
            isDirty: false
        });
        this.initReservation();
    }

      /**
     * Cancel Reservation creation and redirect
     */
    cancelCreate() {
        this.props.history.goBack();
    }

    /**
     * warn before cancel the page if any changes detected 
     */
    checkIsDirty() {
        if( this.state.isDirty ){
            this.setState({showDialog: true});
        } else {
            this.cancelCreate();
        }
    }
    
    close() {
        this.setState({showDialog: false});
    }

    /**
     * JEditor's function that to be called when parent wants to trigger change in the JSON Editor
     * @param {Function} editorFunction 
     */
    setEditorFunction(editorFunction) {
        this.setState({editorFunction: editorFunction});
    }
    
    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        const schema = this.state.paramsSchema;
        
        let jeditor = null;
        if (schema) {
            if (this.state.reservation.specifications_doc) {
                delete this.state.reservation.specifications_doc.$id;
                delete this.state.reservation.specifications_doc.$schema;
            }
		   jeditor = React.createElement(Jeditor, {title: "Reservation Parameters", 
                                                        schema: schema,
                                                        initValue: this.state.paramsOutput, 
                                                        callback: this.setEditorOutput,
                                                        parentFunction: this.setEditorFunction
                                                    }); 
        }
        return (
            <React.Fragment>
                <Growl ref={(el) => this.growl = el} />
                <PageHeader location={this.props.location} title={'Reservation - Add'} 
                           actions={[{icon: 'fa-window-close' ,title:'Click to close Reservation creation', 
                           type: 'button',  actOn: 'click', props:{ callback: this.checkIsDirty }}]}/>
                { this.state.isLoading ? <AppLoader /> :
                <> 
                    <div>
                        <div className="p-fluid">
                            <div className="p-field p-grid">
                                <label htmlFor="reservationname" className="col-lg-2 col-md-2 col-sm-12">Name <span style={{color:'red'}}>*</span></label>
                                <div className="col-lg-3 col-md-3 col-sm-12">
                                    <InputText className={(this.state.errors.name && this.state.touched.name) ?'input-error':''} id="reservationname" data-testid="name" 
                                                tooltip="Enter name of the Reservation Name" tooltipOptions={this.tooltipOptions} maxLength="128"
                                                ref={input => {this.nameInput = input;}}
                                                value={this.state.reservation.name} autoFocus
                                                onChange={(e) => this.setReservationParams('name', e.target.value)}
                                                onBlur={(e) => this.setReservationParams('name', e.target.value)}/>
                                    <label className={(this.state.errors.name && this.state.touched.name)?"error":"info"}>
                                        {this.state.errors.name && this.state.touched.name ? this.state.errors.name : "Max 128 characters"}
                                    </label>
                                </div>
                                <div className="col-lg-1 col-md-1 col-sm-12"></div>
                                <label htmlFor="description" className="col-lg-2 col-md-2 col-sm-12">Description <span style={{color:'red'}}>*</span></label>
                                <div className="col-lg-3 col-md-3 col-sm-12">
                                    <InputTextarea className={(this.state.errors.description && this.state.touched.description) ?'input-error':''} rows={3} cols={30} 
                                                tooltip="Longer description of the Reservation" 
                                                tooltipOptions={this.tooltipOptions}
                                                maxLength="128"
                                                data-testid="description" 
                                                value={this.state.reservation.description} 
                                                onChange={(e) => this.setReservationParams('description', e.target.value)}
                                                onBlur={(e) => this.setReservationParams('description', e.target.value)}/>
                                    <label className={(this.state.errors.description && this.state.touched.description) ?"error":"info"}>
                                        {(this.state.errors.description && this.state.touched.description) ? this.state.errors.description : "Max 255 characters"}
                                    </label>
                                </div>
                            </div>
                            <div className="p-field p-grid">
                                    <label className="col-lg-2 col-md-2 col-sm-12">Start Time <span style={{color:'red'}}>*</span></label>
                                    <div className="col-lg-3 col-md-3 col-sm-12">
                                        <Flatpickr data-enable-time data-input options={{
                                                    "inlineHideInput": true,
                                                    "wrap": true,
                                                    "enableSeconds": true,
                                                    "time_24hr": true,
                                                    "minuteIncrement": 1,
                                                    "allowInput": true,
                                                    "defaultDate": this.state.systemTime.format(UIConstants.CALENDAR_DEFAULTDATE_FORMAT),
                                                    "defaultHour": this.state.systemTime.hours(),
                                                    "defaultMinute": this.state.systemTime.minutes()
                                                    }}
                                                    title="Start of this reservation"
                                                    value={this.state.reservation.start_time}
                                                    onChange= {value => {this.setParams('start_time', value[0]?value[0]:this.state.reservation.start_time);
                                                        this.setReservationParams('start_time', value[0]?value[0]:this.state.reservation.start_time)}} >
                                            <input type="text" data-input className={`p-inputtext p-component ${this.state.errors.start_time && this.state.touched.start_time?'input-error':''}`} />
                                            <i className="fa fa-calendar" data-toggle style={{position: "absolute", marginLeft: '-25px', marginTop:'5px', cursor: 'pointer'}} ></i>
                                            <i className="fa fa-times" style={{position: "absolute", marginLeft: '-50px', marginTop:'5px', cursor: 'pointer'}} 
                                                onClick={e => {this.setParams('start_time', ''); this.setReservationParams('start_time', '')}}></i>
                                        </Flatpickr>
                                        <label className={this.state.errors.start_time && this.state.touched.start_time?"error":"info"}>
                                            {this.state.errors.start_time && this.state.touched.start_time ? this.state.errors.start_time : ""}
                                        </label>
                                    </div>
                                    <div className="col-lg-1 col-md-1 col-sm-12"></div>
                             
                                    <label className="col-lg-2 col-md-2 col-sm-12">End Time</label>
                                    <div className="col-lg-3 col-md-3 col-sm-12">
                                        <Flatpickr data-enable-time data-input options={{
                                                    "inlineHideInput": true,
                                                    "wrap": true,
                                                    "enableSeconds": true,
                                                    "time_24hr": true,
                                                    "minuteIncrement": 1,
                                                    "allowInput": true,
                                                    "minDate": this.state.reservation.start_time?this.state.reservation.start_time.toDate:'',
                                                    "defaultDate": this.state.systemTime.format(UIConstants.CALENDAR_DEFAULTDATE_FORMAT),
                                                    "defaultHour": this.state.systemTime.hours(),
                                                    "defaultMinute": this.state.systemTime.minutes()
                                                    }}
                                                    title="End of this reservation. If empty, then this reservation is indefinite."
                                                    value={this.state.reservation.stop_time}
                                                    onChange= {value => {this.setParams('stop_time', value[0]?value[0]:this.state.reservation.stop_time);
                                                                            this.setReservationParams('stop_time', value[0]?value[0]:this.state.reservation.stop_time)}} >
                                            <input type="text" data-input className={`p-inputtext p-component ${this.state.errors.stop_time && this.state.touched.stop_time?'input-error':''}`} />
                                            <i className="fa fa-calendar" data-toggle style={{position: "absolute", marginLeft: '-25px', marginTop:'5px', cursor: 'pointer'}} ></i>
                                            <i className="fa fa-times" style={{position: "absolute", marginLeft: '-50px', marginTop:'5px', cursor: 'pointer'}} 
                                                onClick={e => {this.setParams('stop_time', ''); this.setReservationParams('stop_time', '')}}></i>
                                        </Flatpickr>
                                        <label className={this.state.errors.stop_time && this.state.touched.stop_time?"error":"info"}>
                                            {this.state.errors.stop_time && this.state.touched.stop_time ? this.state.errors.stop_time : ""}
                                        </label>
                                    </div>
                                </div>

                                <div className="p-field p-grid">
                                    <label htmlFor="project" className="col-lg-2 col-md-2 col-sm-12">Project</label>
                                    <div className="col-lg-3 col-md-3 col-sm-12" data-testid="project" >
                                        <Dropdown inputId="project" optionLabel="name" optionValue="name" 
                                                tooltip="Project" tooltipOptions={this.tooltipOptions}
                                                value={this.state.reservation.project}
                                                options={this.projects} 
                                                onChange={(e) => {this.setParams('project',e.value)}} 
                                                placeholder="Select Project" />
                                        <label className={(this.state.errors.project && this.state.touched.project) ?"error":"info"}>
                                            {(this.state.errors.project && this.state.touched.project) ? this.state.errors.project : "Select Project"}
                                        </label>
                                    </div>
                                    <div className="col-lg-1 col-md-1 col-sm-12"></div>
                                    <label htmlFor="strategy" className="col-lg-2 col-md-2 col-sm-12">Reservation Strategy</label>
                                    <div className="col-lg-3 col-md-3 col-sm-12" data-testid="strategy" >
                                        <Dropdown inputId="strategy" optionLabel="name" optionValue="id" 
                                                tooltip="Choose Reservation Strategy Template to set default values for create Reservation" tooltipOptions={this.tooltipOptions}
                                                value={this.state.reservationStrategy.id} 
                                                options={this.reservationStrategies} 
                                                onChange={(e) => {this.changeStrategy(e.value)}} 
                                                placeholder="Select Strategy" />
                                        <label className={(this.state.errors.reservationStrategy && this.state.touched.reservationStrategy) ?"error":"info"}>
                                            {(this.state.errors.reservationStrategy && this.state.touched.reservationStrategy) ? this.state.errors.reservationStrategy : "Select Reservation Strategy Template"}
                                        </label>
                                    </div>
                                </div>

                                <div className="p-grid">
                                    <div className="p-col-12">
                                        {this.state.paramsSchema?jeditor:""}
                                    </div>
                                </div>
                        </div>

                        <div className="p-grid p-justify-start">
                            <div className="p-col-1">
                                <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.saveReservation} 
                                        disabled={!this.state.validEditor || !this.state.validForm} data-testid="save-btn" />
                            </div>
                            <div className="p-col-1">
                                <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.checkIsDirty}  />
                            </div>
                        </div>
                    </div>
                </>
                }

                {/* Dialog component to show messages and get input */}
                <div className="p-grid" data-testid="confirm_dialog">
                    <Dialog header={this.state.dialog.header} visible={this.state.dialogVisible} style={{width: '25vw'}} inputId="confirm_dialog"
                            modal={true}  onHide={() => {this.setState({dialogVisible: false})}} 
                            footer={<div>
                                <Button key="back" onClick={() => {this.setState({dialogVisible: false, redirect: `/reservation/list`});}} label="No" />
                                <Button key="submit" type="primary" onClick={this.reset} label="Yes" />
                                </div>
                            } >
                            <div className="p-grid">
                                <div className="col-lg-2 col-md-2 col-sm-2" style={{margin: 'auto'}}>
                                    <i className="pi pi-check-circle pi-large pi-success"></i>
                                </div>
                                <div className="col-lg-10 col-md-10 col-sm-10">
                                    {this.state.dialog.detail}
                                </div>
                            </div>
                    </Dialog>

                    <CustomDialog type="confirmation" visible={this.state.showDialog} width="40vw"
                            header={'Add Reservation'} message={'Do you want to leave this page? Your changes may not be saved.'} 
                            content={''} onClose={this.close} onCancel={this.close} onSubmit={this.cancelCreate}>
                        </CustomDialog>
                </div>
            </React.Fragment>
        );
    }
}

export default ReservationCreate;