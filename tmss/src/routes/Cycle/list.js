import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import _ from 'lodash';

import ViewTable from '../../components/ViewTable';
import CycleService from '../../services/cycle.service';
import UnitConversion from '../../utils/unit.converter';
import AppLoader from '../../layout/components/AppLoader';

class CycleList extends Component{
	 constructor(props){
        super(props)
        this.state = {
            cyclelist: [],
            paths: [{
                "View": "/cycle/view",
            }],
            isLoading: true
        }
        this.projectCategory = ['regular', 'user_shared_support'];
        this.periodCategory = ['long_term'];
        this.defaultcolumns = [ {   id:"Cycle Code",
                                    start:"Start Date",
                                    stop: "End Date",
                                    duration: "Duration (Days)",
                                    totalProjects: 'No.of Projects',
                                    observingTime: 'Lofar Observing Time (Hrs)',
                                    processingTime: 'Lofar Processing Time (Hrs)',
                                    ltaResources: 'Lofar LTA Resources(TB)',
                                    support: 'Lofar Support (Hrs)',
                                    longterm : 'Long Term Projects' } ];
        this.optionalcolumns = [{   regularProjects: 'No.of Regular Projects',
                                    observingTimeDDT: 'Lofar Observing Time Commissioning (Hrs)',
                                    observingTimePrioA: 'Lofar Observing Time Prio A (Hrs)',
                                    observingTimePrioB: 'Lofar Observing Time Prio B (Hrs)',
                                    actionpath: "actionpath", }];

        this.columnclassname = [{   "Cycle Code":"filter-input-75",
                                    "Duration (Days)" : "filter-input-50",
                                    "No.of Projects" : "filter-input-50",
                                    "Lofar Observing Time (Hrs)" : "filter-input-75",
                                    "Lofar Processing Time (Hrs)" : "filter-input-75",
                                    "Lofar LTA Resources(TB)" : "filter-input-75",
                                    "Lofar Support (Hrs)" : "filter-input-50",
                                    "Long Term Projects" : "filter-input-50",
                                    "No.of Regular Projects" : "filter-input-50",
                                    "Lofar Observing Time Commissioning (Hrs)" : "filter-input-75",
                                    "Lofar Observing Time Prio A (Hrs)" : "filter-input-75",
                                    "Lofar Observing Time Prio B (Hrs)" : "filter-input-75" }];
    }

    getUnitConvertedQuotaValue(cycle, cycleQuota, resourceName) {
        const quota = _.find(cycleQuota, {'cycle_id': cycle.name, 'resource_type_id': resourceName});
        const unitQuantity = this.state.resources.find(i => i.name === resourceName).quantity_value;
        return UnitConversion.getUIResourceUnit(unitQuantity, quota?quota.value:0);
    }

    getCycles(cycles = [], cycleQuota) {
        const promises = [];
        cycles.map(cycle => promises.push(CycleService.getCycleById(cycle.name)));
        Promise.all(promises).then(responses => {
            const results = cycles;
            results.map(async (cycle, index) => {
                const projects = responses[index];
                const regularProjects = projects.filter(project => this.projectCategory.includes(project.project_category_value));
                const longterm = projects.filter(project => this.periodCategory.includes(project.period_category_value));
                cycle.duration = UnitConversion.getUIResourceUnit('days', cycle.duration);
                cycle.totalProjects = cycle.projects ? cycle.projects.length : 0;
                cycle.id = cycle.name ;
                cycle.regularProjects = regularProjects.length;
                cycle.longterm = longterm.length;
                // cycle.observingTime = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'observing_time');
                // cycle.processingTime = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'cep_processing_time');
                // cycle.ltaResources = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'lta_storage');
                // cycle.support = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'support_time');
                // cycle.observingTimeDDT = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'observing_time_commissioning');
                // cycle.observingTimePrioA = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'observing_time_prio_a');
                // cycle.observingTimePrioB = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'observing_time_prio_b');
                cycle.observingTime = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'LOFAR Observing Time');
                cycle.processingTime = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'CEP Processing Time');
                cycle.ltaResources = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'LTA Storage');
                cycle.support = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'LOFAR Support Time');
                cycle.observingTimeDDT = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'LOFAR Observing Time Commissioning');
                cycle.observingTimePrioA = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'LOFAR Observing Time prio A');
                cycle.observingTimePrioB = this.getUnitConvertedQuotaValue(cycle, cycleQuota, 'LOFAR Observing Time prio B');
                
                cycle['actionpath'] = `/cycle/view/${cycle.id}`;
                return cycle;
            });
            this.setState({
                cyclelist : results,
                isLoading: false
            });
        });
    }

    componentDidMount(){ 
        const promises = [CycleService.getAllCycleQuotas(), CycleService.getResources()]
        Promise.all(promises).then(responses => {
            const cycleQuota = responses[0];
            this.setState({ resources: responses[1] });
            CycleService.getAllCycles().then(cyclelist => {
                this.getCycles(cyclelist, cycleQuota)
            });
        });  
    }
	
	render(){
        return (
            <>
            <div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Cycle - List </h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: '/cycle/create'}} title="Add New Cycle" style={{float: "right"}}>
                            <i className="fa fa-plus-square" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                </div>
                {/*
                    * Call View table to show table data, the parameters are,
                    data - Pass API data
                    defaultcolumns - This colum will be populate by default in table with header mentioned
                    showaction - {true/false} -> to show the action column
                    paths - specify the path for navigation - Table will set "id" value for each row in action button
                */}
                 
                {this.state.isLoading? <AppLoader /> : (this.state.cyclelist && this.state.cyclelist.length) ?
                
                    <ViewTable 
                        data={this.state.cyclelist} 
                        defaultcolumns={this.defaultcolumns} 
                        optionalcolumns={this.optionalcolumns}
                        columnclassname = {this.columnclassname}
                        showaction="true"
                        paths={this.state.paths}
                 />  : <></>
                 } 
                

                
            </>
        )
    }
}

export default CycleList

