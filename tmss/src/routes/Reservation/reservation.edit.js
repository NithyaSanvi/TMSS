import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import {InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import moment from 'moment';
import _ from 'lodash';
import Flatpickr from "react-flatpickr";

import { CustomDialog } from '../../layout/components/CustomDialog';
import { appGrowl } from '../../layout/components/AppGrowl';
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import Jeditor from '../../components/JSONEditor/JEditor';
import UIConstants from '../../utils/ui.constants';
import ProjectService from '../../services/project.service';
import ReservationService from '../../services/reservation.service';
import UtilService from '../../services/util.service';

export class ReservationEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isDirty: false,
            errors: {},                             // Validation Errors
            validFields: {},                        // For Validation
            validForm: false,                       // To enable Save Button
            validEditor: false,
            reservationStrategy: {
                id: null,
            },
        };
        this.hasProject = false;        // disable project column if project already
        this.projects = [];                         // All projects to load project dropdown
        this.reservationTemplates = [];
        this.reservationStrategies = [];

        this.setEditorOutput = this.setEditorOutput.bind(this);
        this.setEditorFunction = this.setEditorFunction.bind(this);
        this.checkIsDirty = this.checkIsDirty.bind(this);
        this.saveReservation = this.saveReservation.bind(this);
        this.close = this.close.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);

         // Validateion Rules
        this.formRules = {
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
            start_time: {required: true, message: "Start Time can not be empty"},
        };
    }

    componentDidMount() {
        this.initReservation();
    }

    /**
     * JEditor's function that to be called when parent wants to trigger change in the JSON Editor
     * @param {Function} editorFunction 
     */
    setEditorFunction(editorFunction) {
        this.setState({editorFunction: editorFunction});
    }

    /**
     * Initialize the Reservation and related
     */
    async initReservation() {
        const reserId = this.props.match?this.props.match.params.id: null;
        
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
            let schema = {
                properties: {}
            };
            if(this.state.reservationTemplate) {
                schema = this.state.reservationTemplate.schema;
            }
            this.setState({
                paramsSchema: schema,
                isLoading: false,
                systemTime: systemTime
            });
            this.getReservationDetails(reserId);
        });    
       
    }

    /**
     * To get the reservation details from the backend using the service
     * @param {number} Reservation Id
     */
    async getReservationDetails(id) {
        if (id) {
            await ReservationService.getReservation(id)
            .then(async (reservation) => {
                if (reservation) {
                    let reservationTemplate = this.reservationTemplates.find(reserTemplate => reserTemplate.id === reservation.specifications_template_id);
                    if (this.state.editorFunction) {
                        this.state.editorFunction();
                    }
                    // no project then allow to select project from dropdown list
                    this.hasProject = reservation.project?true:false;
                    let schema = {
                        properties: {}
                    };
                    if(reservationTemplate) {
                        schema = reservationTemplate.schema;
                    }
                    let project = this.projects.find(project => project.name === reservation.project_id);
                    reservation['project']=  project ? project.name: null;
                    let strategyName = reservation.specifications_doc.activity.name;
                    let reservationStrategy = null;
                    if (strategyName) {
                        reservationStrategy =  this.reservationStrategies.find(strategy => strategy.name === strategyName);
                    }   else {
                        reservationStrategy= {
                            id: null,
                        }
                    }

                    this.setState({
                        reservationStrategy: reservationStrategy,
                        reservation: reservation, 
                        reservationTemplate: reservationTemplate,
                        paramsSchema: schema,});    
                }   else {
                    this.setState({redirect: "/not-found"});
                }
            });
        }   else {
            this.setState({redirect: "/not-found"});
        }
    }

    close() {
        this.setState({showDialog: false});
    }
 
    /**
     * Cancel edit and redirect to Reservation View page
     */
     cancelEdit() {
        this.props.history.goBack();
    }

    /**
     * warn before cancel this page if any changes detected 
     */
     checkIsDirty() {
        if( this.state.isDirty ){
            this.setState({showDialog: true});
        } else {
            this.cancelEdit();
        }
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
     * Set JEditor output
     * @param {*} jsonOutput 
     * @param {*} errors 
     */
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
     * Update reservation
     */
    async saveReservation(){
        let reservation = this.state.reservation;
        let project = this.projects.find(project => project.name === reservation.project);
        reservation['start_time'] = moment(reservation['start_time']).format(UIConstants.CALENDAR_DATETIME_FORMAT);
        reservation['stop_time'] = (reservation['stop_time'] &&  reservation['stop_time'] !== 'Invalid date') ?moment(reservation['stop_time']).format(UIConstants.CALENDAR_DATETIME_FORMAT):null;
        reservation['project']=  project ? project.url: null;
        reservation['specifications_doc']= this.paramsOutput;
        reservation = await ReservationService.updateReservation(reservation); 
        if (reservation && reservation.id){
            appGrowl.show({severity: 'success', summary: 'Success', detail: 'Reservation updated successfully.'});
            this.props.history.push({
                pathname: `/reservation/view/${this.props.match.params.id}`,
            }); 
        }   else {
            appGrowl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to update Reservation', showDialog: false, isDirty: false});
        }
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        let jeditor = null;
        if (this.state.reservationTemplate) {
            if (this.state.reservation.specifications_doc.$id) {
                delete this.state.reservation.specifications_doc.$id;
                delete this.state.reservation.specifications_doc.$schema;
            }
            jeditor = React.createElement(Jeditor, {title: "Reservation Parameters", 
                                                        schema: this.state.reservationTemplate.schema,
                                                        initValue: this.state.reservation.specifications_doc,
                                                        disabled: false,
                                                        callback: this.setEditorOutput,
                                                        parentFunction: this.setEditorFunction
                                                    });
        }

        return (
            <React.Fragment>
                <PageHeader location={this.props.location} title={'Reservation - Edit'} actions={[{icon:'fa-window-close',
                title:'Click to Close Reservation - Edit', type: 'button',  actOn: 'click', props:{ callback: this.checkIsDirty }}]}/>

                { this.state.isLoading? <AppLoader /> : this.state.reservation &&
                    <React.Fragment>
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
                                    <label className="col-lg-2 col-md-2 col-sm-12">Start Time<span style={{color:'red'}}>*</span></label>
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
                             
                                    <label className="col-lg-2 col-md-2 col-sm-12">End time</label>
                                    <div className="col-lg-3 col-md-3 col-sm-12">
                                        <Flatpickr data-enable-time data-input options={{
                                                    "inlineHideInput": true,
                                                    "wrap": true,
                                                    "enableSeconds": true,
                                                    "time_24hr": true,
                                                    "minuteIncrement": 1,
                                                    "allowInput": true,
                                                    "minDate": this.state.reservation.stop_time?this.state.reservation.stop_time.toDate:'',
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
                                                placeholder="Select Project"
                                                disabled={this.hasProject} 
                                                />
                                        <label className={(this.state.errors.project && this.state.touched.project) ?"error":"info"}>
                                            {(this.state.errors.project && this.state.touched.project) ? this.state.errors.project : this.state.reservation.project? '': "Select Project"}
                                        </label>
                                    </div>
                                    {/* <div className="col-lg-1 col-md-1 col-sm-12"></div>
                                    <label htmlFor="strategy" className="col-lg-2 col-md-2 col-sm-12">Reservation Strategy</label>
                                    <div className="col-lg-3 col-md-3 col-sm-12" data-testid="strategy" >
                                        {this.state.reservationStrategy.id &&
                                        <Dropdown inputId="strategy" optionLabel="name" optionValue="id" 
                                                tooltip="Choose Reservation Strategy Template to set default values for create Reservation" tooltipOptions={this.tooltipOptions}
                                                value={this.state.reservationStrategy.id} 
                                                options={this.reservationStrategies} 
                                                onChange={(e) => {this.changeStrategy(e.value)}} 
                                                placeholder="Select Strategy"
                                                disabled= {true} />
                                        }
                                    </div> */}

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
              
                    </React.Fragment>
                }
                <CustomDialog type="confirmation" visible={this.state.showDialog} width="40vw"
                        header={'Edit Reservation'} message={'Do you want to leave this page? Your changes may not be saved.'} 
                        content={''} onClose={this.close} onCancel={this.close} onSubmit={this.cancelEdit}>
                    </CustomDialog>
            </React.Fragment>
        );
    }
}