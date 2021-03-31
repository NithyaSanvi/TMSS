import React, {Component} from 'react';
import { Redirect } from 'react-router-dom';
import _ from 'lodash';
import moment from 'moment'

import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/components/dialog/Dialog';
import { Growl } from 'primereact/components/growl/Growl';

import { ResourceInputList } from './ResourceInputList';
import { CustomDialog } from '../../layout/components/CustomDialog';
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import CycleService from '../../services/cycle.service';
import UnitConverter from '../../utils/unit.converter';
import UIConstants from '../../utils/ui.constants';
import { publish } from '../../App';


export class CycleEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showDialog: false,
            isDirty: false,
            isLoading: true,
            dialog: { header: '', detail: ''},
            cycle: {
                projects: [],
                quota: [],                         // Mandatory Field in the back end
            },
            cycleQuota: {},                       // Holds the value of resources selected with resource_type_id as key
            validFields: {},                        // Holds the list of valid fields based on the form rules
            validForm: false,                       // To enable Save Button
            errors: {},
            resources: [],                          // Selected resources for the cycle
            resourceList: [],                       // Available resources to select for the cycle
            redirect: this.props.match.params.id?"":'/cycle/list'     //If no cycle name passed redirect to Cycle list page
        }
        this.cycleQuota = []                      // Holds the old list of cycle_quota saved for the cycle
        // Validation Rules
        this.formRules = {
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
            start: {required: true, message: "Start Date can not be empty"},
            stop: {required: true, message: "Stop Date can not be empty"},
        };
        this.defaultResources = [
            {name:'LOFAR Observing Time'}, 
            {name:'LOFAR Observing Time prio A'}, 
            {name:'LOFAR Observing Time prio B'},
            {name:'LOFAR Processing time '}, 
            {name:'LOFAR LTA resources'}, 
            {name:'LOFAR LTA resources SARA'}, 
            {name:'LOFAR LTA resources Jülich'}, 
            {name:'LOFAR LTA resources Poznan'}, 
            {name:'LOFAR Observing time DDT/Commissioning'}, 
            {name:'LOFAR Support'}];
        this.cycleResourceDefaults = {};
        this.resourceUnitMap = UnitConverter.resourceUnitMap;
        this.tooltipOptions = UIConstants.tooltipOptions;

        this.checkIsDirty = this.checkIsDirty.bind(this);
        this.close = this.close.bind(this);
        this.getCycleDetails = this.getCycleDetails.bind(this);
        this.cycleOptionTemplate = this.cycleOptionTemplate.bind(this);
        this.setCycleQuotaDefaults = this.setCycleQuotaDefaults.bind(this);
        this.setCycleParams = this.setCycleParams.bind(this);
        this.addNewResource = this.addNewResource.bind(this);
        this.removeResource = this.removeResource.bind(this);
        this.setCycleQuotaParams = this.setCycleQuotaParams.bind(this);
        this.saveCycle = this.saveCycle.bind(this);
        this.saveCycleQuota = this.saveCycleQuota.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);
    }

    componentDidMount() {
        CycleService.getCycle(this.props.match.params.id)
        .then(result =>{
            this.setState({
                cycle: result.data,
                isLoading : false, 
            })
        })
        .then(()=>{
            CycleService.getResources()
            .then(resourceList => {
                this.setState({resourceList: resourceList});
            })
            .then((resourceList, resources) => {
                this.getCycleDetails();
            });
        })
    }

    /**
     * Function retrieve cycle details and resource allocations(cycle_quota) and assign to appropriate varaibles
     */
    async getCycleDetails() {
        let cycle = this.state.cycle;
        let resourceList = this.state.resourceList;
        let cycleQuota = {};
        if (cycle) {
            if(cycle.quota_ids){
                 // Get cycle_quota for the cycle and asssign to the component variable
                for (const id of cycle.quota_ids) {
                    let quota = await CycleService.getCycleQuota(id);
                    let resource = _.find(resourceList, ['name', quota.resource_type_id]);
                    quota.resource = resource;
                    this.cycleQuota.push(quota);
                    const conversionFactor = this.resourceUnitMap[resource.quantity_value]?this.resourceUnitMap[resource.quantity_value].conversionFactor:1;
                    cycleQuota[quota.resource_type_id] = quota.value / conversionFactor;
                };
            }
           
            // Remove the already assigned resources from the resoureList
            const resources = _.remove(resourceList, (resource) => { return _.find(this.cycleQuota, {'resource_type_id': resource.name})!=null });
            this.setState({cycle: cycle, resourceList: resourceList, resources: resources, 
                            cycleQuota: cycleQuota, isLoading: false});

            // Validate form if all values are as per the form rules and enable Save button
            this.validateForm();
        }   else {
            this.setState({redirect: '../../not-found'});
        }
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
            const conversionFactor = this.resourceUnitMap[resource.quantity_value]?this.resourceUnitMap[resource.quantity_value].conversionFactor:1;
            cycleQuota[resource['name']] = this.cycleResourceDefaults[resource.name]/conversionFactor;
        }
        return cycleQuota;
    }

    /**
     * Function to add new resource to cycle
     */
    addNewResource(){
        if (this.state.newResource) {
            let resourceList = _.cloneDeep(this.state.resourceList);
            const newResource = _.remove(resourceList, {'name': this.state.newResource});
            let resources = this.state.resources?this.state.resources:[];
            resources.push(newResource[0]);
            if ( !this.state.isDirty && !_.isEqual(this.state.resourceList, resourceList)) {
                this.setState({resources: resources, resourceList: resourceList, newResource: null, isDirty: true}, () => publish('edit-dirty', true));
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
        delete cycleQuota[name];
        if ( !this.state.isDirty && !_.isEqual(this.state.cycleQuota, cycleQuota)) {
            this.setState({resourceList: resourceList, resources: resources, cycleQuota: cycleQuota, isDirty: true}, () => publish('edit-dirty', true));
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
        if ( !this.state.isDirty && !_.isEqual(this.state.cycle, cycle)) {
            await this.setState({cycle: cycle});
            this.setState({validForm: this.validateForm(key), isDirty: true}, () => publish('edit-dirty', true));
        }   else {
            await await this.setState({cycle: cycle});
            this.setState({validForm: this.validateForm(key)});
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
                newValue = _.trim(event.target.value.replace(this.resourceUnitMap[resource.quantity_value].display,''));
            }   else {
                newValue = _.trim(event.target.value);
            }
            cycleQuota[key] = (newValue==="NaN" || isNaN(newValue))?0:Number(newValue);
        }   else {
            let cycleQuota = this.state.cycleQuota;
            cycleQuota[key] = 0;
        }
        if ( !this.state.isDirty && !_.isEqual(this.state.cycleQuota, cycleQuota)) {
            this.setState({cycleQuota: cycleQuota, isDirty: true}, () => publish('edit-dirty', true));
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
        
        if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
            validForm = true;
        }

        if(this.state.cycle['start'] && this.state.cycle['stop']){
            var isSameOrAfter = moment(this.state.cycle['stop']).isSameOrAfter(this.state.cycle['start']);
            if(!isSameOrAfter){
                errors['stop'] = ` Stop date should be after Start date`;
                validForm = false;
            }else{
                validForm = true;
            }
        }

        this.setState({errors: errors, validFields: validFields, validForm: validForm});
        return validForm;
    }
    
    /**
     * Function to call when 'Save' button is clicked to update the cycle.
     */
    saveCycle() {
        if (this.validateForm) {
            let cycle = this.state.cycle;
            let stoptime =  _.replace(this.state.cycle['stop'],'00:00:00', '23:59:59');
            cycle['start'] = moment(cycle['start']).format(UIConstants.UTC_DATE_TIME_FORMAT);
            cycle['stop'] = moment(stoptime).format(UIConstants.UTC_DATE_TIME_FORMAT);
            this.setState({cycle: cycle, isDirty: false}, () => publish('edit-dirty', false));
            CycleService.updateCycle(this.props.match.params.id, this.state.cycle)
                .then(async (cycle) => { 
                    if (cycle && this.state.cycle.updated_at !== cycle.updated_at) {
                        this.saveCycleQuota(cycle);
                    }   else {
                        this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to update Cycle'});
                        this.setState({errors: cycle});
                    }
                });
        }
    }

    /**
     * Function to Create, Update & Delete cycle_quota for the cycle
     */
    async saveCycleQuota(cycle) {
        let dialog = {};
        let quotaError = {};
        let updatingCycleQuota = [];
        let newCycleQuota = [];
        let deletingCycleQuota = [];
        for (const resource in this.state.cycleQuota) {
            const resourceType = _.find(this.state.resources, {'name': resource});
            const conversionFactor = this.resourceUnitMap[resourceType.quantity_value]?this.resourceUnitMap[resourceType.quantity_value].conversionFactor:1
            let quotaValue = this.state.cycleQuota[resource] * conversionFactor;
            let existingQuota = _.find(this.cycleQuota, {'resource_type_id': resource});
            if (!existingQuota) {
                let quota = { cycle: cycle.url,
                                resource_type: resourceType['url'],
                                value: quotaValue };
                newCycleQuota.push(quota);
            } else if (existingQuota && existingQuota.value !== quotaValue) {
                existingQuota.cycle = cycle.url;
                existingQuota.value = quotaValue;
                updatingCycleQuota.push(existingQuota);
            }
        }
        let cycleQuota = this.state.cycleQuota;
        deletingCycleQuota = _.filter(this.cycleQuota, function(quota) { return !cycleQuota[quota.resource_type_id]});
        
        for (const cycleQuota of deletingCycleQuota) {
            const deletedCycleQuota = await CycleService.deleteCycleQuota(cycleQuota);
            if (!deletedCycleQuota) {
                quotaError[cycleQuota.resource_type_id] = true;
            }
        }
        for (const cycleQuota of updatingCycleQuota) {
            const updatedCycleQuota = await CycleService.updateCycleQuota(cycleQuota);
            if (!updatedCycleQuota) {
                quotaError[cycleQuota.resource_type_id] = true;
            }
        }
        for (const cycleQuota of newCycleQuota) {
            const createdCycleQuota = await CycleService.saveCycleQuota(cycleQuota);
            if (!createdCycleQuota) {
                quotaError[cycleQuota.resource_type_id] = true;
            }
        }
        if (_.keys(quotaError).length === 0) {
            dialog = {header: 'Success', detail: 'Cycle updated successfully.'};
        }   else {
            dialog = {header: 'Error', detail: 'Cycle updated successfully but resource allocation not updated properly. Try again!'};
        }
        this.setState({dialogVisible: true, dialog: dialog});
    }

     /**
     * warn before cancel the page if any changes detected 
     */
    checkIsDirty() {
        if( this.state.isDirty ){
            this.setState({showDialog: true});
        } else {
            this.cancelEdit();
        }
    }
    
    close() {
        this.setState({showDialog: false});
    }
    /**
     * Cancel edit and redirect to Cycle View page
     */
    cancelEdit() {
        publish('edit-dirty', false);
        this.props.history.goBack();
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        return (
            <React.Fragment>
                <Growl ref={(el) => this.growl = el} />
                {/*} <div className="p-grid">
                    
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Cycle - Edit</h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: `/cycle/view/${this.state.cycle.name}`}} title="Close Edit" style={{float: "right"}}>
                            <i className="fa fa-window-close" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                </div> */}
                <PageHeader location={this.props.location} title={'Cycle - Edit'} actions={[{icon:'fa-window-close',
                title:'Click to Close Cycle-Edit', type: 'button',  actOn: 'click', props:{ callback: this.checkIsDirty }}]}/>

                { this.state.isLoading ? <AppLoader/> :
                <>
                <div>
                    <div className="p-fluid">
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
                                    d dateFormat={UIConstants.CALENDAR_DATE_FORMAT}
                                    inputId="start"
                                    value= {new Date(this.state.cycle.start)}
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
                                    d dateFormat={UIConstants.CALENDAR_DATE_FORMAT}
                                    value= {new Date(this.state.cycle.stop)}
                                    onChange= {e => this.setCycleParams('stop', e.value)}
                                    inputId="stop"
                                    data-testid="stop"
                                    tooltip="Moment at which the cycle officially ends." tooltipOptions={this.tooltipOptions}
                                    showIcon={true}
                                />
                                <label className={this.state.errors.stop?"error":"info"}>
                                    {this.state.errors.stop ? this.state.errors.stop : ""}
                                </label>
                            </div>
                        </div>

                        {this.state.resourceList &&
                            <div className="p-fluid">
                                <div className="p-field p-grid">
                                    <div className="col-lg-2 col-md-2 col-sm-12">
                                        <h5>Resource Allocations:</h5>
                                    </div>
                                    <div className="col-lg-3 col-md-3 col-sm-10">
                                        <Dropdown optionLabel="name" optionValue="name" 
                                            tooltip="Resources to be allotted for the cycle" 
                                            tooltipOptions={this.tooltipOptions}
                                            value={this.state.newResource} 
                                            options={_.sortBy(this.state.resourceList, ['name'])} 
                                            onChange={(e) => {this.setState({'newResource': e.value})}}
                                            placeholder="Add Resources" />
                                    </div>
                                    <div className="col-lg-2 col-md-2 col-sm-2">
                                    <Button label="" className="p-button-primary" icon="pi pi-plus" onClick={this.addNewResource} disabled={!this.state.newResource} data-testid="add_res_btn" />
                                    </div>
                                </div>
                                 {/* {_.keys(this.state.cycleQuota).length>0 &&  */}
                                    <div className="p-field p-grid resource-input-grid">
                                        <ResourceInputList list={this.state.resources} unitMap={this.resourceUnitMap} 
                                                        cycleQuota={this.state.cycleQuota} callback={this.setCycleQuotaParams} 
                                                        removeInputCallback={this.removeResource} />
                                    </div>
                                 {/* } */}
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
                    <Dialog header={this.state.dialog.header} visible={this.state.dialogVisible} style={{width: '30vw'}} inputId="confirm_dialog"
                            modal={true}  onHide={() => {this.setState({dialogVisible: false})}} 
                            footer={<div>
                                <Button key="back" onClick={() => {this.setState({dialogVisible: false}); this.cancelEdit();}} label="Ok" />
                                {/* <Button key="submit" type="primary" onClick={this.reset} label="Yes" /> */}
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
                        header={'Edit Cycle'} message={'Do you want to leave this page? Your changes may not be saved.'} 
                        content={''} onClose={this.close} onCancel={this.close} onSubmit={this.cancelEdit}>
                    </CustomDialog>

                </div>
            </React.Fragment>
        );
    }
}