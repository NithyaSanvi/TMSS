import React, {Component} from 'react';
import { Link, Redirect } from 'react-router-dom';
import _ from 'lodash';

import {InputText} from 'primereact/inputtext';
import {InputNumber} from 'primereact/inputnumber';
import {InputTextarea} from 'primereact/inputtextarea';
import {Checkbox} from 'primereact/checkbox';
import {Dropdown} from 'primereact/dropdown';
import {MultiSelect} from 'primereact/multiselect';
import { Button } from 'primereact/button';
import {Dialog} from 'primereact/components/dialog/Dialog';
import {Growl} from 'primereact/components/growl/Growl';

import {ResourceInputList} from './ResourceInputList';

import AppLoader from '../../layout/components/AppLoader';
import CycleService from '../../services/cycle.service';
import ProjectService from '../../services/project.service';
import UnitConverter from '../../utils/unit.converter';

/**
 * Component to create a new Project
 */
export class ProjectCreate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            dialog: { header: '', detail: ''},      
            project: {
                trigger_priority: 1000,
                priority_rank: null,
                quota: [],                          // Mandatory Field in the back end, so an empty array is passed
                can_trigger: false
            },
            projectQuota: {},                       // Resource Allocations
            validFields: {},                        // For Validation
            validForm: false,                       // To enable Save Button
            errors: {},                             // Validation Errors
            periodCategories: [],
            projectCategories: [],
            resources: [],                          // Selected Resources for Allocation
            resourceList: [],                       // Available Resources for Allocation
            cycles: []
        }
        // Validateion Rules
        this.formRules = {
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
            priority_rank: {required: true, message: "Enter Project Rank"}
        };
        this.defaultResourcesEnabled = true;        // This property and functionality to be concluded based on PO input
        this.defaultResources = [{name:'LOFAR Observing Time'}, 
                                    {name:'LOFAR Observing Time prio A'}, 
                                    {name:'LOFAR Observing Time prio B'},
                                    {name:'CEP Processing Time'},
                                    {name:'LTA Storage'},
                                    {name:'Number of triggers'},
                                    {name:'LOFAR Support Time'} ];
        this.projectResourceDefaults = {};          // Default values for default resources
        this.resourceUnitMap = UnitConverter.resourceUnitMap;       // Resource unit conversion factor and constraints
        this.cycleOptionTemplate = this.cycleOptionTemplate.bind(this);         // Template for cycle multiselect
        this.tooltipOptions = {position: 'left', event: 'hover', className:"p-tooltip-custom"};

        this.setProjectQuotaDefaults = this.setProjectQuotaDefaults.bind(this);
        this.setProjectParams = this.setProjectParams.bind(this);
        this.addNewResource = this.addNewResource.bind(this);
        this.removeResource = this.removeResource.bind(this);
        this.setProjectQuotaParams = this.setProjectQuotaParams.bind(this);
        this.saveProject = this.saveProject.bind(this);
        this.cancelCreate = this.cancelCreate.bind(this);
        this.reset = this.reset.bind(this);
    }

    componentDidMount() {
        ProjectService.getDefaultProjectResources()
            .then(defaults => {
                this.projectResourceDefaults = defaults;
            });
        CycleService.getAllCycles()
            .then(cycles => {
                this.setState({cycles: cycles});
            });
        ProjectService.getProjectCategories()
            .then(categories => {
                this.setState({projectCategories: categories});
            });
        ProjectService.getPeriodCategories()
            .then(categories => {
                this.setState({periodCategories: categories});
            });
        ProjectService.getResources()
            .then(resourceList => {
                const defaultResources = this.defaultResources;
                resourceList = _.sortBy(resourceList, "name");
                const resources = _.remove(resourceList, function(resource) { return _.find(defaultResources, {'name': resource.name})!=null });
                const projectQuota = this.setProjectQuotaDefaults(resources);
                this.setState({resourceList: resourceList, resources: resources, projectQuota: projectQuota, isLoading: false});
            });
        // ProjectService.getProjects().then(projects => {
        //     console.log(projects);
        //   });
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
     * Function to set project resource allocation
     * @param {Array} resources 
     */
    setProjectQuotaDefaults(resources) {
        let projectQuota = this.state.projectQuota;
        for (const resource of resources) {
            const conversionFactor = this.resourceUnitMap[resource.quantity_value]?this.resourceUnitMap[resource.quantity_value].conversionFactor:1;
            projectQuota[resource['name']] = this.projectResourceDefaults[resource.name]/conversionFactor;
        }
        return projectQuota;
    }

    /**
     * Function to add new resource to project
     */
    addNewResource(){
        if (this.state.newResource) {
            let resourceList = this.state.resourceList;
            const newResource = _.remove(resourceList, {'name': this.state.newResource});
            let resources = this.state.resources;
            resources.push(newResource[0]);
            this.setState({resources: resources, resourceList: resourceList, newResource: null});
        }
    }

        /**
     * Callback function to be called from ResourceInpulList when a resource is removed from it
     * @param {string} name - resource_type_id
     */
    removeResource(name) {
        let resources = this.state.resources;
        let resourceList = this.state.resourceList;
        let projectQuota = this.state.projectQuota;
        const removedResource = _.remove(resources, (resource) => { return resource.name === name });
        resourceList.push(removedResource[0]);
        resourceList = _.sortBy(resourceList, 'name');
        delete projectQuota[name];
        this.setState({resourceList: resourceList, resources: resources, projectQuota: projectQuota});
    }

    /**
     * Function to call on change and blur events from input components
     * @param {string} key 
     * @param {any} value 
     */
    setProjectParams(key, value, type) {
        let project = this.state.project;
        switch(type) {
            case 'NUMBER': {
                console.log("Parsing Number");
                project[key] = value?parseInt(value):0;
                break;
            }
            default: {
                project[key] = value;
                break;
            }
        }
        this.setState({project: project, validForm: this.validateForm(key)});
    }

    /**
     * Callback Function to call from ResourceInputList on change and blur events
     * @param {string} key 
     * @param {InputEvent} event 
     */
    setProjectQuotaParams(key, event) {
        let projectQuota = this.state.projectQuota;
        if (event.target.value) {
            let resource = _.find(this.state.resources, {'name': key});
            
            let newValue = 0;
            if (this.resourceUnitMap[resource.quantity_value] && 
                event.target.value.toString().indexOf(this.resourceUnitMap[resource.quantity_value].display)>=0) {
                newValue = event.target.value.replace(this.resourceUnitMap[resource.quantity_value].display,'');
            }   else {
                newValue = event.target.value;
            }
            projectQuota[key] = (newValue==="NaN" || isNaN(newValue))?0:newValue;
        }   else {
            let projectQuota = this.state.projectQuota;
            projectQuota[key] = 0;
        }
        this.setState({projectQuota: projectQuota});
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
                const fieldValue = this.state.project[fieldName];
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
                const fieldValue = this.state.project[fieldName];
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
    
    /**
     * Function to call when 'Save' button is clicked to save the project.
     */
    saveProject() {
        if (this.validateForm) {
            let projectQuota = [];
            for (const resource in this.state.projectQuota) {
                let resourceType = _.find(this.state.resources, {'name': resource});
                let quota = { project: this.state.project.name,
                                resource_type: resourceType['url'],
                                value: this.state.projectQuota[resource] * (this.resourceUnitMap[resourceType.quantity_value]?this.resourceUnitMap[resourceType.quantity_value].conversionFactor:1)};
                projectQuota.push(quota);
            }
            ProjectService.saveProject(this.state.project, this.defaultResourcesEnabled?projectQuota:[])
                .then(project => {
                    if (project.url) {
                        let dialog = {};
                        if (this.defaultResourcesEnabled) {
                            dialog = {header: 'Success', detail: 'Project saved successfully. Do you want to create another project?'};
                        }   else {
                            dialog = {header: 'Success', detail: 'Project saved successfully with default Resource allocations. Do you want to view and edit them?'};
                        }
                        this.setState({project:project, dialogVisible: true, dialog: dialog})
                    }   else {
                        this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to save Project'});
                        this.setState({errors: project});
                    }
                });
        }
    }

    /**
     * Function to cancel form creation and navigate to other page/component
     */
    cancelCreate() {
        this.setState({redirect: '/project'});
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
                // const nonDefaultResources = _.remove(resources, function(resource) { return _.find(defaultResources, {'name': resource.name})==null });
                // resourceList = nonDefaultResources.concat(this.state.resourceList);
                const defaultResources = this.defaultResources;
                resourceList = _.sortBy(prevResources.concat(this.state.resourceList), "name");
                resources = _.remove(resourceList, function(resource) { return _.find(defaultResources, {'name': resource.name})!=null });
                // const projectQuota = this.setProjectQuotaDefaults(resources);
                // this.setState({resourceList: resourceList, resources: resources, projectQuota: projectQuota});
            }
            const projectQuota = this.setProjectQuotaDefaults(resources);
            this.setState({
                dialog: { header: '', detail: ''},
                project: {
                    name: '',
                    description: '',
                    trigger_priority: 1000,
                    priority_rank: null,
                    project_quota: []
                },
                projectQuota: projectQuota,
                validFields: {},
                validForm: false,
                errors: {},
                dialogVisible: false,
                resources: resources,
                resourceList: resourceList
            });
        }   else {
            this.setState({redirect: `/project/edit/${this.state.project.name}`})
        }
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        
        return (
            <React.Fragment>
                <div className="p-grid">
                    <Growl ref={(el) => this.growl = el} />
                
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Project - Add</h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: '/project'}} tite="Close Edit" style={{float: "right"}}>
                            <i className="fa fa-window-close" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                </div>
                { this.state.isLoading ? <AppLoader /> :
                <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid" style={{display: 'none'}}>
                            <label htmlFor="projectId" className="col-lg-2 col-md-2 col-sm-12">URL </label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <input id="projectId" data-testid="projectId" value={this.state.project.url} />
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="projectName" className="col-lg-2 col-md-2 col-sm-12">Name <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <InputText className={this.state.errors.name ?'input-error':''} id="projectName" data-testid="name" 
                                            tooltip="Enter name of the project" tooltipOptions={this.tooltipOptions} maxLength="128"
                                            value={this.state.project.name} 
                                            onChange={(e) => this.setProjectParams('name', e.target.value)}
                                            onBlur={(e) => this.setProjectParams('name', e.target.value)}/>
                                <label className={this.state.errors.name?"error":"info"}>
                                    {this.state.errors.name ? this.state.errors.name : "Max 128 characters"}
                                </label>
                            </div>
                            <label htmlFor="description" className="col-lg-2 col-md-2 col-sm-12">Description <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <InputTextarea className={this.state.errors.description ?'input-error':''} rows={3} cols={30} 
                                            tooltip="Short description of the project" tooltipOptions={this.tooltipOptions} maxLength="128"
                                            data-testid="description" value={this.state.project.description} 
                                            onChange={(e) => this.setProjectParams('description', e.target.value)}
                                            onBlur={(e) => this.setProjectParams('description', e.target.value)}/>
                                <label className={this.state.errors.description ?"error":"info"}>
                                    {this.state.errors.description ? this.state.errors.description : "Max 255 characters"}
                                </label>
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="triggerPriority" className="col-lg-2 col-md-2 col-sm-12">Trigger Priority </label>
                            <div className="col-lg-4 col-md-4 col-sm-12" data-testid="trig_prio">
                                <InputNumber inputId="trig_prio" name="trig_prio" value={this.state.project.trigger_priority} 
                                        tooltip="Priority of this project w.r.t. triggers" tooltipOptions={this.tooltipOptions}
                                        mode="decimal" showButtons min={0} max={1001} step={10} useGrouping={false}
                                        onChange={(e) => this.setProjectParams('trigger_priority', e.value)}
                                        onBlur={(e) => this.setProjectParams('trigger_priority', e.target.value, 'NUMBER')} />
                                
                                <label className="error">
                                    {this.state.errors.trigger_priority ? this.state.errors.trigger_priority : ""}
                                </label>
                            </div>
                            <label htmlFor="trigger" className="col-lg-2 col-md-2 col-sm-12">Allows Trigger Submission</label>
                            <div className="col-lg-4 col-md-4 col-sm-12" data-testid="trigger">
                                <Checkbox inputId="trigger" role="trigger" 
                                        tooltip="Is this project allowed to supply observation requests on the fly, possibly interrupting currently running observations (responsive telescope)?" 
                                        tooltipOptions={this.tooltipOptions}
                                        checked={this.state.project.can_trigger} onChange={e => this.setProjectParams('can_trigger', e.target.checked)}></Checkbox>
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="projCat" className="col-lg-2 col-md-2 col-sm-12">Project Category </label>
                            <div className="col-lg-4 col-md-4 col-sm-12" data-testid="projCat" >
                                <Dropdown inputId="projCat" optionLabel="value" optionValue="url" 
                                        tooltip="Project Category" tooltipOptions={this.tooltipOptions}
                                        value={this.state.project.project_category} 
                                        options={this.state.projectCategories} 
                                        onChange={(e) => {this.setProjectParams('project_category', e.value)}} 
                                        placeholder="Select Project Category" />
                            </div>
                            <label htmlFor="periodCategory" className="col-lg-2 col-md-2 col-sm-12">Period Category</label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <Dropdown data-testid="period-cat" id="period-cat" optionLabel="value" optionValue="url" 
                                        tooltip="Period Category" tooltipOptions={this.tooltipOptions}
                                        value={this.state.project.period_category} 
                                        options={this.state.periodCategories} 
                                        onChange={(e) => {this.setProjectParams('period_category',e.value)}} 
                                        placeholder="Select Period Category" />
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="triggerPriority" className="col-lg-2 col-md-2 col-sm-12">Cycle(s)</label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <MultiSelect data-testid="cycle" id="cycle" optionLabel="name" optionValue="url" filter={true}
                                        tooltip="Cycle(s) to which this project belongs" tooltipOptions={this.tooltipOptions}
                                        value={this.state.project.cycles} 
                                        options={this.state.cycles} 
                                        onChange={(e) => {this.setProjectParams('cycles',e.value)}} 
                                        
                                />
                            </div>
                            <label htmlFor="projRank" className="col-lg-2 col-md-2 col-sm-12">Project Rank <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-4 col-md-4 col-sm-12" data-testid="proj-rank" >
                                <InputNumber inputId="proj-rank" name="rank" data-testid="rank" value={this.state.project.priority_rank} 
                                        tooltip="Priority of this project w.r.t. other projects. Projects can interrupt observations of lower-priority projects." 
                                        tooltipOptions={this.tooltipOptions}
                                        mode="decimal" showButtons min={0} max={100}
                                        onChange={(e) => this.setProjectParams('priority_rank', e.value)}
                                        onBlur={(e) => this.setProjectParams('priority_rank', e.target.value, 'NUMBER')} />
                                <label className="error">
                                    {this.state.errors.priority_rank ? this.state.errors.priority_rank : ""}
                                </label>
                            </div>
                        </div>
                        
                        {this.defaultResourcesEnabled && this.state.resourceList &&
                            <div className="p-fluid">
                                <div className="p-field p-grid">
                                    <div className="col-lg-3 col-md-3 col-sm-112">
                                        <h5 data-testid="resource_alloc">Resource Allocations</h5>
                                    </div>
                                    <div className="col-lg-3 col-md-3 col-sm-10">
                                        <Dropdown optionLabel="name" optionValue="name" 
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
                                                      projectQuota={this.state.projectQuota} callback={this.setProjectQuotaParams} 
                                                      removeInputCallback={this.removeResource} />
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <div className="p-grid p-justify-start">
                    <div className="col-lg-1 col-md-2 col-sm-6">
                        <Button label="Save" className="p-button-primary" id="save-btn" data-testid="save-btn" icon="pi pi-check" onClick={this.saveProject} disabled={!this.state.validForm} />
                    </div>
                    <div className="col-lg-1 col-md-2 col-sm-6">
                        <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.cancelCreate}  />
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
                                    {this.state.dialog.detail}
                                </div>
                            </div>
                    </Dialog>
                </div>
                
            </React.Fragment>
        );
    }
}