import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
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
                "View": "/cycle",
            }],
            projectCategory: ['regular', 'user_shared_support'],
            periodCategory: ['long_term'],
            defaultcolumns : [
                {
                    id:"Cycle Code",
                    start:"Start Date",
                    stop: "End Date",
                    duration: "Duration",
                    totalProjects: 'No.of Projects',
                    observingTime: 'Lofar Observing Time (hr)',
                    processingTime: 'Lofar Processing Time (hr)',
                    ltaResources: 'Lofar LTA Resources(TB)',
                    support: 'Lofar Support (hr)',
                    longterm : 'LongTerm'
                     
                }
            ],
            optionalcolumns : [{
                regularProjects: 'No.of Regular',
                observingTimeDDT: 'Lofar Observing Time Commissioning (hr)',
                observingTimePrioA: 'Lofar Observing Time Prio A (hr)',
                observingTimePrioB: 'Lofar Observing Time Prio B (hr)'

            }],

            columnclassname: [{
                "Cycle Code":"filter-input-50",
                "Duration" : "filter-input-55",
                "No.of Projects" : "filter-input-55",
                "Lofar Observing Time (hr)" : "filter-input-70",
                "Lofar Processing Time (hr)" : "filter-input-70",
                "Lofar LTA Resources(TB)" : "filter-input-70",
                "Lofar Support (hr)" : "filter-input-50",
                "LongTerm" : "filter-input-50",
                "No.of Regular" : "filter-input-50",
                "Lofar Observing Time Commissioning (hr)" : "filter-input-50",
                "Lofar Observing Time Prio A (hr)" : "filter-input-50",
                "Lofar Observing Time Prio B (hr)" : "filter-input-50"
            }],
            isprocessed: false,
            isLoading: true
        }
    }

    conversion(d,type) {
        const coversionType = this.state.resources.find(i => i.name === type).quantity_value;
        return UnitConversion.getUIResourceUnit(coversionType,d)
    }

        componentDidMount(){ 
        const { projectCategory} = this.state;
        const { periodCategory} = this.state;

        const promises = [CycleService.getCycleQuota(), CycleService.getResources()]
        Promise.all(promises).then(responses => {
            const cycleQuota = responses[0];
            this.setState({ resources: responses[1].data.results });
            CycleService.getAllCycles().then(cyclelist => {
                const results = cyclelist || [];
                results.map(async (cycle) => {
                    const projects = await CycleService.getCycleById(cycle.name);
                    const regularProjects = projects.filter(project => projectCategory.includes(project.project_category_value));
                    const longterm = projects.data.results.filter(project => periodCategory.includes(project.period_category_value));
                    cycle.duration = cycle.duration / (1000 * 3600 * 24);
                    cycle.totalProjects = cycle.projects ? cycle.projects.length : 0;
                    cycle.id = cycle.name ? cycle.name.split(' ').join('') : cycle.name;
                    cycle.regularProjects = regularProjects.length;
                    cycle.longterm = longterm.length;
                    cycle.observingTime = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time') || {value: 0}).value, 'observing_time')
                    cycle.processingTime = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'cep_processing_time') || {value: 0}).value, 'cep_processing_time')
                    cycle.ltaResources = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'lta_storage') || {value: 0}).value, 'lta_storage')
                    cycle.support = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'support_time') || {value: 0}).value, 'support_time')
                    cycle.observingTimeDDT = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time_commissioning') || {value: 0}).value, 'observing_time_commissioning')
                    cycle.observingTimePrioA = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time_prio_a') || {value: 0}).value, 'observing_time_prio_a')
                    cycle.observingTimePrioB = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time_prio_b') || {value: 0}).value, 'observing_time_prio_b')
                    cycle.actionpath = "/cycle";
                    return cycle;
                });
                this.setState({
                    cyclelist : results,
                    isprocessed: true,
                    isLoading: false
                });
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
                        <Link to={{ pathname: '/cycle'}} title="Add New Cycle" style={{float: "right"}}>
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
                 
                {this.state.isLoading? <AppLoader /> : this.state.isprocessed &&(this.state.cyclelist && this.state.cyclelist.length) ?
                
                    <ViewTable 
                        data={this.state.cyclelist} 
                        defaultcolumns={this.state.defaultcolumns} 
                        optionalcolumns={this.state.optionalcolumns}
                        columnclassname = {this.state.columnclassname}
                        showaction="true"
                        paths={this.state.paths}
                 />  : <></>
                 } 
                

                
            </>
        )
    }
}

export default CycleList
