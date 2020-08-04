import React, { Component } from 'react'
import 'primeflex/primeflex.css';
import ViewTable from './../../components/ViewTable';
import CycleService from '../../services/cycle.service';

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
	
	 componentDidMount(){ 
        const { projectCategory } = this.state;
        CycleService.getProjects().then(projects => {
            CycleService.getAllCycle().then(cyclelist =>{
                const results = cyclelist.data.results || [];
                results.map(cycle => {
                    const regularProjects = projects.data.results.filter(project => project.cycles_ids.includes(cycle.name) && projectCategory.includes(project.project_category_value));
                    const timediff = new Date(cycle.stop).getTime() - new Date(cycle.start).getTime();
                    cycle.duration = timediff / (1000 * 3600 * 24);
                    cycle.totalProjects = cycle.projects ? cycle.projects.length : 0;
                    cycle.name = cycle.name ? cycle.name.split(' ').join('') : cycle.name;
                    cycle.regularProjects = regularProjects.length;
                    return cycle;
                });
                this.setState({
                    cyclelist : results
                });
            })
        })  
    }
	
	render(){
        let defaultcolumns = [ {name:"Cycle Code",start:"Start Date",stop: "End Date", duration: "Duration", totalProjects: 'No.of Projects', regularProjects: 'No.of Regular' }]
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




