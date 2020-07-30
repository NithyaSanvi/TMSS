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
            }]
        }
    }
	
	 componentDidMount(){ 
       CycleService.getAllCycle().then(cyclelist =>{
            this.setState({
                cyclelist : cyclelist.data 
            });
        })
    }
	
	render(){
         
		  
       
        let defaultcolumns = [ {"name":"Cycle Code","start":"Start Date","stop": "End Date"}]
        return(
            <>
                {/*
                    * Call View table to show table data, the parameters are,
                    data - Pass API data
                    defaultcolumns - This colum will be populate by default in table with header mentioned
                    showaction - {true/false} -> to show the action column
                    paths - specify the path for navigation - Table will set "id" value for each row in action button
                */}
                {this.state.cyclelist.results &&
                    <ViewTable 
                        data={this.state.cyclelist.results} 
                        defaultcolumns={defaultcolumns} 
                        showaction="false"
                        paths={this.state.paths}
                    />
                 }  
            </>
        )
    }
}

export default CycleList




