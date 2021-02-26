import React, { Component } from 'react'
import 'primeflex/primeflex.css';
// import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import _ from 'lodash';
import moment from 'moment';
import ViewTable from '../../components/ViewTable';
import CycleService from '../../services/cycle.service';
import UnitConversion from '../../utils/unit.converter';
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import UIConstants from '../../utils/ui.constants';

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
                                    start: {
                                        name: "Start Date",
                                        filter: "date"
                                    },
                                    stop: {
                                        name: "End Date",
                                        filter: "date"
                                    },
                                    duration:{
                                        name: "Duration (Days)",
                                        filter: "range"
                                    },
                                    totalProjects:{ 
                                        name:'No.of Projects',
                                        filter:"range"
                                    },
                                    observingTime:{
                                        name: "Lofar Observing Time (Hrs)",
                                        filter:"range"
                                    },
                                    processingTime:{ 
                                        name:"Lofar Processing Time (Hrs)",
                                        filter:"range"
                                    },
                                    ltaResources: {
                                        name:"Lofar LTA Resources(TB)",
                                        filter:"range"
                                    },
                                    support:{
                                        name:"Lofar Support (Hrs)",
                                        filter:"range"
                                    },
                                    longterm : {
                                        name:"Long Term Projects",
                                        filter:"range"
                                    }} ];
        this.optionalcolumns = [{   regularProjects:{                              
                                        name: "No.of Regular Projects",
                                        filter:"range"
                                    },   
                                    observingTimeDDT:{
                                        name: "Lofar Observing Time Commissioning (Hrs)",
                                        filter:"range"
                                    },
                                    observingTimePrioA:{
                                        name:"Lofar Observing Time Prio A (Hrs)",
                                        filter:"range"
                                    },
                                    observingTimePrioB:{
                                        name:"Lofar Observing Time Prio B (Hrs)",
                                        filter:"range"
                                    },
                                    actionpath: "actionpath" }];

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
                                     
        this.defaultSortColumn = [{id: "Cycle Code", desc: false}];                          
    }
    getUnitConvertedQuotaValue(cycle, cycleQuota, resourceName) {
        const quota = _.find(cycleQuota, {'cycle_id': cycle.name, 'resource_type_id': resourceName});
        const unitQuantity = this.state.resources.find(i => i.name === resourceName).quantity_value;
        return UnitConversion.getUIResourceUnit(unitQuantity, quota?quota.value:0);
    }
    getCycles(cycles = [], cycleQuota) {
        const promises = [];
        cycles.map(cycle => promises.push(CycleService.getProjectsByCycle(cycle.name)));
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
                cycle.start = moment(cycle['start'], moment.ISO_8601).format(UIConstants.CALENDAR_DEFAULTDATE_FORMAT);
                cycle.stop = moment(cycle['stop'], moment.ISO_8601).format(UIConstants.CALENDAR_DEFAULTDATE_FORMAT);
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
           { /*<div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Cycle - List </h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: '/cycle/create'}} title="Add New Cycle" style={{float: "right"}}>
                            <i className="fa fa-plus-square" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                </div> */}
                {/*
                    * Call View table to show table data, the parameters are,
                    data - Pass API data
                    defaultcolumns - This colum will be populate by default in table with header mentioned
                    showaction - {true/false} -> to show the action column
                    paths - specify the path for navigation - Table will set "id" value for each row in action button
                */}
                <PageHeader location={this.props.location} title={'Cycle - List'} actions={[{icon:'fa-plus-square',title:'Click to Add Cycle', props:{ pathname: '/cycle/create'}}]}/>
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
                        defaultSortColumn= {this.defaultSortColumn}
                        showaction="true"
                        paths={this.state.paths}
                        tablename="cycle_list"
                 />  : <></>
                 } 
                

                
            </>
        )
    }
}

export default CycleList

