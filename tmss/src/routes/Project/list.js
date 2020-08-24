import React, {Component} from 'react';
import ProjectService from '../../services/project.service';
import ViewTable from '../../components/ViewTable';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import AppLoader from '../../layout/components/AppLoader';
import AppHeader from '../../layout/components/AppHeader';

export class ProjectList extends Component{
    constructor(props){
        super(props)
        this.state = {
            projectlist: [],
            paths: [{
                "View": "/project/view",
            }],
            defaultcolumns: [ {
                "name":"Name / Project Code",
                "status":"Status" , 
                "project_category_value":"Category of Project",
                "description":"Description"
            }],
            optionalcolumns:  [{
                "priority_rank":"Project Priority", 
                "trigger_priority":"Trigger Priority",
                "period_category_value":"Category of Period",
                "cycles_ids":"Cycles",
                "can_trigger": "Trigger Allowed",
                "LOFAR Observing Time":"Observing time (Hrs)",
                "LOFAR Observing Time prio A":"Observing time prio A (Hrs)",
                "LOFAR Observing Time prio B":"Observing time prio B (Hrs)",
                "CEP Processing Time":"Processing time (Hrs)",
                "LTA Storage":"LTA storage (TB)",
                "Number of triggers":"Number of Triggers",
                "actionpath":"actionpath",
            }],
            columnclassname: [{
                "Observing time (Hrs)":"filter-input-50",
                "Observing time prio A (Hrs)":"filter-input-50",
                "Observing time prio B (Hrs)":"filter-input-50",
                "Processing time (Hrs)":"filter-input-50",
                "LTA storage (TB)":"filter-input-50",
                "Status":"filter-input-50",
                "Trigger Allowed":"filter-input-50",
                "Number of Triggers":"filter-input-50",
                "Project Priority":"filter-input-50",
                "Trigger Priority":"filter-input-50",
                "Category of Period":"filter-input-50",
                "Cycles":"filter-input-100",
            }],
            isprocessed: false,
            isLoading: true
        }
    }

    componentDidMount(){  
        // for Unit test, Table data
        this.unittestDataProvider();
        ProjectService.getProjectList()
        .then(async (projects) => {
             await ProjectService.getUpdatedProjectQuota(projects)
             .then( async projlist => {
                this.setState({
                    projectlist: projlist,
                    isprocessed: true,
                    isLoading: false
                })
            })
        });
    }
   
    render(){
        return(
            <>
                <AppHeader location={this.props.location} actions={[{name: 'fa-plus-square', link: '/project/create' }]}/>
                {this.state.isLoading? <AppLoader /> : this.state.isprocessed &&
                    <ViewTable 
                        data={this.state.projectlist} 
                        defaultcolumns={this.state.defaultcolumns} 
                        optionalcolumns={this.state.optionalcolumns}
                        columnclassname={this.state.columnclassname}
                        showaction="true"
                        paths={this.state.paths}
                        keyaccessor="name"
                        unittest={this.state.unittest}
                        />
                }
            </>
        )
    }

    // Set table data for Unit test
    unittestDataProvider(){
        if(this.props.testdata){
            this.setState({
                projectlist: [{can_trigger: true,
                    created_at: "2020-07-27T01:29:57.348499",
                    cycles: ["http://localhost:3000/api/cycle/Cycle%204/"],
                    cycles_ids: ["Cycle 4"],
                    description: "string",
                    expert: true,
                    filler: true,
                    name: "Lofar-TMSS-Commissioning",
                    observing_time: "155852.10",
                    priority_rank: 10,
                    private_data: true,
                    project_quota:   ["http://localhost:3000/api/project_quota/6/", "http://localhost:3000/api/project_quota/7/"],
                    project_quota_ids:   [6, 7],
                    tags: ["Lofar TMSS Project"],
                    trigger_priority: 20,
                    triggers_allowed: "56",
                    updated_at: "2020-07-27T01:29:57.348522",
                    url: "http://localhost:3000/api/project/Lofar-TMSS-Commissioning/"
                    }],
                    isprocessed: true,
                    unittest: true,
            })
        }
    }
}
 