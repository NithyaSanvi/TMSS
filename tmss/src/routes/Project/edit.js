import React, {Component} from 'react';
import { Redirect } from 'react-router-dom';
import _ from 'lodash';

import {InputText} from 'primereact/inputtext';
import {InputNumber} from 'primereact/inputnumber';
import {InputTextarea} from 'primereact/inputtextarea';
import {Checkbox} from 'primereact/checkbox';
import {Dropdown} from 'primereact/dropdown';
import {MultiSelect} from 'primereact/multiselect';
import { Button } from 'primereact/button';
import {Dialog} from 'primereact/components/dialog/Dialog';
//import {Growl} from 'primereact/components/growl/Growl';

import {ResourceInputList} from './ResourceInputList';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import CycleService from '../../services/cycle.service';
import ProjectService from '../../services/project.service';
import UnitConverter from '../../utils/unit.converter';
import UIConstants from '../../utils/ui.constants';

export class ProjectEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            dialog: { header: '', detail: ''},
            project: {
                trigger_priority: 1000,
                priority_rank: null,
                quota: []                   // Mandatory Field in the back end
            },
            projectQuota: {},                       // Holds the value of resources selected with resource_type_id as key
            validFields: {},                        // Holds the list of valid fields based on the form rules
            validForm: false,                       // To enable Save Button
            errors: {},
            periodCategories: [],
            projectCategories: [],
            resources: [],                          // Selected resources for the project
            resourceList: [],                       // Available resources to select for the project
            cycles: [],
            redirect: this.props.match.params.id?"":'/project/list'     //If no project name passed redirect to Project list page
        }
        this.projectQuota = []                      // Holds the old list of project_quota saved for the project
        // Validation Rules
        this.formRules = {
            name: {required: true, message: "Name can not be empty"},
            description: {required: true, message: "Description can not be empty"},
            priority_rank: {required: true, message: "Enter Project Rank"}
        };
        this.defaultResources = [{name:'LOFAR Observing Time'}, 
                                    {name:'LOFAR Observing Time prio A'}, 
                                    {name:'LOFAR Observing Time prio B'},
                                    {name:'LOFAR Processing Time'},
                                    {name:'Allocation storage'},
                                    {name:'Number of triggers'},
                                    {name:'LOFAR Support hours'} ];
        this.projectResourceDefaults = {};
        this.resourceUnitMap = UnitConverter.resourceUnitMap;
        this.tooltipOptions = UIConstants.tooltipOptions;

        this.getProjectDetails = this.getProjectDetails.bind(this);
        this.cycleOptionTemplate = this.cycleOptionTemplate.bind(this);
        this.setProjectQuotaDefaults = this.setProjectQuotaDefaults.bind(this);
        this.setProjectParams = this.setProjectParams.bind(this);
        this.addNewResource = this.addNewResource.bind(this);
        this.removeResource = this.removeResource.bind(this);
        this.setProjectQuotaParams = this.setProjectQuotaParams.bind(this);
        this.saveProject = this.saveProject.bind(this);
        this.saveProjectQuota = this.saveProjectQuota.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);
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
                this.setState({resourceList: resourceList});
            })
            .then((resourceList, resources) => {
                this.getProjectDetails();
            });
    }

    /**
     * Function retrieve project details and resource allocations(project_quota) and assign to appropriate varaibles
     */
    async getProjectDetails() {
        let project = await ProjectService.getProjectDetails(this.props.match.params.id);
        let resourceList = this.state.resourceList;
        let projectQuota = {};
        if (project) {
            // Get project_quota for the project and asssign to the component variable
            for (const id of project.quota_ids) {
                let quota = await ProjectService.getProjectQuota(id);
                let resource = _.find(resourceList, ['name', quota.resource_type_id]);
                quota.resource = resource;
                this.projectQuota.push(quota);
                const conversionFactor = this.resourceUnitMap[resource.quantity_value]?this.resourceUnitMap[resource.quantity_value].conversionFactor:1;
                projectQuota[quota.resource_type_id] = quota.value / conversionFactor;
            };
            // Remove the already assigned resources from the resoureList
            const resources = _.remove(resourceList, (resource) => { return _.find(this.projectQuota, {'resource_type_id': resource.name})!=null });
            this.setState({project: project, resourceList: resourceList, resources: resources, 
                            projectQuota: projectQuota, isLoading: false});

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
            let resources = this.state.resources?this.state.resources:[];
            resources.push(newResource[0]);
            console.log(resources);
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
        
        if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
            validForm = true;
        }
        this.setState({errors: errors, validFields: validFields, validForm: validForm});
        return validForm;
    }
    
    /**
     * Function to call when 'Save' button is clicked to update the project.
     */
    saveProject() {
        if (this.validateForm) {
            ProjectService.updateProject(this.props.match.params.id, this.state.project)
                .then(async (project) => { 
                    if (project && this.state.project.updated_at !== project.updated_at) {
                        this.saveProjectQuota(project);
                    }   else {
                        this.growl.show({severity: 'error', summary: 'Error Occured', detail: 'Unable to update Project'});
                        this.setState({errors: project});
                    }
                });
        }
    }

    /**
     * Function to Create, Update & Delete project_quota for the project
     */
    async saveProjectQuota(project) {
        let dialog = {};
        let quotaError = {};
        let updatingProjectQuota = [];
        let newProjectQuota = [];
        let deletingProjectQuota = [];
        for (const resource in this.state.projectQuota) {
            const resourceType = _.find(this.state.resources, {'name': resource});
            const conversionFactor = this.resourceUnitMap[resourceType.quantity_value]?this.resourceUnitMap[resourceType.quantity_value].conversionFactor:1
            let quotaValue = this.state.projectQuota[resource] * conversionFactor;
            let existingQuota = _.find(this.projectQuota, {'resource_type_id': resource});
            if (!existingQuota) {
                let quota = { project: project.url,
                                resource_type: resourceType['url'],
                                value: quotaValue };
                newProjectQuota.push(quota);
            } else if (existingQuota && existingQuota.value !== quotaValue) {
                existingQuota.project = project.url;
                existingQuota.value = quotaValue;
                updatingProjectQuota.push(existingQuota);
            }
        }
        let projectQuota = this.state.projectQuota;
        deletingProjectQuota = _.filter(this.projectQuota, function(quota) { return !projectQuota[quota.resource_type_id]});
        
        for (const projectQuota of deletingProjectQuota) {
            const deletedProjectQuota = await ProjectService.deleteProjectQuota(projectQuota);
            if (!deletedProjectQuota) {
                quotaError[projectQuota.resource_type_id] = true;
            }
        }
        for (const projectQuota of updatingProjectQuota) {
            const updatedProjectQuota = await ProjectService.updateProjectQuota(projectQuota);
            if (!updatedProjectQuota) {
                quotaError[projectQuota.resource_type_id] = true;
            }
        }
        for (const projectQuota of newProjectQuota) {
            const createdProjectQuota = await ProjectService.saveProjectQuota(projectQuota);
            if (!createdProjectQuota) {
                quotaError[projectQuota.resource_type_id] = true;
            }
        }
        if (_.keys(quotaError).length === 0) {
            dialog = {header: 'Success', detail: 'Project updated successfully.'};
        }   else {
            dialog = {header: 'Error', detail: 'Project updated successfully but resource allocation not updated properly. Try again!'};
        }
        this.setState({dialogVisible: true, dialog: dialog});
    }

    /**
     * Cancel edit and redirect to Project View page
     */
    cancelEdit() {
        this.setState({redirect: `/project/view/${this.state.project.name}`});
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        
        return (
            <React.Fragment>
                {/*} <div className="p-grid">
                    <Growl ref={(el) => this.growl = el} />
                
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Project - Edit</h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: `/project/view/${this.state.project.name}`}} title="Close Edit" style={{float: "right"}}>
                            <i className="fa fa-window-close" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                  </div> */}
                 <PageHeader location={this.props.location} title={'Project - Edit'} actions={[{icon:'fa-window-close',title:'Click to Close Project Edit Page', props : { pathname: `/project/view/${this.state.project.name}`}}]}/>

                { this.state.isLoading ? <AppLoader/> :
                <>
                <div>
                    <div className="p-fluid">
                        <div className="p-field p-grid">
                            <label htmlFor="projectName" className="col-lg-2 col-md-2 col-sm-12">Name <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <InputText className={this.state.errors.name ?'input-error':''} id="projectName" data-testid="name"
                                            tooltip="Enter name of the project" tooltipOptions={this.tooltipOptions} maxLength="128"
                                            value={this.state.project.name} 
                                            onChange={(e) => this.setProjectParams('name', e.target.value, 'PROJECT_NAME')}
                                            onBlur={(e) => this.setProjectParams('name', e.target.value, 'PROJECT_NAME')}/>
                                <label className={this.state.errors.name?"error":"info"}>
                                    {this.state.errors.name ? this.state.errors.name : "Max 128 characters"}
                                </label>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="description" className="col-lg-2 col-md-2 col-sm-12">Description <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
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
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <InputNumber inputId="trig_prio" name="trig_prio" className={this.state.errors.name ?'input-error':''} 
                                            tooltip="Priority of this project with respect to triggers" tooltipOptions={this.tooltipOptions}
                                            value={this.state.project.trigger_priority} showButtons 
                                            min={0} max={1001} step={10} useGrouping={false}
                                            onChange={(e) => this.setProjectParams('trigger_priority', e.value)}
                                            onBlur={(e) => this.setProjectParams('trigger_priority', e.target.value, 'NUMBER')} />
                                <label className="error">
                                    {this.state.errors.trigger_priority ? this.state.errors.trigger_priority : ""}
                                </label>
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="trigger" className="col-lg-2 col-md-2 col-sm-12">Allows Trigger Submission</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <Checkbox inputId="trigger" role="trigger" 
                                        tooltip="Is this project allowed to supply observation requests on the fly, possibly interrupting currently running observations (responsive telescope)?" 
                                        tooltipOptions={this.tooltipOptions}
                                        checked={this.state.project.can_trigger} onChange={e => this.setProjectParams('can_trigger', e.target.checked)}></Checkbox>
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="projCategory" className="col-lg-2 col-md-2 col-sm-12">Project Category </label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <Dropdown inputId="projCat" optionLabel="value" optionValue="url" 
                                        tooltip="Project Category" tooltipOptions={this.tooltipOptions}
                                        value={this.state.project.project_category} 
                                        options={this.state.projectCategories} 
                                        onChange={(e) => {this.setProjectParams('project_category', e.value)}} 
                                        placeholder="Select Project Category" />
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="periodCategory" className="col-lg-2 col-md-2 col-sm-12">Period Category</label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
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
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <MultiSelect data-testid="cycle" id="cycle" optionLabel="name" optionValue="url" filter={true}
                                        tooltip="Cycle(s) to which this project belongs" tooltipOptions={this.tooltipOptions}
                                        value={this.state.project.cycles} 
                                        options={this.state.cycles} 
                                        onChange={(e) => {this.setProjectParams('cycles',e.value)}} 
                                        
                                />
                            </div>
                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="projRank" className="col-lg-2 col-md-2 col-sm-12">Project Rank <span style={{color:'red'}}>*</span></label>
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <InputNumber inputId="proj-rank" name="rank" data-testid="rank" value={this.state.project.priority_rank} 
                                        tooltip="Priority of this project with respect to other projects. Projects can interrupt observations of lower-priority projects." 
                                        tooltipOptions={this.tooltipOptions}
                                        mode="decimal" showButtons min={0} max={100}
                                        onChange={(e) => this.setProjectParams('priority_rank', e.value)}
                                        onBlur={(e) => this.setProjectParams('priority_rank', e.target.value, 'NUMBER')} />
                                <label className="error">
                                    {this.state.errors.priority_rank ? this.state.errors.priority_rank : ""}
                                </label>
                            </div>
                        </div>
                        <div className="p-field p-grid">
                            <label htmlFor="ltaStorage" className="col-lg-2 col-md-2 col-sm-12">LTA Storage Location</label>
                                <div className="col-lg-3 col-md-3 col-sm-12" >
                                    <Dropdown inputId="ltaStore" optionValue="url" disabled
                                            tooltip="LTA Storage" tooltipOptions={this.tooltipOptions}
                                            value={this.state.project.archive_location}
                                            options={this.state.ltaStorage}
                                            onChange={(e) => {this.setProjectParams('ltaStorage', e.value)}} 
                                            placeholder="Select LTA Storage" />
                                </div>

                            <div className="col-lg-1 col-md-1 col-sm-12"></div>
                            <label htmlFor="ltastoragepath" className="col-lg-2 col-md-2 col-sm-12">LTA Storage Path </label>
                                <div className="col-lg-3 col-md-3 col-sm-12">
                                    <InputText disabled={!this.state.ltaStorageEnable} className={this.state.errors.archive_subdirectory ?'input-error':''} id="StoragePath" data-testid="name" 
                                                tooltip="Enter storage relative path" tooltipOptions={this.tooltipOptions} maxLength="128"
                                                value={this.state.project.archive_subdirectory} 
                                                onChange={(e) => this.setProjectParams('archive_subdirectory', e.target.value, 'SUB-DIRECTORY')}
                                                onBlur={(e) => this.setProjectParams('archive_subdirectory', e.target.value,'SUB-DIRECTORY')}/>
                                    <label className={this.state.errors.archieve_subdirectory?"error":"info"}>
                                        {this.state.errors.archieve_subdirectory? this.state.archieve_subdirectory : "Max 128 characters"}
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
                                            tooltip="Resources to be allotted for the project" 
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
                                {/* {_.keys(this.state.projectQuota).length>0 && */}
                                    <div className="p-field p-grid resource-input-grid">
                                        <ResourceInputList list={this.state.resources} unitMap={this.resourceUnitMap} 
                                                        projectQuota={this.state.projectQuota} callback={this.setProjectQuotaParams} 
                                                        removeInputCallback={this.removeResource} />
                                    </div>
                                {/* } */}
                            </div>
                        }
                    </div>
                </div>
                <div className="p-grid p-justify-start act-btn-grp">
                    <div className="p-col-1">
                        <Button label="Save" className="p-button-primary" id="save-btn" data-testid="save-btn" icon="pi pi-check" onClick={this.saveProject} disabled={!this.state.validForm} />
                    </div>
                    <div className="p-col-1">
                        <Button label="Cancel" className="p-button-danger" icon="pi pi-times" onClick={this.cancelEdit}  />
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
                </div>
            </React.Fragment>
        );
    }
}