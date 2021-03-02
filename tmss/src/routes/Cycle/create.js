
import React, {Component} from 'react';
import { Redirect } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/components/dialog/Dialog';
import { Growl } from 'primereact/components/growl/Growl';
import { ResourceInputList } from './ResourceInputList';
import { CustomDialog } from '../../layout/components/CustomDialog';
import moment from 'moment'
import _ from 'lodash';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import CycleService from '../../services/cycle.service';
import UnitConverter from '../../utils/unit.converter';
import UIConstants from '../../utils/ui.constants';

/**
 * Component to create a new Cycle
 */
export class CycleCreate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showDialog: false,
            isDirty: false,
            isLoading: true,
            dialog: { header: '', detail: ''},      
            cycle: {
                name: '',
                description: '',
                projects: [],
                quota: [],  
                start: "",
                stop: "",
            },
            timeStamp: Date.now(),
            cycleQuota: {},                       // Resource Allocations
            validFields: {},                        // For Validation
            validForm: false,                       // To enable Save Button
            errors: {},                             // Validation Errors
            resources: [],                          // Selected Resources for Allocation
            resourceList: [],                       // Available Resources for Allocation
        }
        // Validateion Rules
        this.formRules = {
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
            start: {required: true, message: "Start Date can not be empty"},
            stop: {required: true, message: "Stop Date can not be empty"} 
        };
        this.defaultResourcesEnabled = true;        // This property and functionality to be concluded based on PO input
        this.defaultResources = [
                        {name:'LOFAR Observing Time'}, 
                        {name:'LOFAR Observing Time prio A'}, 
                        {name:'LOFAR Observing Time prio B'},
                        {name:'CEP Processing Time'}, 
                        {name:'LTA Storage'}, 
                        {name:'LOFAR LTA resources SARA'}, 
                        {name:'LOFAR LTA resources Jülich'}, 
                        {name:'LOFAR LTA resources Poznan'}, 
                        {name:'LOFAR Observing time DDT/Commissioning'}, 
                        {name:'LOFAR Support Time'}];
        this.cycleResourceDefaults = {};          // Default values for default resources
        this.resourceUnitMap = UnitConverter.resourceUnitMap;       // Resource unit conversion factor and constraints
        this.tooltipOptions = UIConstants.tooltipOptions;
        this.setCycleQuotaDefaults = this.setCycleQuotaDefaults.bind(this);
        this.addNewResource = this.addNewResource.bind(this);
        this.removeResource = this.removeResource.bind(this);
        this.setCycleQuotaParams = this.setCycleQuotaParams.bind(this);
        this.saveCycle = this.saveCycle.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.reset = this.reset.bind(this);
        this.checkIsDirty = this.checkIsDirty.bind(this);
        this.close = this.close.bind(this);
    }

    componentDidMount() {
        CycleService.getResources()
            .then(resourceList => {
                const defaultResources = this.defaultResources;
                resourceList = _.sortBy(resourceList, "name");
                const resources = _.remove(resourceList, function(resource) { return _.find(defaultResources, {'name': resource.name})!=null });
                const cycleQuota = this.setCycleQuotaDefaults(resources);
                this.setState({resourceList: resourceList, resources: resources, cycleQuota: cycleQuota, isLoading: false});
        });
    }

    /**
     * Cycle option sub-component with cycle object
     */
    cycleOptionTemplate(option) {
        return (
            <div className="p-clearfix">
                <span style={{fontSize:'1em',float:'right',margin:'1em .5em 0 0'}}>{option.name}</span>
            </div>
        );
    }

    /**
     * Function to set cycle resource allocation
     * @param {Array} resources 
     */
    setCycleQuotaDefaults(resources) {
        let cycleQuota = this.state.cycleQuota;
        for (const resource of resources) {
            // const conversionFactor = this.resourceUnitMap[resource.quantity_value]?this.resourceUnitMap[resource.quantity_value].conversionFactor:1;
            // cycleQuota[resource['name']] = this.cycleResourceDefaults[resource.name]/conversionFactor;
            cycleQuota[resource['name']] = 0;
        }
        return cycleQuota;
    }

    /**
     * Function to add new resource to Cycle
     */
    addNewResource(){
        if (this.state.newResource) {
            let resourceList = _.cloneDeep(this.state.resourceList);
            const newResource = _.remove(resourceList, {'name': this.state.newResource});
            let resources = this.state.resources;
            resources.push(newResource[0]);
            if  ( !this.state.isDirty && !_.isEqual(this.state.resourceList, resourceList) ) {
                this.setState({resources: resources, resourceList: resourceList, newResource: null, isDirty: true});
            }   else {
                this.setState({resources: resources, resourceList: resourceList, newResource: null});
            }
        }
    }

        /**
     * Callback function to be called from ResourceInpulList when a resource is removed from it
     * @param {string} name - resource_type_id
     */
    removeResource(name) {
        let resources = this.state.resources;
        let resourceList = this.state.resourceList;
        let cycleQuota = _.cloneDeep(this.state.cycleQuota);
        const removedResource = _.remove(resources, (resource) => { return resource.name === name });
        resourceList.push(removedResource[0]);
        resourceList = _.sortBy(resourceList, 'name');
        delete cycleQuota[name];
        if  ( !this.state.isDirty && !_.isEqual(this.state.cycleQuota, cycleQuota) ) {
            this.setState({resourceList: resourceList, resources: resources, cycleQuota: cycleQuota, isDirty: true});
        }   else {
            this.setState({resourceList: resourceList, resources: resources, cycleQuota: cycleQuota});
        }
    }

    /**
     * Function to call on change and blur events from input components
     * @param {string} key 
     * @param {any} value 
     */
    async setCycleParams(key, value, type) {
        let cycle = _.cloneDeep(this.state.cycle);
        switch(type) {
            case 'NUMBER': {
                cycle[key] = value?parseInt(value):0;
                break;
            }
            default: {
                cycle[key] = value;                
                break;
            }
        }
        if  ( !this.state.isDirty && !_.isEqual(this.state.cycle, cycle) ) {
            await this.setState({cycle: cycle});
            await this.setState({validForm: this.validateForm(key), isDirty: true});
        }   else {
            await this.setState({cycle: cycle});
            await this.setState({validForm: this.validateForm(key)});
        }
    }

    /**
     * Callback Function to call from ResourceInputList on change and blur events
     * @param {string} key 
     * @param {InputEvent} event 
     */
    setCycleQuotaParams(key, event) {
        let cycleQuota = _.cloneDeep(this.state.cycleQuota);
        if (event.target.value) {
            let resource = _.find(this.state.resources, {'name': key});
            
            let newValue = 0;
            if (this.resourceUnitMap[resource.quantity_value] && 
                event.target.value.toString().indexOf(this.resourceUnitMap[resource.quantity_value].display)>=0) {
                newValue = _.trim(event.target.value.replace(this.resourceUnitMap[resource.quantity_value].display,'',''));
            }   else {
                newValue = _.trim(event.target.value);
            }
            cycleQuota[key] = (newValue==="NaN" || isNaN(newValue))?0:Number(newValue);
        }   else {
            let cycleQuota = this.state.cycleQuota;
            cycleQuota[key] = 0;
        }

        if  ( !this.state.isDirty && !_.isEqual(this.state.cycleQuota, cycleQuota) ) {
            this.setState({cycleQuota: cycleQuota, isDirty: true});
        }   else {
            this.setState({cycleQuota: cycleQuota});
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
                const fieldValue = this.state.cycle[fieldName];
                if (rule.required) {
                    if (!fieldValue) {
                        errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
                    }   else {
                        validFields[fieldName] = true;
                    }
                }
            }
        }   else {
            errors = {};
            validFields = {};
            for (const fieldName in this.formRules) {
                const rule = this.formRules[fieldName];
                const fieldValue = this.state.cycle[fieldName];
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

        if(this.state.cycle['start'] && this.state.cycle['stop']){
            var isSameOrAfter = moment(this.state.cycle['stop']).isSameOrAfter(this.state.cycle['start']);
            if(!isSameOrAfter){
                errors['stop'] = ` Stop date can not be before Start date`;
                validForm = false;
                return validForm;
            }else{
                delete errors['stop'];
                validForm = true;
            }
        }

        if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
            validForm = true;
        } else {
            validForm = false
        }

        return validForm;
    }
    
    /**
     * Function to call when 'Save' button is clicked to save the Cycle.
     */
    saveCycle() {
        if (this.validateForm) {
            let cycleQuota = [];
            let cycle = this.state.cycle;
             // let stoptime =  _.replace(this.state.cycle['stop'],'00:00:00', '23:59:59');
             cycle['start'] = cycle['start'];
             cycle['stop'] = cycle['stop'];
             this.setState({cycle: cycle, isDirty: false});
            for (const resource in this.state.cycleQuota) {
                let resourceType = _.find(this.state.resources, {'name': resource});
                if(resourceType){
                    let quota = { cycle: this.state.cycle.name,
                        resource_type: resourceType['url'],
                        value: this.state.cycleQuota[resource] * (this.resourceUnitMap[resourceType.quantity_value]?this.resourceUnitMap[resourceType.quantity_value].conversionFactor:1)};
                    cycleQuota.push(quota);
                }
               
            }
            
        CycleService.saveCycle(this.state.cycle, this.defaultResourcesEnabled?cycleQuota:[])
            .then(cycle => {
                if (cycle.url) {
                    let dialog = {};
                    if (this.defaultResourcesEnabled) {
                        dialog = {header: 'Success', detail: 'Cycle saved successfully. Do you want to create another Cycle?'};
                    }   else {
                        dialog = {header: 'Success', detail: 'Cycle saved successfully with default Resource allocations. Do you want to view and edit them?'};
                    }
                    this.setState({cycle:cycle, dialogVisible: true, dialog: dialog})
                }   else {
                    this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to save Cycle'});
                    this.setState({errors: cycle});
                }
            });
        }
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
     * Function to cancel form creation and navigate to other page/component
     */
    cancelCreate() {
        this.setState({redirect: '/cycle'});
    }

    /**
     * Reset function to be called to reset the form fields
     */
    reset() {
        if (this.defaultResourcesEnabled) {
            let prevResources = this.state.resources;
            let resourceList = [];
            let resources = [];
            if (resources) {
                const defaultResources = this.defaultResources;
                resourceList = _.sortBy(prevResources.concat(this.state.resourceList), "name");
                resources = _.remove(resourceList, function(resource) { return _.find(defaultResources, {'name': resource.name})!=null });
            }
            const cycleQuota = this.setCycleQuotaDefaults(resources);
            this.setState({
                dialog: { header: '', detail: ''},
                cycle: {
                    name: '',
                    description: '',
                    start: null,
                    stop: null,
                    projects: [],
                    quota: [],  
                },
                timeStamp: Date.now(),
                cycleQuota: cycleQuota,
                validFields: {},
                validForm: false,
                errors: {},
                dialogVisible: false,
                resources: resources,
                resourceList: resourceList
            });
        }   else {
            this.setState({redirect: `/cycle/edit/${this.state.cycle.name}`})
        }
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        
        return (
            <React.Fragment>
                <Growl ref={(el) => this.growl = el} />
               { /*<div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Cycle - Add</h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: '/cycle'}} tite="Close Edit" style={{float: "right"}}>
                            <i className="fa fa-window-close" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                </div> */ }
                
                <PageHeader location={this.props.location} title={'Cycle - Add'} actions={[{icon:'fa-window-close',
                            title:'Click to Close Add Cycle',
                            type: 'button',  actOn: 'click', props:{ callback: this.checkIsDirty }}]}/>
                { this.state.isLoading ? <AppLoader /> :
                <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid" style={{display: 'none'}}>
                            <label htmlFor="cycleId" className="col-lg-2 col-md-2 col-sm-12">URL </label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <input id="cycleId" data-testid="cycleId" value={this.state.cycle.url} />
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="cycleName" className="col-lg-2 col-md-2 col-sm-12">Name <span style={{color:'red'}}>*</span></label>
                           <div className="col-lg-3 col-md-3 col-sm-12">
                                <InputText className={this.state.errors.name ?'input-error':''} id="cycleName" data-testid="name" 
                                            tooltip="Enter name of the cycle" tooltipOptions={this.tooltipOptions} maxLength="128"
                                            value={this.state.cycle.name} 
                                            onChange={(e) => this.setCycleParams('name', e.target.value)}
                                            onBlur={(e) => this.setCycleParams('name', e.target.value)}/>
                                <label className={this.state.errors.name?"error":"info"}>
                                    {this.state.errors.name ? this.state.errors.name : "Max 128 characters"}
                                </label>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="description" className="col-lg-2 col-md-2 col-sm-12">Description <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <InputTextarea className={this.state.errors.description ?'input-error':''} rows={3} cols={30} 
                                            tooltip="Short description of the cycle" tooltipOptions={this.tooltipOptions} maxLength="128"
                                            data-testid="description" value={this.state.cycle.description} 
                                            onChange={(e) => this.setCycleParams('description', e.target.value)}
                                            onBlur={(e) => this.setCycleParams('description', e.target.value)}/>
                                <label className={this.state.errors.description ?"error":"info"}>
                                    {this.state.errors.description ? this.state.errors.description : "Max 255 characters"}
                                </label>
                            </div>
                        </div>
                         
                        <div className="p-field p-grid">
                            <label htmlFor="cycleName" className="col-lg-2 col-md-2 col-sm-12">Start Date <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <Calendar
                                    key={this.state.timeStamp}
 				                    d dateFormat={UIConstants.CALENDAR_DATE_FORMAT}
                                    value= {this.state.cycle.start}
                                    onChange= {e => this.setCycleParams('start',e.value)}
                                    data-testid="start"
                                    tooltip="Moment at which the cycle starts, that is, when its projects can run." tooltipOptions={this.tooltipOptions}
				                    showIcon={true}
                                />
                               
                                <label className={this.state.errors.start?"error":"info"}>
                                    {this.state.errors.start ? this.state.errors.start : ""}
                                </label>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="cycleName" className="col-lg-2 col-md-2 col-sm-12">Stop Date <span style={{color:'red'}}>*</span></label>
                             <div className="col-lg-3 col-md-3 col-sm-12">
                                <Calendar
                                    key={this.state.timeStamp}
                                    d dateFormat={UIConstants.CALENDAR_DATE_FORMAT}
                                    value= {this.state.cycle.stop}
                                    onChange= {e => this.setCycleParams('stop', e.value)}
                                    data-testid="stop"
                                    tooltip="Moment at which the cycle officially ends." tooltipOptions={this.tooltipOptions}
                                    showIcon={true}
                                />
                                
                                <label className={this.state.errors.stop?"error":"info"}>
                                    {this.state.errors.stop ? this.state.errors.stop : ""}
                                </label>
                            </div>
                        </div>

                        {this.defaultResourcesEnabled && this.state.resourceList &&
                            <div className="p-fluid">
                                <div className="p-field p-grid">
                                    <div className="col-lg-2 col-md-2 col-sm-12">
                                        <h5 data-testid="resource_alloc">Resource Allocations</h5>
                                    </div>
                                    <div className="col-lg-3 col-md-3 col-sm-10">
                                        <Dropdown optionLabel="name" optionValue="name" 
                                            tooltip="Resources to be allotted for the cycle" 
                                            tooltipOptions={this.tooltipOptions}
                                            value={this.state.newResource} 
                                            options={this.state.resourceList} 
                                            onChange={(e) => {this.setState({'newResource': e.value})}}
                                            placeholder="Add Resources" />
                                    </div>
                                    <div className="col-lg-2 col-md-2 col-sm-2">
                                         <Button label="" className="p-button-primary" icon="pi pi-plus" onClick={this.addNewResource} data-testid="add_res_btn" />
                                    </div>
                                </div>
                                <div className="p-field p-grid resource-input-grid">
                                    <ResourceInputList list={this.state.resources} unitMap={this.resourceUnitMap} 
                                        cycleQuota={this.state.cycleQuota} callback={this.setCycleQuotaParams} 
                                        removeInputCallback={this.removeResource} />
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <div className="p-grid p-justify-start act-btn-grp">
                    <div className="p-col-1">
                        <Button label="Save" className="p-button-primary" id="save-btn" data-testid="save-btn" icon="pi pi-check" onClick={this.saveCycle} disabled={!this.state.validForm} />
                    </div>
                     <div className="p-col-1">
                        <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.checkIsDirty}  />
                    </div>
                </div>
                </>
                }

                {/* Dialog component to show messages and get input */}
                <div className="p-grid" data-testid="confirm_dialog">
                    <Dialog header={this.state.dialog.header} visible={this.state.dialogVisible} style={{width: '25vw'}} inputId="confirm_dialog"
                            modal={true}  onHide={() => {this.setState({dialogVisible: false})}} 
                            footer={<div>
                                <Button key="back" onClick={() => {this.setState({dialogVisible: false}); this.cancelCreate();}} label="No" />
                                <Button key="submit" type="primary" onClick={this.reset} label="Yes" />
                                </div>
                            } >
                            <div className="p-grid">
                                <div className="col-lg-2 col-md-2 col-sm-2">
                                    <i className="pi pi-check-circle pi-large pi-success"></i>
                                </div>
                                <div className="col-lg-10 col-md-10 col-sm-10">
                                    <span style={{marginTop:"5px"}}>{this.state.dialog.detail}</span>
                                </div>
                            </div>
                    </Dialog>

                    <CustomDialog type="confirmation" visible={this.state.showDialog} width="40vw"
                        header={'Add Cycle'} message={'Do you want to leave this page? Your changes may not be saved.'} 
                        content={''} onClose={this.close} onCancel={this.close} onSubmit={this.cancelCreate}>
                    </CustomDialog>
                </div>
                
            </React.Fragment>
        );
    }
}