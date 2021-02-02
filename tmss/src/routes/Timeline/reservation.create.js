import React, {Component} from 'react';
import { Redirect } from 'react-router-dom';

import {Growl} from 'primereact/components/growl/Growl';
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import UIConstants from '../../utils/ui.constants';
import {Calendar} from 'primereact/calendar';
import { InputMask } from 'primereact/inputmask';
import {Dropdown} from 'primereact/dropdown';
import {InputText} from 'primereact/inputtext';
import {InputTextarea} from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import {Dialog} from 'primereact/components/dialog/Dialog';
import ProjectService from '../../services/project.service';
import ReservationService from '../../services/reservation.service';
import UnitService from '../../utils/unit.converter';
import Jeditor from '../../components/JSONEditor/JEditor';

/**
 * Component to create a new Reservation
 */
export class ReservationCreate extends Component {
    constructor(props) {
        super(props);
        this.state= {
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
                start_time: '',
                duration: '',
                project: (props.match?props.match.params.project:null) || null,
            },
            errors: {},                             // Validation Errors
            validFields: {},                        // For Validation
            validForm: false,                       // To enable Save Button
            validEditor: false, 
            durationError: false,
        };
        this.projects = [];                         // All projects to load project dropdown
        this.reservationTemplates = [];

        // Validateion Rules
        this.formRules = {
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
           // project: {required: true, message: "Project can not be empty"},
            start_time: {required: true, message: "From Date can not be empty"},
        };
        this.tooltipOptions = UIConstants.tooltipOptions;
        this.setEditorOutput = this.setEditorOutput.bind(this);
        this.saveReservation = this.saveReservation.bind(this);
        this.reset = this.reset.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.initReservation = this.initReservation.bind(this);
    }

    async componentDidMount() {
        await this.initReservation();
    }
    
    /**
     * Initialized the reservation template
     */
    async initReservation() {
        const promises = [  ProjectService.getProjectList(),
                            ReservationService.getReservationTemplates(),
                        ];
        let emptyProjects = [{url: null, name: "Select Project"}];
       Promise.all(promises).then(responses => {
            this.projects = emptyProjects.concat(responses[0]);
            this.reservationTemplates = responses[1];

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
            });
            });    
        
    }
    
    /**
     * Function to set form values to the Reservation object
     * @param {string} key 
     * @param {object} value 
     */
    setReservationParams(key, value) {
         
        let reservation = this.state.reservation;
        reservation[key] = value;
        this.setState({reservation: reservation, validForm: this.validateForm(key), validEditor: this.validateEditor(),touched: { 
            ...this.state.touched,
            [key]: true
        }});
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
        if(key === 'duration' && !this.validateDuration( value)) {
            this.setState({
                durationError: true
            })
            return;
        }
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
        this.setState({reservation: reservation, validForm: this.validateForm(key), durationError: false});
    }
     
    /**
     * Validate Duration, it allows max 99:59:59
     * @param {*} duration 
     */
    validateDuration(duration) {
        const splitOutput = duration.split(':');
        if (splitOutput.length < 3) {
            return false;
        } else if (parseInt(splitOutput[1])>59 || parseInt(splitOutput[2])>59) {
            return false;
        }
        return true;
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
        }
        return validForm;
    }

    setEditorOutput(jsonOutput, errors) {
        this.paramsOutput = jsonOutput;
        this.validEditor = errors.length === 0;
        this.setState({ paramsOutput: jsonOutput, 
                        validEditor: errors.length === 0,
                        validForm: this.validateForm()});
    }

    saveReservation(){
        let reservation = this.state.reservation;
        let project = this.projects.find(project => project.name === reservation.project);
        reservation['duration'] = ( reservation['duration'] === ''? null: UnitService.getHHmmssToSecs(reservation['duration']));
        reservation['project']=  project ? project.url: null;
        reservation['specifications_template']= this.reservationTemplates[0].url;
        reservation['specifications_doc']= this.paramsOutput;
        reservation = ReservationService.saveReservation(reservation); 
        if (reservation && reservation !== null){
            const dialog = {header: 'Success', detail: 'Reservation is created successfully. Do you want to create another Reservation?'};
            this.setState({ dialogVisible: true, dialog: dialog,  paramsOutput: {}})
        }  else {
            this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to save Reservation'});
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
            duration: '',
            project: '',
        }
        this.setState({
            dialogVisible: false,
            dialog: { header: '', detail: ''},      
            errors: [],
            reservation: tmpReservation,
            paramsSchema: null, 
            paramsOutput: null,
            validEditor: false,
            validFields: {},
            touched:false,
            stationGroup: [],
        });
        this.initReservation();
    }

      /**
     * Cancel Reservation creation and redirect
     */
    cancelCreate() {
        this.props.history.goBack();
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        const schema = this.state.paramsSchema;
        
        let jeditor = null;
        if (schema) {
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
                           actions={[{icon: 'fa-window-close' ,title:'Click to close Reservation creation', props : { pathname: `/su/timelineview/reservation/reservation/list`}}]}/>
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
                                    <label htmlFor="reservationName" className="col-lg-2 col-md-2 col-sm-12">From Date <span style={{color:'red'}}>*</span></label>
                                    <div className="col-lg-3 col-md-3 col-sm-12">
                                        <Calendar 
                                            d dateFormat="dd-M-yy"
                                            value= {this.state.reservation.start_time}
                                            onChange= {e => this.setParams('start_time',e.value)}
                                            onBlur= {e => this.setParams('start_time',e.value)}
                                            data-testid="start_time"
                                            tooltip="Moment at which the reservation starts from, that is, when its reservation can run." tooltipOptions={this.tooltipOptions}
                                            showIcon={true}
                                            showTime= {true}
                                            showSeconds= {true}
                                            hourFormat= "24"
                                        />
                                    
                                        <label className={this.state.errors.from?"error":"info"}>
                                            {this.state.errors.start_time ? this.state.errors.start_time : ""}
                                        </label>
                                    </div>
                                    <div className="col-lg-1 col-md-1 col-sm-12"></div>
                             
                                    <label htmlFor="duration" className="col-lg-2 col-md-2 col-sm-12">Duration </label>
                                    <div className="col-lg-3 col-md-3 col-sm-12" data-testid="duration" >
                                        <InputMask 
                                            value={this.state.reservation.duration} 
                                            mask="99:99:99" 
                                            placeholder="HH:mm:ss" 
                                            onChange= {e => this.setParams('duration',e.value)}
                                            ref={input =>{this.input = input}}
                                            />
                                        <label className="error">
                                            {this.state.durationError ? 'Invalid duration, Maximum:99:59:59.' : ""}
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
                                <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.cancelCreate}  />
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
                                <Button key="back" onClick={() => {this.setState({dialogVisible: false, redirect: `/su/timelineview/reservation/reservation/list`});}} label="No" />
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
                </div>
            </React.Fragment>
        );
    }
}

export default ReservationCreate;