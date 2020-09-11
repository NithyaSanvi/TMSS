import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom'
import moment from 'moment';
import _ from 'lodash';
import ProjectServices from '../../services/project.services';
import { Chips } from 'primereact/chips';
import { TieredMenu } from 'primereact/tieredmenu';
import ResourceDisplayList from './ResourceDisplayList';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import ProjectService from '../../services/project.service';
import UnitConverter from '../../utils/unit.converter';

/**
 * Component to view the details of a project
 */
export class ProjectView extends Component {
    DATE_FORMAT = 'YYYY-MMM-DD HH:mm:ss';
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            project:'',
        };
        if (this.props.match.params.id) {
            this.state.projectId  = this.props.match.params.id;
        }   else if (this.props.location.state && this.props.location.state.id) {
            this.state.projectId = this.props.location.state.id;
        }
        this.state.redirect = this.state.projectId?"":'/project'         // If no project id is passed, redirect to Project list page
        this.resourceUnitMap = UnitConverter.resourceUnitMap;       // Resource unit conversion factor and constraints
        this.optionsMenu = React.createRef();
        this.menuOptions = [ {label:'Add Scheduling Unit', icon: "fa fa-", command: () => {this.selectOptionMenu('Add SU')}} ];
        
        this.showOptionMenu = this.showOptionMenu.bind(this);
        this.selectOptionMenu = this.selectOptionMenu.bind(this);
    }

    componentDidMount() {
        const projectId = this.state.projectId;
        if (projectId) {
            this.getProjectDetails(projectId);
        }   else {
            this.setState({redirect: "/not-found"});
        }
        Promise.all([ProjectServices.getFileSystem(), ProjectServices.getCluster()]).then(response => {
            const options = {};
            response[0].map(i => {
                const cluster =  response[1].filter(j => j.id === i.cluster_id && j.archive_site);
                if (cluster.length) {
                    options[i.url] = `${cluster[0].name} - ${i.name}`
                }
            });
            this.setState({archive_location: response[0], ltaStorage: options, cluster: response[1] });
        });
    }

    /**
     * To get the project details from the backend using the service
     * 
     */
    async getProjectDetails() {
        let project = await ProjectService.getProjectDetails(this.state.projectId);
        let projectQuota = [];
        let resources = [];

        if (project) {
            // If resources are allocated for the project quota fetch the resources master from the API
            if (project.quota) {
                resources = await ProjectService.getResources();
            }

            // For every project quota, get the resource type & assign to the resource variable of the quota object
            for (const id of project.quota_ids) {
                let quota = await ProjectService.getProjectQuota(id);
                let resource = _.find(resources, ['name', quota.resource_type_id]);
                quota.resource = resource;
                projectQuota.push(quota);
            };
            this.setState({project: project, projectQuota: projectQuota, isLoading: false});
        }   else {
            this.setState({redirect: "../../not-found"})
        }
        
    }

    showOptionMenu(event) {
        this.optionsMenu.toggle(event);
    }
    
    selectOptionMenu(menuName) {
        switch(menuName) {
            case 'Add SU': {
                this.setState({redirect: `/project/${this.state.project.name}/schedulingunit/create`});
                break;
            }
            default: {
                break;
            }
        }
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        
        return (
            <React.Fragment>
                { /*}  <div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Project - Details </h2>
                    </div>
                    { this.state.project &&
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: `/project`}} title="Close View" style={{float: "right"}}>
                            <i className="fa fa-times" style={{marginTop: "10px", marginLeft: "5px"}}></i>
                        </Link>
                        <Link to={{ pathname: `/project/edit/${this.state.project.name}`, state: {id: this.state.project?this.state.project.name:''}}} title="Edit Project" 
                                 style={{float: "right"}}>
                            <i className="fa fa-edit" style={{marginTop: "10px", marginLeft: "5px"}}></i>
                        </Link>
                        <TieredMenu model={this.menuOptions} popup ref={el => this.optionsMenu = el} />
                        <button className="p-link" style={{float: "right"}}>
                            <i className="fa fa-bars" label="Toggle Columns" style={{marginTop: "10px", marginLeft: "5px"}} 
                                onMouseOver={(e) => this.optionsMenu.toggle(e)} />
                        </button>
                        
                    </div>
                    }
                </div> */}
                <TieredMenu model={this.menuOptions} popup ref={el => this.optionsMenu = el} />
                <PageHeader location={this.props.location} title={'Project - View'} 
                            actions={[  {icon:'fa-bars',title: '', type:'button',
                                         actOn:'mouseOver', props : { callback: this.showOptionMenu}},
                                        {icon: 'fa-edit',title:'Click to Edit Project', type:'link',
                                         props : { pathname: `/project/edit/${this.state.project.name}`, 
                                                   state: {id: this.state.project?this.state.project.name:''&& this.state.project}}},
                                        {icon:'fa-window-close',title: 'Click to Close Project View', type:'link',
                                         props : { pathname: `/project`}},
                                        ]}/>
                { this.state.isLoading && <AppLoader /> }
                { this.state.project &&
                    <React.Fragment>
                        <div className="main-content">
                            <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Name</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.project.name}</span>
                                <label className="col-lg-2 col-md-2 col-sm-12">Description</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.project.description}</span>
                            </div>
                            <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Created At</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{moment.utc(this.state.project.created_at).format(this.DATE_FORMAT)}</span>
                                <label className="col-lg-2 col-md-2 col-sm-12">Updated At</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{moment.utc(this.state.project.updated_at).format(this.DATE_FORMAT)}</span>
                            </div>
                            <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Trigger Priority</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.project.trigger_priority}</span>
                                <label className="col-lg-2 col-md-2 col-sm-12">Allows Trigger Submission</label>
                                <span className="col-lg-4 col-md-4 col-sm-12"><i className={this.state.project.can_trigger?'fa fa-check-circle':'fa fa-times-circle'}></i></span>
                            </div>
                            <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Project Category</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.project.project_category_value}</span>
                                <label className="col-lg-2 col-md-2 col-sm-12">Period Category</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.project.period_category_value}</span>
                            </div>
                            <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Cycles</label>
                                <Chips className="col-lg-4 col-md-4 col-sm-12 chips-readonly" disabled value={this.state.project.cycles_ids}></Chips>
                                <label className="col-lg-2 col-md-2 col-sm-12">Project Rank</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.project.priority_rank}</span>
                            </div>
                            <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Archieve Location</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.ltaStorage[this.state.project.archive_location]}</span>
                                <label className="col-lg-2 col-md-2 col-sm-12">Archieve SubDirectory</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.project.archive_subdirectory	}</span>
                            </div>
                            <div className="p-fluid">
                                <div className="p-field p-grid">
                                    <div className="col-lg-3 col-md-3 col-sm-12">
                                        <h5 data-testid="resource_alloc">Resource Allocations</h5>
                                    </div>
                                </div>
                            </div>
                            {this.state.projectQuota.length===0 && 
                                <div className="p-field p-grid">
                                    <div className="col-lg-12 col-md-12 col-sm-12">
                                        <span>Reosurces not yet allocated. 
                                            <Link to={{ pathname: `/project/edit/${this.state.project.name}`, state: {id: this.state.project?this.state.project.name:''}}} title="Edit Project" > Click</Link> to add.
                                        </span>
                                    </div>
                                </div>
                            }
                            <div className="p-field p-grid resource-input-grid">
                                <ResourceDisplayList projectQuota={this.state.projectQuota}  unitMap={this.resourceUnitMap} />
                            </div>
                        </div>
                    </React.Fragment>
                }
            </React.Fragment>
        );
    }
}