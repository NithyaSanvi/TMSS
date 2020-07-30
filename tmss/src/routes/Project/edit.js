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

import CycleService from '../../services/cycle.service';
import ProjectService from '../../services/project.service';
import UnitConverter from '../../utils/unit.converter';

export class ProjectEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dialog: { header: '', detail: ''},
            project: {
                trigger_priority: 1000,
                priority_rank: null,
                project_quota: []                   // Mandatory Field in the back end
            },
            projectQuota: {},
            validFields: {},
            validForm: false,
            errors: {},
            periodCategories: [],
            projectCategories: [],
            resources: [],
            resourceList: [],
            cycles: []
        }
        this.updateEnabled = true;
        this.formRules = {
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
            priority_rank: {required: true, message: "Enter Project Rank"}
        };
        this.defaultResourcesEnabled = true;        // This property and functionality to be concluded based on PO input
        this.defaultResources = [{name:'LOFAR Observing Time'}, 
                                    {name:'LOFAR Observing Time prio A'}, 
                                    {name:'LOFAR Observing Time prio B'},
                                    {name:'LOFAR Processing Time'},
                                    {name:'Allocation storage'},
                                    {name:'Number of triggers'},
                                    {name:'LOFAR Support hours'} ];
        this.projectResourceDefaults = {};
        this.resourceUnitMap = UnitConverter.resourceUnitMap;
        this.cycleOptionTemplate = this.cycleOptionTemplate.bind(this);
        this.setProjectQuotaDefaults = this.setProjectQuotaDefaults.bind(this);
        this.setProjectParams = this.setProjectParams.bind(this);
        this.setUpdateEnabled = this.setUpdateEnabled.bind(this);
        this.addNewResource = this.addNewResource.bind(this);
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
                const resources = _.remove(resourceList, function(resource) { return _.find(defaultResources, {'name': resource.name})!=null });
                // Object.assign(resources, this.defaultResources);
                console.log(resources);
                const projectQuota = this.setProjectQuotaDefaults(resources);
                this.setState({resourceList: resourceList, resources: resources, projectQuota: projectQuota});
            });
        
    }

    cycleOptionTemplate(option) {
        return (
            <div className="p-clearfix">
                <span style={{fontSize:'1em',float:'right',margin:'1em .5em 0 0'}}>{option.name}</span>
            </div>
        );
    }

    setProjectQuotaDefaults(resources) {
        let projectQuota = this.state.projectQuota;
        for (const resource of resources) {
            console.log(resource['name']);
            projectQuota[resource['name']] = this.projectResourceDefaults[resource.name]/this.resourceUnitMap[resource.resourceUnit.name].conversionFactor;
        }
        return projectQuota;
    }

    addNewResource(){
        if (this.state.newResource) {
            console.log(this.state.newResource);
            let resourceList = this.state.resourceList;
            const newResource = _.remove(resourceList, {'name': this.state.newResource});
            console.log(newResource);
            let resources = this.state.resources;
            resources.push(newResource[0]);
            this.setState({resources: resources, resourceList: resourceList, newResource: null});
        }
    }

    setProjectParams(key, value) {
        let project = this.state.project;
        project[key] = value;
        console.log(`${key} - ${value}`);
        this.setState({project: project, validForm: this.validateForm(key)});
    }

    setUpdateEnabled(enable) {
        this.updateEnabled = enable;
    }

    setProjectQuotaParams(key, event) {
        console.log(key);
        console.log(event.target)
        console.log(event.target.value);
        if (event.target.value) {
            let projectQuota = this.state.projectQuota;
            let resource = _.find(this.state.resources, {'name': key});
            const resourceUnit = resource?resource.resourceUnit:null;
            console.log(resourceUnit);
            if (resourceUnit) {
                projectQuota[key] = event.target.value.replace(this.resourceUnitMap[resourceUnit.name].display,'');
            }   else {
                projectQuota[key] = event.target.value;
            }
            console.log(`${key} - ${event.target.value}`);
            this.setState({projectQuota: projectQuota});
        }
    }

    /**
     * Function to validate the form excluding the JSON Editor values
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
        console.log(errors);
        this.setState({errors: errors, validFields: validFields});
        if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
            validForm = true;
        }
        return validForm;
    }
    
    saveProject() {
        if (this.validateForm) {
            console.log(this.state.project);
            console.log(this.state.projectQuota);
            let projectQuota = [];
            for (const resource in this.state.projectQuota) {
                let resourceType = _.find(this.state.resources, {'name': resource});
                let quota = { project: this.state.project.name,
                                resource_type: resourceType['url'],
                                value: this.state.projectQuota[resource] * this.resourceUnitMap[resourceType.resourceUnit.name].conversionFactor};
                projectQuota.push(quota);
            }
            console.log(projectQuota);
            ProjectService.saveProject(this.state.project, this.defaultResourcesEnabled?projectQuota:[])
                .then(project => {
                    if (project.url) {
                        let dialog = {};
                        if (this.defaultResourcesEnabled) {
                            dialog = {header: 'Success', detail: 'Project saved successfully. Do you want to create another project?'};
                        }   else {
                            dialog = {header: 'Success', detail: 'Project saved successfully with default Resource allocations. Do you want to view and edit them?'};
                        }
                        this.setState({dialogVisible: true, dialog: dialog})
                    }   else {
                        console.log(this.growl);
                        console.log(project);
                        this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to save Project'});
                        this.setState({errors: project});
                    }
                });
        }
    }

    cancelCreate() {}

    reset() {
        let resources = this.state.resources;
        let resourceList = [];
        const defaultResources = this.defaultResources;
        if (resources) {
            const nonDefaultResources = _.remove(resources, function(resource) { return _.find(defaultResources, {'name': resource.name})==null });
            resourceList = nonDefaultResources.concat(this.state.resourceList);
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
    }

    shouldComponentUpdate() {
        return this.updateEnabled;
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        
        
        console.log(this.defaultResources);
        console.log(this.state.resourceList);
        console.log(this.state.resources);

        return (
            <React.Fragment>
                <div className="p-grid">
                    <Dialog header={this.state.dialog.header} visible={this.state.dialogVisible} style={{width: '50vw'}} 
                            modal={true}  onHide={() => {this.setState({dialogVisible: false})}} 
                            footer={<div>
                                <Button key="back" onClick={() => {this.setState({dialogVisible: false})}} label="No" />
                                <Button key="submit" type="primary" onClick={this.reset} label="Yes" />
                                </div>
                            } >
                            <div className="p-grid">
                                <div className="col-lg-1 col-md-1 col-sm-2">
                                    <i className="pi pi-check-circle pi-large pi-success"></i>
                                </div>
                                <div className="col-lg-10 col-md-10 col-sm-10">
                                    {this.state.dialog.detail}
                                </div>
                            </div>
                    </Dialog>
                </div>
                <div className="p-grid">
                    <Growl ref={(el) => this.growl = el} />
                
                    <div className="p-col-10 p-lg-3 p-md-4">
                        <h2>Project - Edit</h2>
                    </div>
                    <div className="p-col-2 p-lg-3 p-md-4">
                        <Link to={{ pathname: '/project'}} tooltip="Close Edit" >
                            <i className="fa fa-window-close" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                </div>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="projectName" className="col-lg-2 col-md-2 col-sm-12">Name <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <InputText className={this.state.errors.name ?'input-error':''} id="projectName" type="text" 
                                            value={this.state.project.name} 
                                            onChange={(e) => this.setProjectParams('name', e.target.value)}
                                            onBlur={(e) => this.setProjectParams('name', e.target.value)}/>
                                <label className="error">
                                    {this.state.errors.name ? this.state.errors.name : ""}
                                </label>
                            </div>
                            <label htmlFor="description" className="col-lg-2 col-md-2 col-sm-12">Description <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <InputTextarea className={this.state.errors.description ?'input-error':''} rows={3} cols={30} 
                                            value={this.state.project.description} 
                                            onChange={(e) => this.setProjectParams('description', e.target.value)}
                                            onBlur={(e) => this.setProjectParams('description', e.target.value)}/>
                                <label className="error">
                                    {this.state.errors.description ? this.state.errors.description : ""}
                                </label>
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="triggerPriority" className="col-lg-2 col-md-2 col-sm-12">Trigger Priority </label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <InputNumber className={this.state.errors.name ?'input-error':''} id="triggerPriority"  
                                            value={this.state.project.trigger_priority} showButtons step={10}
                                            onChange={(e) => this.setProjectParams('trigger_priority', e.target.value)}/>
                                <label className="error">
                                    {this.state.errors.trigger_priority ? this.state.errors.trigger_priority : ""}
                                </label>
                            </div>
                            <label htmlFor="trigger" className="col-lg-2 col-md-2 col-sm-12">Allows Trigger Submission</label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <Checkbox checked={this.state.project.can_trigger} onChange={e => this.setProjectParams('can_trigger', e.target.checked)}></Checkbox>
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="projCategory" className="col-lg-2 col-md-2 col-sm-12">Project Category </label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <Dropdown optionLabel="name" optionValue="id" 
                                        value={this.state.project.project_category} 
                                        options={this.state.projectCategories} 
                                        onChange={(e) => {this.setProjectParams('project_category', e.value)}} 
                                        placeholder="Select Project Category" />
                            </div>
                            <label htmlFor="periodCategory" className="col-lg-2 col-md-2 col-sm-12">Period Category</label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <Dropdown optionLabel="name" optionValue="id" 
                                        value={this.state.project.period_category} 
                                        options={this.state.periodCategories} 
                                        onChange={(e) => {this.setProjectParams('period_category',e.value)}} 
                                        placeholder="Select Period Category" />
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="triggerPriority" className="col-lg-2 col-md-2 col-sm-12">Cycle(s)</label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <MultiSelect optionLabel="name" optionValue="url" filter={true}
                                        value={this.state.project.cycles} 
                                        options={this.state.cycles} 
                                        onChange={(e) => {this.setProjectParams('cycles',e.value)}} 
                                        
                                />
                            </div>
                            <label htmlFor="projRank" className="col-lg-2 col-md-2 col-sm-12">Project Rank <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-4 col-md-4 col-sm-12">
                                <InputNumber id="projRank"  value={this.state.project.priority_rank} mode="decimal" showButtons min={0} max={100}
                                        onChange={(e) => this.setProjectParams('priority_rank', e.value)}
                                        onBlur={(e) => this.setProjectParams('priority_rank', e.target.value)} />
                                <label className="error">
                                    {this.state.errors.priority_rank ? this.state.errors.priority_rank : ""}
                                </label>
                            </div>
                        </div>
                        {this.defaultResourcesEnabled && this.state.resourceList &&
                            <div className="p-fluid">
                                <div className="p-field p-grid">
                                    <div className="col-lg-3 col-md-3 col-sm-112">
                                        <h5>Resource Allocations:</h5>
                                    </div>
                                    <div className="col-lg-3 col-md-3 col-sm-10">
                                        <Dropdown optionLabel="name" optionValue="name" 
                                            value={this.state.newResource} 
                                            options={this.state.resourceList} 
                                            onChange={(e) => {this.setState({'newResource': e.value})}}
                                            placeholder="Add Resources" />
                                    </div>
                                    <div className="col-lg-2 col-md-2 col-sm-2">
                                    <Button label="" className="p-button-primary" icon="pi pi-plus" onClick={this.addNewResource} />
                                    </div>
                                </div>
                                <div className="p-field p-grid resource-input-grid">
                                    <ResourceInputList list={this.state.resources} unitMap={this.resourceUnitMap} 
                                                      projectQuota={this.state.projectQuota} callback={this.setProjectQuotaParams} />
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <div className="p-grid p-justify-start">
                    <div className="p-col-1">
                        <Button label="Save" className="p-button-primary" icon="pi pi-check" onClick={this.saveProject} disabled={!this.state.validForm} />
                    </div>
                    <div className="p-col-1">
                        <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.cancelCreate}  />
                    </div>
                </div>
            </React.Fragment>
        );
    }
}