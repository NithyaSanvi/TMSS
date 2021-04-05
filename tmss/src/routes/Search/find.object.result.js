import React, {Component} from 'react';
import PageHeader from '../../layout/components/PageHeader';
import AppLoader from '../../layout/components/AppLoader';
import { Tree } from 'primereact/tree';
import TaskService  from './../../services/task.service';
import ScheduleService from './../../services/schedule.service';
import ProjectService from './../../services/project.service';

export class FindObjectResult extends Component{
    constructor(props){
        super(props);
        this.state = {
            objNodes: [],
            expandedKeys: {},
            isLoading: true
        };
        this.schedulingSetList= {};
        this.projectsList= {};
        this.data= {};
        this.expandAll = this.expandAll.bind(this);
        this.expandNode = this.expandNode.bind(this);
    }

    
    componentDidUpdate(prevProps, prevState) {
        const objectType = this.props.match.params.type;
        const objectId = this.props.match.params.id;
        const prevObjectType = prevProps.match.params.type;
        const prevObjectId = prevProps.match.params.id;
        if(objectType !== prevObjectType || objectId !== prevObjectId){
            this.findObject();
        }
    }

    componentDidMount(){
        this.findObject();
    }

    /**
     * Find Object based in search id
     */
    async findObject(){
        let objNodes = [];
        this.setState({objNodes: objNodes, isLoading: true});
        const objectType = this.props.match.params.type;//(this.props.location.state && this.props.location.state.objectType)?this.props.location.state.objectType:'';
        const objectid = this.props.match.params.id;
        if (objectType === 'subtask') {
            objNodes = await this.findSubTask(objectid);
        }   
        else if (objectType === 'taskdraft') {
            objNodes = await this.findTask('draft', objectid);
        }   
        else if (objectType === 'taskblueprint') {
            objNodes = await this.findTask('blueprint', objectid);
        }   
        else if (objectType === 'sublueprint') {
            objNodes = await this.findSchedulingUnit('blueprint', objectid);
        }   
        else if (objectType === 'sudraft') {
            objNodes = await this.findSchedulingUnit('draft', objectid);
        }   
        else if (objectType === 'project') {
            objNodes = await this.findProject(objectid);
        }
        this.setState({objNodes: objNodes, isLoading: false});
        this.expandAll();
    }

    /**
     * Find SubTask for given id
     * @param {*} id 
     * @returns 
     */
    async findSubTask(id){
        const subtaskDetails  = await TaskService.getSubtaskDetails(id);
        if (subtaskDetails) {
            let subtask = {};
            subtask['key'] = 'subtask'+subtaskDetails.id;
            subtask['label'] = <> SubTask ({subtaskDetails.id}) 
                                {/*  -- View page not available yet --
                                <span className="find-obj-tree-view"><a href="" target='_blank'>View</a></span> */}
                                <span className="find-obj-tree-view"> <a href={subtaskDetails.url} target='_blank' 
                                title=" View SubTask API"><i className="fa fa-link" /></a></span></>;
            subtask['icon'] = 'fas fa-tasks';
            subtask['children'] = await this.findTask('blueprint', subtaskDetails.task_blueprint_id);
            return [subtask];
        }
        return '';
    }

    /**
     * Find Task details for given id
     * @param {*} taskType 
     * @param {*} id 
     * @returns 
     */
    async findTask(taskType, id){
        const taskDetails  = await TaskService.getTask(taskType, id);
        if (taskDetails) {
            let task = {};
            task['key'] = 'task'+taskDetails.id;
            task['label'] = <> Task ({taskDetails.id}) 
                                <span className="find-obj-tree-view">
                                    <a href={`/task/view/${taskType}/${taskDetails.id}`} target='_blank' title=" View Task Details">
                                            <i className="fa fa-eye" />
                                    </a>
                                </span> 
                                <span> <a href={taskDetails.url} target='_blank' title=" View Task API"><i className="fa fa-link" /></a></span></>;
            task['icon'] = 'fa fa-tasks';
            if (taskType === 'blueprint') {
                task['children'] = await this.findSchedulingUnit('blueprint', taskDetails.scheduling_unit_blueprint_id);
            }   else {
                task['children'] = await this.findSchedulingUnit('draft', taskDetails.scheduling_unit_draft_id);
            }
            return [task];
        }
        return '';
    }

