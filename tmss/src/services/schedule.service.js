import axios from 'axios'
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
    getSchedulingUnitDraftById: async function (id){
        let res = [];
        await axios.get('/api/scheduling_unit_draft/'+id)
        .then(response => {
            res= response; 
        }).catch(function(error) {
            console.error('[schedule.services.getSchedulingUnitDraftById]',error);
        });
        return res;
    },
    getScheduleTasksBySchedulingUnitId: async function(id){
        let scheduletasklist=[];
        let taskblueprints = [];
        // Common keys for Task and Blueprint
        let commonkeys = ['id','created_at','description','name','tags','updated_at','url','do_cancel','relative_start_time','relative_stop_time','start_time','stop_time','duration'];
        await this.getTaskBlueprints().then( blueprints =>{
            taskblueprints = blueprints.data.results;
        })
        await this.getTasksDraftBySchedulingUnitId(id)
        .then(response =>{
            for(const task of response.data.results){
                let scheduletask = [];
                scheduletask['tasktype'] = 'Task Draft';
                scheduletask['actionpath'] = '/task/view/draft/'+task['id'];
                scheduletask['blueprint_draft'] = task['task_blueprints'];

                //fetch task draft details
                for(const key of commonkeys){
                    scheduletask[key] = task[key];
                }
                scheduletask['created_at'] = moment(task['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:SS")

               //Fetch blueprint details for Task Draft
                let filteredblueprints =  _.filter(taskblueprints, function(o) {
                    if (o.draft_id === task['id']) return o;
                });

                for(const blueprint of filteredblueprints){
                    let taskblueprint = [];
                    taskblueprint['tasktype'] = 'Blueprint';
                    taskblueprint['actionpath'] = '/task/view/blueprint/'+blueprint['id'];
                    taskblueprint['blueprint_draft'] = blueprint['draft'];
                    for(const key of commonkeys){
                        taskblueprint[key] = blueprint[key];
                    }
                    taskblueprint['created_at'] = moment(blueprint['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:SS")
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