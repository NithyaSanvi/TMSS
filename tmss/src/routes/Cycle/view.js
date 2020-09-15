import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom'
import moment from 'moment';
import _ from 'lodash';

// import { Chips } from 'primereact/chips';

import ResourceDisplayList from './ResourceDisplayList';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import CycleService from '../../services/cycle.service';
import UnitConverter from '../../utils/unit.converter';
import {ProjectList} from './../Project/list';

/**
 * Component to view the details of a cycle
 */
export class CycleView extends Component {
    DATE_FORMAT = 'YYYY-MMM-DD HH:mm:ss';
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            cycle:'',
        };
        if (this.props.match.params.id) {
            this.state.cycleId  = this.props.match.params.id;
        }   else if (this.props.location.state && this.props.location.state.id) {
            this.state.cycleId = this.props.location.state.id;
        }
        this.state.redirect = this.state.cycleId?"":'/cycle'         // If no cycle id is passed, redirect to cycle list page
        this.resourceUnitMap = UnitConverter.resourceUnitMap;       // Resource unit conversion factor and constraints
    }

    componentDidMount() {
        const cycleId = this.state.cycleId;
        if (cycleId) {
            this.getCycleDetails();
        }   else {
            this.setState({redirect: "/not-found"});
        }
    }

    /**
     * To get the cycle details from the backend using the service
     * 
     */
    async getCycleDetails() {
        let cycle = await CycleService.getCycleDetails(this.state.cycleId);
        let cycleQuota = [];
        let resources = [];

        if (cycle) {
            // If resources are allocated for the cycle quota fetch the resources master from the API
            if (cycle.quota) {
                resources = await CycleService.getResources();
            }

            // For every cycle quota, get the resource type & assign to the resource variable of the quota object
            for (const id of cycle.quota_ids) {
                let quota = await CycleService.getCycleQuota(id);
                let resource = _.find(resources, ['name', quota.resource_type_id]);
                quota.resource = resource;
                cycleQuota.push(quota);
            };
            this.setState({cycle: cycle, cycleQuota: cycleQuota, isLoading: false});
        }   else {
            this.setState({redirect: "../../not-found"})
        }
        
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        
        return (
            <React.Fragment>
               {/* <div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Cycle - Details </h2>
                    </div>
                    { this.state.cycle &&
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: `/cycle`}} title="Close View" style={{float: "right"}}>
                            <i className="fa fa-times" style={{marginTop: "10px", marginLeft: "5px"}}></i>
                        </Link>
                        <Link to={{ pathname: `/cycle/edit/${this.state.cycle.name}`, state: {id: this.state.cycle?this.state.cycle.name:''}}} title="Edit Cycle" 
                                 style={{float: "right"}}>
                            <i className="fa fa-edit" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                    }
                </div> */ }
                <PageHeader location={this.props.location} title={'Cycle - Details'} 
                            actions={[ {icon:'fa-edit', title:'Click to Edit Cycle', props:{ pathname: `/cycle/edit/${this.state.cycle.name}`, 
                                        state: {id: this.state.cycle?this.state.cycle.name:''}}},
                                        {icon: 'fa-window-close',props:{ pathname: `/cycle`}}]}/>
                { this.state.isLoading && <AppLoader /> }
                { this.state.cycle &&
                    <React.Fragment>
                        <div className="main-content">
                            <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Name</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.cycle.name}</span>
                                <label className="col-lg-2 col-md-2 col-sm-12">Description</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{this.state.cycle.description}</span>
                            </div>
                            <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Created At</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{moment.utc(this.state.cycle.created_at).format(this.DATE_FORMAT)}</span>
                                <label className="col-lg-2 col-md-2 col-sm-12">Updated At</label>
                                <span className="col-lg-4 col-md-4 col-sm-12">{moment.utc(this.state.cycle.updated_at).format(this.DATE_FORMAT)}</span>
                            </div>
                            
                            {/* <div className="p-grid">
                                <label className="col-lg-2 col-md-2 col-sm-12">Projects</label>
                                <Chips className="col-lg-4 col-md-4 col-sm-12 chips-readonly" disabled value={this.state.cycle.projects_ids}></Chips>
                            </div> */}
                            <div className="p-fluid">
                                <div className="p-field p-grid">
                                    <div className="col-lg-3 col-md-3 col-sm-12">
                                        <h5 data-testid="resource_alloc">Resource Allocations</h5>
                                    </div>
                                </div>
                            </div>
                            {this.state.cycleQuota.length===0 && 
                                <div className="p-field p-grid">
                                    <div className="col-lg-12 col-md-12 col-sm-12">
                                        <span>Reosurces not yet allocated. 
                                            <Link to={{ pathname: `/cycle/edit/${this.state.cycle.name}`, state: {id: this.state.cycle?this.state.cycle.name:''}}} title="Edit Cycle" > Click</Link> to add.
                                        </span>
                                    </div>
                                </div>
                            }
                            <div className="p-field p-grid resource-input-grid">
                                <ResourceDisplayList cycleQuota={this.state.cycleQuota}  unitMap={this.resourceUnitMap} />
                            </div>
                            {/* Show Project list for this Cycle */}
                            <div className="p-fluid">
                                <div className="p-field p-grid">
                                    <div className="col-lg-3 col-md-3 col-sm-12">
                                        <h5 data-testid="project-list">Projects</h5>
                                    </div>
                                </div>
                            </div>
                            <ProjectList cycle={this.state.cycle.name}/>
                        </div>
                    </React.Fragment>
                }
            </React.Fragment>
        );
    }
}
