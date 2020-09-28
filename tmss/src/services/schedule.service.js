import axios from 'axios'

import TaskService from './task.service';
import _ from 'lodash';
import moment from 'moment';

axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

const ScheduleService = { 
    getSchedulingUnitDraft: async function (){
        let res = [];
        await axios.get('/api/scheduling_unit_draft/?ordering=id')
        .then(response => {
            res= response; 
        }).catch(function(error) {
            console.error('[schedule.services.getSchedulingUnitDraft]',error);
        });
        return res;
    },
    getSchedulingUnitBlueprint: async function (){
        let res = [];
        await axios.get('/api/scheduling_unit_blueprint/?ordering=id')
        .then(response => {
            res= response; 
        }).catch(function(error) {
            console.error('[schedule.services.getSchedulingUnitBlueprint]',error);
        });
        return res;
    },
    getSchedulingUnitBlueprintById: async function (id){
        try {
            const response = await axios.get('/api/scheduling_unit_blueprint/'+id);
            let schedulingUnit = response.data;
            if (schedulingUnit) {
                const schedulingUnitDraft = await this.getSchedulingUnitDraftById(schedulingUnit.draft_id);
                schedulingUnit.scheduling_set_id = schedulingUnitDraft.scheduling_set_id;
                schedulingUnit.scheduling_set = schedulingUnitDraft.scheduling_set;
                schedulingUnit.scheduling_set_object = schedulingUnitDraft.scheduling_set_object;
            }
            return schedulingUnit;
        }   catch(error) {
            console.error(error);
            return null;
        }
    },
    getSchedulingUnitDraftById: async function (id){
        try {
            const schedulingUnit = (await axios.get('/api/scheduling_unit_draft/'+id)).data;
            const schedulingSet = (await axios.get(`/api/scheduling_set/${schedulingUnit.scheduling_set_id}`)).data;
            schedulingUnit.scheduling_set_object = schedulingSet;
            return schedulingUnit;
        }   catch(error){
            console.error('[schedule.services.getSchedulingUnitDraftById]',error);
            return null;
        }
    },
    getTaskBlueprintById: async function(id){
        let res = [];
        await axios.get('/api/task_blueprint/'+id)
        .then(response => {
            res= response; 
        }).catch(function(error) {
            console.error('[schedule.services.getTaskBlueprintById]',error);
        });
        return res;
    },
    getTaskBlueprintsBySchedulingUnit: async function(scheduleunit){
        // there no single api to fetch associated task_blueprint, so iteare the task_blueprint id to fetch associated task_blueprint
        let taskblueprintsList = [];
        if(scheduleunit.task_blueprints_ids){
            for(const id of scheduleunit.task_blueprints_ids){
               await this.getTaskBlueprintById(id).then(response =>{
                    let taskblueprint = response.data;
                    taskblueprint['tasktype'] = 'Blueprint';
                    taskblueprint['actionpath'] = '/task/view/blueprint/'+taskblueprint['id'];
                    taskblueprint['blueprint_draft'] = taskblueprint['draft'];
                    taskblueprint['relative_start_time'] = 0;
                    taskblueprint['relative_stop_time'] = 0;
                    taskblueprint.duration = moment.utc(taskblueprint.duration*1000).format('HH:mm:ss'); 
                    taskblueprintsList.push(taskblueprint);
                })
            }
        }
        return taskblueprintsList;
    },
    getTasksBySchedulingUnit: async function(id){
        let scheduletasklist=[];
        // Common keys for Task and Blueprint
        let commonkeys = ['id','created_at','description','name','tags','updated_at','url','do_cancel','relative_start_time','relative_stop_time','start_time','stop_time','duration'];
        await this.getTasksDraftBySchedulingUnitId(id)
        .then(async(response) =>{
            for(const task of response.data.results){
                let scheduletask = [];
                scheduletask['tasktype'] = 'Draft';
                scheduletask['actionpath'] = '/task/view/draft/'+task['id'];
                scheduletask['blueprint_draft'] = task['task_blueprints'];
               
              
                //fetch task draft details
                for(const key of commonkeys){
                    scheduletask[key] = task[key];
                }
                scheduletask.duration = moment.utc(scheduletask.duration*1000).format('HH:mm:ss'); 
                scheduletask.relative_start_time = moment.utc(scheduletask.relative_start_time*1000).format('HH:mm:ss'); 
                scheduletask.relative_stop_time = moment.utc(scheduletask.relative_stop_time*1000).format('HH:mm:ss'); 
               //Fetch blueprint details for Task Draft
                const draftBlueprints = await TaskService.getDraftsTaskBlueprints(task.id);
                for(const blueprint of draftBlueprints){
                    let taskblueprint = [];
                    taskblueprint['tasktype'] = 'Blueprint';
                    taskblueprint['actionpath'] = '/task/view/blueprint/'+blueprint['id'];
                    taskblueprint['blueprint_draft'] = blueprint['draft'];
                    for(const key of commonkeys){
                        taskblueprint[key] = blueprint[key];
                    }
                    taskblueprint.duration = moment.utc(taskblueprint.duration*1000).format('HH:mm:ss'); 
                    taskblueprint.relative_start_time = moment.utc(taskblueprint.relative_start_time*1000).format('HH:mm:ss'); 
                    taskblueprint.relative_stop_time = moment.utc(taskblueprint.relative_stop_time*1000).format('HH:mm:ss'); 

                    //Add Blue print details to array
                    scheduletasklist.push(taskblueprint);
                }
                //Add Task Draft details to array
                scheduletasklist.push(scheduletask);
            }
        }).catch(function(error) {
            console.error('[schedule.services.getScheduleTasksBySchedulingUnitId]',error);
        });
        return scheduletasklist;
    },
    getSchedulingUnitBlueprint: async function (){
        let res = [];
        await axios.get('/api/scheduling_unit_blueprint/?ordering=id')
        .then(response => {
            res= response; 
        }).catch(function(error) {
            console.error('[schedule.services.getSchedulingUnitBlueprint]',error);
        });
        return res;
    },
    getTaskBlueprints: async function (){
        let res=[];
        await axios.get('/api/task_blueprint/?ordering=id')
        .then(response => {
            res= response;
        }).catch(function(error) {
            console.error('[schedule.services.getTaskBlueprints]',error);
        });
        return res;
    },
    getTaskBlueprintByTaskDraftId: async function (id){
        let res=[];
        await axios.get('/api/task_draft/'+id+'/task_blueprint/?ordering=id')
        .then(response => {
            res= response;
        }).catch(function(error) {
            console.error('[schedule.services.getTaskBlueprintByTaskDraftId]',error);
        });
        return res;
    },
    getTasksDraftBySchedulingUnitId: async function (id){
        let res=[];
        await axios.get('/api/scheduling_unit_draft/'+id+'/task_draft/?ordering=id')
        .then(response => {
            res= response;
        }).catch(function(error) {
            console.error('[schedule.services.getTasksDraftBySchedulingUnitId]',error);
        });
        return res;
    },
    getBlueprintsByschedulingUnitId: async function (id){
        let res=[];
        await axios.get('/api/scheduling_unit_draft/'+id+'/scheduling_unit_blueprint/?ordering=id')
        .then(response => {
            res= response;
        }).catch(function(error) {
            console.error('[schedule.services.getBlueprintsByschedulingUnitId]',error);
        });
        return res;
    },
}

export default ScheduleService;