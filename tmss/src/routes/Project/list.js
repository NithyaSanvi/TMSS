import React, {Component} from 'react';
import ProjectService from '../../services/project.service';
import ViewTable from '../../components/ViewTable';
import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import CycleService from '../../services/cycle.service';
import UtilService from '../../services/util.service';
/* eslint-disable no-unused-expressions */

export class ProjectList extends Component{
    constructor(props){
        super(props)
        this.state = {
            projectlist: [],
            defaultcolumns: [ {
                name:"Name / Project Code",
                status:{
                    name:"Status",
                    filter:"select"
                },
                project_category_value:{
                    name:"Category of Project",
                    filter:"select"
                },
                description:"Description",
                archive_location_label:{
                    name:"LTA Storage Location",
                    filter:"select"
                },
                archive_subdirectory:"LTA Storage Path",
             }],
            optionalcolumns:  [{
                priority_rank:{
                    name:"Project Priority", 
                    filter:"range"
                },
                trigger_priority:{
                    name:"Trigger Priority",
                    filter:"range"
                },
                period_category_value:{
                    name:"Category of Period",
                    filter:"select"
                },
                cycles_ids:{
                    name:"Cycles",
                    filter:"select"
                },
                can_trigger:{
                    name:"Trigger Allowed",
                    filter:"switch"
                },
                LOFAR_Observing_Time:{
                    name:"Observing time (Hrs)",
                    filter:"range"
                },
                LOFAR_Observing_Time_prio_A:{
                    name:"Observing time prio A (Hrs)",
                    filter:"range"
                },
                LOFAR_Observing_Time_prio_B:{
                    name:"Observing time prio B (Hrs)",
                    filter:"range"
                },
                CEP_Processing_Time:{
                    name:"Processing time (Hrs)",
                    filter:"range"
                },
                LTA_Storage:{
                    name:"LTA storage (TB)",
                    filter:"range"
                },
                Number_of_triggers:{
                    name:"Number of Triggers",
                    filter:"range"
                },
                auto_pin:{
                    name:"Prevent automatic deletion after ingest",
                    filter:"switch"
                },
                actionpath:"actionpath"
               
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
                "LTA Storage Location":"filter-input-100",
                "LTA Storage Path":"filter-input-100"
            }],
            defaultSortColumn: [{id: "Name / Project Code", desc: false}],
            isprocessed: false,
            isLoading: true
        }
        this.getPopulatedProjectList = this.getPopulatedProjectList.bind(this);
        this.toggleBySorting = this.toggleBySorting.bind(this); 
        this.setToggleBySorting = this.setToggleBySorting.bind(this); 
    }

    getPopulatedProjectList(cycleId) {
        Promise.all([ProjectService.getFileSystem(), ProjectService.getCluster()]).then(async(response) => {
            const options = {};
            response[0].map(fileSystem => {
                const cluster =  response[1].filter(clusterObj => { return (clusterObj.id === fileSystem.cluster_id && clusterObj.archive_site);});
                if (cluster.length) {
                    fileSystem.label =`${cluster[0].name} - ${fileSystem.name}`
                    options[fileSystem.url] = fileSystem;
                }
                return fileSystem;
            });
            let projects = [];
            if (cycleId) {
                projects = await CycleService.getProjectsByCycle(cycleId);
            }   else {
                projects = await ProjectService.getProjectList();
            }
            projects = await ProjectService.getUpdatedProjectQuota(projects);
            let list = projects.map(project => {
                project.archive_location_label = (options[project.archive_location] || {}).label;
                return project;
            });
            this.setState({
                projectlist: list,
                isprocessed: true,
                isLoading: false,
                ltaStorage: options
            })
        });
    }

    componentDidMount(){  
        // Show Project for the Cycle, This request will be coming from Cycle View. Otherwise it is consider as normal Project List.
        let cycle = this.props.cycle;
        this.getPopulatedProjectList(cycle);
        this.setToggleBySorting();  
    }
    setToggleBySorting(){ 
        let sortData = UtilService.localStore({type:'get',key:'proSortData'});
        sortData?this.setState({defaultSortColumn:[{...sortData}]}):UtilService.localStore({type:'set',key:'proSortData',value:[...this.defaultSortColumn]});
    }
	toggleBySorting(sortData){  
       UtilService.localStore({type:'set',key:'proSortData',value:sortData});
    }
    render(){
        return(
            <>
               {/*<div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2>Project - List </h2>
                    </div>
                    <div className="p-col-2 p-lg-2 p-md-2">
                        <Link to={{ pathname: '/project/create'}} title="Add New Project" style={{float: "right"}}>
                            <i className="fa fa-plus-square" style={{marginTop: "10px"}}></i>
                        </Link>
                    </div>
                </div> */}
              { (this.props.cycle) ? 
                <>
                </>
                :
                <PageHeader location={this.props.location} title={'Project - List'} 
                actions={[{icon: 'fa-plus-square',title:'Click to Add Project', props:{pathname: '/project/create' }}]}
                />
               }
                {this.state.isLoading? <AppLoader /> : (this.state.isprocessed && this.state.projectlist.length>0) ?
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
                        tablename="project_list"
                        toggleBySorting={(sortData)=> this.toggleBySorting(sortData)}
                    />
                    : <div>No project found </div>
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
