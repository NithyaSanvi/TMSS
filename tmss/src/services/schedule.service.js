import axios from 'axios'
import moment from 'moment';

import TaskService from './task.service';

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
    getSchedulingSets: async function() {
        try {
            const response = await axios.get('/api/scheduling_set/');
            return response.data.results;
        }   catch(error) {
            console.error(error);
            return [];
        };
    },
    getObservationStrategies: async function() {
        try {
            const response = await axios.get('/api/scheduling_unit_observing_strategy_template/');
            return response.data.results;
        }   catch(error) {
            console.error(error);
            return [];
        };
    },
    saveSUDraftFromObservStrategy: async function(observStrategy, schedulingUnit) {
        try {
            // Create the scheduling unit draft with observation strategy and scheduling set
            const url = `/api/scheduling_unit_observing_strategy_template/${observStrategy.id}/create_scheduling_unit/?scheduling_set_id=${schedulingUnit.scheduling_set_id}&name=${schedulingUnit.name}&description=${schedulingUnit.description}`
            const suObsResponse = await axios.get(url);
            schedulingUnit = suObsResponse.data;
            if (schedulingUnit && schedulingUnit.id) {
                // Update the newly created SU draft requirement_doc with captured parameter values
                schedulingUnit.requirements_doc = observStrategy.template;
                delete schedulingUnit['duration'];
                schedulingUnit = await this.updateSchedulingUnitDraft(schedulingUnit);
                if (!schedulingUnit || !schedulingUnit.id) {
                    return null;
                }
                // Create task drafts with updated requirement_doc
                schedulingUnit = await this.createSUTaskDrafts(schedulingUnit);
                if (schedulingUnit && schedulingUnit.task_drafts.length > 0) {
                    return schedulingUnit;
                }
            }
            return null;
        }   catch(error) {
            console.error(error);
            return null;
        };
    },
    // TODO: Steps need to discuss for edit....
    editUDraftFromObservStrategy: async function(observStrategy, schedulingUnit) {
        try {
            // Create the scheduling unit draft with observation strategy and scheduling set
            const url = `/api/scheduling_unit_observing_strategy_template/${observStrategy.id}/create_scheduling_unit/?scheduling_set_id=${schedulingUnit.scheduling_set_id}&name=${schedulingUnit.name}&description=${schedulingUnit.description}`
            const suObsResponse = await axios.get(url);
            schedulingUnit = suObsResponse.data;
            if (schedulingUnit && schedulingUnit.id) {
                // Update the newly created SU draft requirement_doc with captured parameter values
                schedulingUnit.requirements_doc = observStrategy.template;
                delete schedulingUnit['duration'];
                schedulingUnit = await this.updateSchedulingUnitDraft(schedulingUnit);
                if (!schedulingUnit || !schedulingUnit.id) {
                    return null;
                }
                // Create task drafts with updated requirement_doc
                schedulingUnit = await this.createSUTaskDrafts(schedulingUnit);
                if (schedulingUnit && schedulingUnit.task_drafts.length > 0) {
                    return schedulingUnit;
                }
            }
            return null;
        }   catch(error) {
            console.error(error);
            return null;
        };
    },
    updateSchedulingUnitDraft: async function(schedulingUnit) {
        try {
            const suUpdateResponse = await axios.put(`/api/scheduling_unit_draft/${schedulingUnit.id}/`, schedulingUnit);
            return suUpdateResponse.data;
        }   catch(error) {
            console.error(error);
            return null
        }
    },
    createSUTaskDrafts: async (schedulingUnit) => {
        try {
            const suCreateTaskResponse = await axios.get(`/api/scheduling_unit_draft/${schedulingUnit.id}/create_task_drafts/`);
            return suCreateTaskResponse.data;
        }   catch(error) {
            console.error(error);
            return null;
        }
    }
}

export default ScheduleService;