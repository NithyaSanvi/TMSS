import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import ViewTable from './../../components/ViewTable';
import CycleService from '../../services/cycle.service';
import UnitConversion from '../../utils/unit.converter';

class CycleList extends Component{
	 constructor(props){
        super(props)
        this.state = {
            cyclelist: [],
            paths: [{
                "View": "/cycle",
            }],
            projectCategory: ['regular', 'user_shared_support']
        }
    }

    conversion(d,type) {
        const coversionType = this.state.resources.find(i => i.name === type).quantity_value;
        return UnitConversion.getUIResourceUnit(coversionType,d)
    }
	
	 componentDidMount(){ 
        const { projectCategory } = this.state;
        const promises = [CycleService.getProjects(), CycleService.getCycleQuota(), CycleService.getResources()]
        Promise.all(promises).then(responses => {
            const projects = responses[0];
            const cycleQuota = responses[1];
            this.setState({ resources: responses[2].data.results });
            CycleService.getAllCycle().then(cyclelist =>{
                const results = cyclelist.data.results || [];
                results.map(cycle => {
                    const regularProjects = projects.data.results.filter(project => project.cycles_ids.includes(cycle.name) && projectCategory.includes(project.project_category_value));
                    const timediff = new Date(cycle.stop).getTime() - new Date(cycle.start).getTime();
                    cycle.duration = timediff / (1000 * 3600 * 24);
                    cycle.totalProjects = cycle.projects ? cycle.projects.length : 0;
                    cycle.id = cycle.name ? cycle.name.split(' ').join('') : cycle.name;
                    cycle.regularProjects = regularProjects.length;
                    cycle.observingTime = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time') || {value: 0}).value, 'observing_time')
                    cycle.processingTime = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'cep_processing_time') || {value: 0}).value, 'cep_processing_time')
                    cycle.ltaResources = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'lta_storage') || {value: 0}).value, 'lta_storage')
                    cycle.support = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'support_time') || {value: 0}).value, 'support_time')
                    cycle.observingTimeDDT = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time_commissioning') || {value: 0}).value, 'observing_time_commissioning')
                    cycle.observingTimePrioA = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time_prio_a') || {value: 0}).value, 'observing_time_prio_a')
                    cycle.observingTimePrioB = this.conversion((cycleQuota.data.results.find(quota => quota.cycle_id === cycle.name && quota.resource_type_id === 'observing_time_prio_b') || {value: 0}).value, 'observing_time_prio_b')
                    return cycle;
                });
                this.setState({
                    cyclelist : results
                });
            })
        })  
    }
	
	render(){
        let defaultcolumns = [
            {
                id:"Cycle Code",
                start:"Start Date",
                stop: "End Date",
                duration: "Duration",
                totalProjects: 'No.of Projects',
                regularProjects: 'No.of Regular',
                observingTime: 'Observing Time (hr)',
                processingTime: 'Processing Time (hr)',
                ltaResources: 'LTA Resources (hr)',
                support: 'Support (hr)',
                observingTimeDDT: 'Observing Time Commissioning (hr)',
                observingTimePrioA: 'Observing Time Prio A (hr)',
                observingTimePrioB: 'Observing Time Prio B (hr)'
            }
        ]
        return (
            <>
                {/*
                    * Call View table to show table data, the parameters are,
                    data - Pass API data
                    defaultcolumns - This colum will be populate by default in table with header mentioned
                    showaction - {true/false} -> to show the action column
                    paths - specify the path for navigation - Table will set "id" value for each row in action button
                */}
                {(this.state.cyclelist && this.state.cyclelist.length) ?
                    <ViewTable 
                        data={this.state.cyclelist} 
                        defaultcolumns={defaultcolumns} 
                        showaction="false"
                        paths={this.state.paths}
                        showAllRows
                    /> : <></>
                 }  
            </>
        )
    }
}

export default CycleList
