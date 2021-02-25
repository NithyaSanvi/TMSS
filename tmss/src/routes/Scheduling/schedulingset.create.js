import React, { Component } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import UIConstants from '../../utils/ui.constants';
import { CustomDialog } from '../../layout/components/CustomDialog';
import ScheduleService from '../../services/schedule.service';
import { Growl } from 'primereact/components/growl/Growl';

export class SchedulingSet extends Component {

    constructor(props) {
        super(props);
        this.state= {
            dialogVisible: true,
            schedulingSet: {
                project: (props.project) ? props.project.url : null,
                name: null,
                description: null,
            },
            projectName: (props.project) ? props.project.name : null,
            errors: [],
            validFields: {},
            onCancel: (props.onCancel) ? props.onCancel: null,
            actions: [ {id:"yes", title: 'Save', callback: this.saveSchedulingSet},
                         {id:"no", title: 'Cancel', callback: this.props.onCancel} ]
        };
        this.actions = [ {id:"yes", title: 'Save', callback: async ()=>{
                            let schedulingSet = this.state.schedulingSet;
                            if (!this.isNotEmpty(schedulingSet.name) || !this.isNotEmpty(schedulingSet.description)){
                                this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Name and Description are mandatory'});
                            }   else {
                                schedulingSet['generator_doc'] = {};
                                schedulingSet['scheduling_unit_drafts'] = [];
                                const suSet = await ScheduleService.saveSchedulingSet(schedulingSet);                         
                                if (suSet.id !== null) {
                                    this.growl.show({severity: 'success', summary: 'Success', detail: 'Scheduling Set is created successfully.'});
                                    this.setState({suSet: suSet, dialogVisible: true, });
                                    this.props.onCancel();
                                }   else {
                                    this.growl.show({severity: 'error', summary: 'Error Occured', detail: schedulingSet.message || 'Unable to save Scheduling Set'});
                                }
                            }
                        }},
                         {id:"no", title: 'Cancel', callback: this.props.onCancel} ];

        this.formRules = {                          // Form validation rules
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
            project: {required: true, message: "Project can not be empty"},
        };

        //this.validateForm = this.validateForm.bind(this);
        this.saveSchedulingSet = this.saveSchedulingSet.bind(this);
        this.close = this.close.bind(this);
        this.isNotEmpty = this.isNotEmpty.bind(this);
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
                const fieldValue = this.state.schedulingSet[fieldName];
                if (rule.required) {
                    if (!fieldValue) {
                        errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
                    }   else {
                        validFields[fieldName] = true;
                    }
                }
            }
        }  /* else {
            errors = {};
            validFields = {};
            for (const fieldName in this.formRules) {
                const rule = this.formRules[fieldName];
                const fieldValue = this.state.schedulingSet[fieldName];
                if (rule.required) {
                    if (!fieldValue) {
                        errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
                    }   else {
                        validFields[fieldName] = true;
                    }
                }
            }
        }*/
        this.setState({errors: errors, validFields: validFields});
        if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
            validForm = true;
        }
        return validForm;
    }

    /**
     * Function to set form values to the SU Set object
     * @param {string} key 
     * @param {object} value 
     */
    setSchedulingSetParams(key, value) {
        this.tooltipOptions = UIConstants.tooltipOptions;
        this.nameInput = React.createRef();         // Ref to Name field for auto focus
        let schedulingSet = this.state.schedulingSet;
        schedulingSet[key] = value;
        let isValid = this.validateForm(key);
       // isValid= this.validateForm('project');
        this.setState({schedulingSet: schedulingSet, validForm: isValid});
    }

    /**
     * Create Scheduling Set
     */
    async saveSchedulingSet(){
        let schedulingSet = this.state.schedulingSet;
        schedulingSet['generator_doc'] = {};
        schedulingSet['scheduling_unit_drafts'] = [];
        const suSet = await ScheduleService.saveSchedulingSet(schedulingSet);
        if (suSet.id !== null) {
            const dialog = {header: 'Success', detail: 'Scheduling Set is created successfully.'};
            this.setState({suSet: suSet, dialogVisible: false, dialog: dialog});
        }   else {
            this.growl.show({severity: 'error', summary: 'Error Occured', detail: schedulingSet.message || 'Unable to save Scheduling Set'});
        }
    }

    close(){
        this.setState({dialogVisible: false});
    }

     /**
     * Check is empty string 
     * @param {*} value 
     */
    isNotEmpty(value){
        if ( value === null || !value || value === 'undefined' || value.length === 0 ){
            return false;
        } else {
            return true;
        }
    }
    render() {
        return (
            <>
                <Growl ref={(el) => this.growl = el} />
                <CustomDialog type="success" visible={this.state.dialogVisible} width="60vw"
                    header={'Add Scheduling Set'} 
                    message=  {
                    <React.Fragment>
                        <div className="p-fluid">
                            <div className="p-field p-grid">
                                <label htmlFor="project" className="col-lg-2 col-md-2 col-sm-12">Project</label>
                                <span className="col-lg-4 col-md-4 col-sm-12" style={{fontWeight: 'bold'}}>{this.state.projectName} </span>
                                <label className={(this.state.errors.project)?"error":"info"}>
                                    {this.state.errors.project ? this.state.errors.project : ""}
                                </label>
                            </div>
                        </div>
                        <div className="col-lg-1 col-md-1 col-sm-12"></div>        
                        <div className="p-fluid">
                            <div className="p-field p-grid">
                                <label htmlFor="project" className="col-lg-2 col-md-2 col-sm-12">Name <span style={{color:'red'}}>*</span></label>
                                <div className="col-lg-4 col-md-4 col-sm-12">
                                    <InputText className={(this.state.errors.name) ?'input-error':''} 
                                        id="suSetName"
                                        tooltip="Enter name of the Scheduling Set" tooltipOptions={this.tooltipOptions} maxLength="128"
                                        ref={input => {this.nameInput = input;}}
                                        onChange={(e) => this.setSchedulingSetParams('name', e.target.value)}
                                        onBlur={(e) => this.setSchedulingSetParams('name', e.target.value)}                                
                                        value={this.state.schedulingSet.name} autoFocus
                                    />
                                    <label className={(this.state.errors.name)?"error":"info"}>
                                        {this.state.errors.name? this.state.errors.name : "Max 128 characters"}
                                    </label>
                                </div>
                        
                                <label htmlFor="description" className="col-lg-2 col-md-2 col-sm-12">Description <span style={{color:'red'}}>*</span></label>
                                <div className="col-lg-4 col-md-4 col-sm-12">
                                    <InputTextarea className={(this.state.errors.description) ?'input-error':''} rows={3} cols={30} 
                                        tooltip="Longer description of the Scheduling Set"  maxLength="128"
                                        value={this.state.schedulingSet.description}
                                        onChange={(e) => this.setSchedulingSetParams('description', e.target.value)}
                                        onBlur={(e) => this.setSchedulingSetParams('description', e.target.value)}
                                    />
                                    <label className={(this.state.errors.description) ?"error":"info"}>
                                        {(this.state.errors.description) ? this.state.errors.description : "Max 255 characters"}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>}
                    content={''} onClose={this.props.onCancel} onCancel={this.props.onCancel} onSubmit={this.saveSU} showAction={true}
                    actions={this.actions}
                    showIcon={false}>
                </CustomDialog>  
            </>
        ); 
    }
}
export default SchedulingSet;