    /**
     * Find Scheduling Unit for given id
     * @param {*} suType 
     * @param {*} id 
     * @returns 
     */
    async findSchedulingUnit(suType, id){
        let suDetails = null;
        if (suType === 'blueprint') {
            suDetails = await ScheduleService.getSchedulingUnitBlueprintById (id);
        }   else {
            suDetails = await ScheduleService.getSchedulingUnitDraftById(id);
        }
        if (suDetails) {
            let schedulingUnit = {};
            schedulingUnit['key'] = 'su'+suDetails.id;
            schedulingUnit['label'] = <> Scheduling Unit ({suDetails.id}) 
                                 <span className="find-obj-tree-view"><a href={`/schedulingunit/view/${suType}/${suDetails.id}`} 
                                    target='_blank' title=" View Scheduling Unit Details"><i className="fa fa-eye" /></a> </span>
                                <span><a href={suDetails.url} target='_blank' title=" View Scheduling Unit API" >
                                    <i className="fa fa-link" /></a></span></>;
            schedulingUnit['icon'] = 'pi pi-fw pi-calendar';
            schedulingUnit['children'] = await this.findSchedulingSetBySUId(suDetails);
           return [schedulingUnit];
        }
        return '';
    }

    /**
     * Find project for given SU id 
     * @param {*} suId 
     */
    async findSchedulingSetBySUId(suDetails) {
        const suSetDetails = suDetails.scheduling_set_object;
        if (suSetDetails) {
            let suSet = {};
            suSet['key'] = 'suset'+suSetDetails.id;
            suSet['label'] = <> Scheduling Set ({suSetDetails.id})
                                {/*  -- View page not available yet --
                                <span className="find-obj-tree-view"><a href="" 
                                target='_blank' title='View Project details'><i className="fa fa-eye" /></a></span> */}
                                <span className="find-obj-tree-view">
                                    <a href={suSetDetails.url} target='_blank' title='View Scheduling Set API'><i className="fa fa-link" /></a></span></>;
            suSet['icon'] = 'fa fa-table';
            suSet['children'] = await this.findProject(suSetDetails.project_id);
            return [suSet];
        }
        return '';
    }

    /**
     * Find project details for given id
     * @param {*} id 
     * @returns 
     */
    async findProject(id){
        const projectDetails = await ProjectService.getProjectDetails(id);
        if (projectDetails) {
            let project = {};
            project['key'] = projectDetails.name;
            project['label'] = <> Project ({projectDetails.name})
                                <span className="find-obj-tree-view"><a href={`/project/view/${projectDetails.name}`} 
                                target='_blank' title='View Project details'><i className="fa fa-eye" /></a></span>
                                <span><a href={projectDetails.url} target='_blank' title='View Project API'><i className="fa fa-link" /></a></span></>;
            project['icon'] = 'fab fa-fw fa-wpexplorer';
            return [project];
        }
        return '';
    }


    expandNode(node, expandedKeys) {
        if (node.children && node.children.length) {
            expandedKeys[node.key] = true;

            for (let child of node.children) {
                this.expandNode(child, expandedKeys);
            }
        }
    }

    expandAll() {
        let expandedKeys = {};
        for (let node of this.state.objNodes) {
            this.expandNode(node, expandedKeys);
        }
        this.setState({expandedKeys: expandedKeys });
    }

    render(){
        return(
            <>
               <PageHeader location={this.props.location} title={'Search Result'} 
                    actions={[]}
                />
                { this.state.isLoading ? <AppLoader /> :
                <>
                    {this.state.objNodes.length > 0 &&
                        <>
                            <Tree value={this.state.objNodes} selectionMode="multiple" expandedKeys={this.state.expandedKeys} 
                                style={{width: 'auto'}} onToggle={e => this.setState({expandedKeys: e.value})} />
                        </>
                    }
                    {this.state.objNodes.length === 0 &&
                        <> No Object found ! </>
                    }
                </>
                }
            </>
        )
    } 
}
