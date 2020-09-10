import React, {Component} from 'react';
import ProjectService from '../../services/project.service';
import ProjectServices from '../../services/project.services';
import ViewTable from '../../components/ViewTable';
import { Link } from 'react-router-dom/cjs/react-router-dom.min';
import AppLoader from '../../layout/components/AppLoader';

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
                "description":"Description",
                "archive_location_label":"Archieve Location",
                "archive_subdirectory":"Archieve Subdirectory"
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
               " Archieve Location":"filter-input-100",
                "Archieve Subdirectory":"filter-input-100"
            }],
            defaultSortColumn: [{id: "Name / Project Code", desc: false}],
            isprocessed: false,
            isLoading: true
        }
    }

    componentDidMount(){  
        // for Unit test, Table data
        this.unittestDataProvider();
        Promise.all([ProjectServices.getFileSystem(), ProjectServices.getCluster()]).then(response => {
            const options = {};
            response[0].map(i => {
                const cluster =  response[1].filter(j => j.id === i.cluster_id && j.archive_site);
                if (cluster.length) {
                    i.label =`${cluster[0].name} - ${i.name}`
                    options[i.url] = i;
                }
            });
            ProjectService.getProjectList()
            .then(async (projects) => {
                await ProjectService.getUpdatedProjectQuota(projects)
                .then( async projlist => {
                    let list = projlist.map(i => {
                        i.archive_location_label = (options[i.archive_location] || {}).label;
                        return i
                    })
                    this.setState({
                        projectlist: list,
                        isprocessed: true,
                        isLoading: false
                    })
                })
            });
            this.setState({ltaStorage: options });
        });
        
            
    }
   
    render(){
        return(
            <>
                <div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Project - List </h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: '/project/create'}} title="Add New Project" style={{float: "right"}}>
                            <i className="fa fa-plus-square" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                </div>
                {this.state.isLoading? <AppLoader /> : this.state.isprocessed &&
                    <ViewTable 
                        data={this.state.projectlist} 
                        defaultcolumns={this.state.defaultcolumns} 
                        optionalcolumns={this.state.optionalcolumns}
                        columnclassname={this.state.columnclassname}
                        defaultSortColumn={this.state.defaultSortColumn}
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
 