import axios from 'axios'
//import moment from 'moment';
import TaskService from './task.service';
import moment from 'moment';

axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

const ScheduleService = { 
    getSchedulingUnitDraft: async function (){
        let res = [];
        try {
            res = await axios.get('/api/scheduling_unit_draft/?limit=1');
            if (res.data.count > res.data.results.length) {
                res = await axios.get(`/api/scheduling_unit_draft/?ordering=id&limit=${res.data.count}&offset=0`);
            }
        }   catch(error) {
            console.error('[schedule.services.getSchedulingUnitDraft]',error);
        }
        return res;
    },
    getSchedulingUnitBlueprint: async function (){
        let res = [];
        try {
            res = await axios.get('/api/scheduling_unit_blueprint/?limit=1');
            if (res.data.count > res.data.results.length) {
                res = await axios.get(`/api/scheduling_unit_blueprint/?ordering=id&limit=${res.data.count}&offset=0`);
            }
        }   catch(error) {
            console.error('[schedule.services.getSchedulingUnitBlueprint]',error);
        }
        return res;
    },
    //>>>>>> TODO: Remove this method by using/modifying other functions with additional parameters
    getTaskBPWithSubtaskTemplate: async function(id) {
        let result;
        try {
            result = await axios.get('/api/task_blueprint/'+id);
            if (result.data) {
                result.data.template = await TaskService.getTaskTemplate(result.data.specifications_template_id);
            }
            if (result.data) {
                let subTasks = [];
                let subTasktemplate = {}
                for (const subtaskId of result.data.subtasks_ids) {
                    const subTask = await TaskService.getSubtaskDetails(subtaskId);
                    //To avoid repeated api call for template if it has already loaded
                    if (subTasktemplate[subTask.specifications_template_id]) {
                        subTask.subTaskTemplate = subTasktemplate[subTask.specifications_template_id];
                    } else {
                        const subTaskTemplate = await TaskService.getSubtaskTemplate(subTask.specifications_template_id);
                        subTask.subTaskTemplate = subTaskTemplate;
                        subTasktemplate[subTask.specifications_template_id] = subTaskTemplate;
                    }
                    subTasks.push((subTask));
                }
                result.data.subTasks = subTasks;
            }
        }   catch(error) {
            console.error('[schedule.services.getTaskBlueprintById]',error);
        }
        return result;
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
                schedulingUnit.scheduling_constraints_doc = schedulingUnitDraft.scheduling_constraints_doc;
            }
            return schedulingUnit;
        }   catch(error) {
            console.error(error);
            return null;
        }
    },
    getTaskType: async function(){
        try {
            const response = await axios.get('/api/task_type');
            return response.data.results;
        }   catch(error) {
            console.error(error);
            return null;
        };
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
    getTaskBlueprintById: async function(id, loadTemplate, loadSubtasks){
        let result;
        try {
            result = await axios.get('/api/task_blueprint/'+id);
            if (result.data && loadTemplate) {
                result.data.template = await TaskService.getTaskTemplate(result.data.specifications_template_id);
            }
            if (result.data && loadSubtasks) {
                let subTasks = [];
                for (const subtaskId of result.data.subtasks_ids) {
                    subTasks.push((await TaskService.getSubtaskDetails(subtaskId)));
                }
                result.data.subTasks = subTasks;
            }
        }   catch(error) {
            console.error('[schedule.services.getTaskBlueprintById]',error);
        }
        return result;
    },
    getTaskBlueprintsBySchedulingUnit: async function(scheduleunit, loadTemplate, loadSubtasks){
        // there no single api to fetch associated task_blueprint, so iteare the task_blueprint id to fetch associated task_blueprint
        let taskblueprintsList = [];
        if(scheduleunit.task_blueprints_ids){
            for(const id of scheduleunit.task_blueprints_ids){
               await this.getTaskBlueprintById(id, loadTemplate, loadSubtasks).then(response =>{
                    let taskblueprint = response.data;
                    taskblueprint['tasktype'] = 'Blueprint';
                    taskblueprint['actionpath'] = '/task/view/blueprint/'+taskblueprint['id'];
                    taskblueprint['blueprint_draft'] = taskblueprint['draft'];
                    taskblueprint['relative_start_time'] = 0;
                    taskblueprint['relative_stop_time'] = 0;
                    taskblueprint.duration = moment.utc((taskblueprint.duration || 0)*1000).format('HH:mm:ss');
                    taskblueprintsList.push(taskblueprint);
                })
            }
        }
        return taskblueprintsList;
    },
    //>>>>>> TODO: Remove this method by using/modifying other functions with additional parameters
    getTaskBPWithSubtaskTemplateOfSU: async function(scheduleunit){
        // there no single api to fetch associated task_blueprint, so iterate the task_blueprint id to fetch associated task_blueprint
        let taskblueprintsList = [];
        if (scheduleunit.task_blueprints_ids){
            for(const id of scheduleunit.task_blueprints_ids) {
               await this.getTaskBPWithSubtaskTemplate(id).then(response =>{
                    let taskblueprint = response.data;
                    taskblueprint['tasktype'] = 'Blueprint';
                    taskblueprint['actionpath'] = '/task/view/blueprint/'+taskblueprint['id'];
                    taskblueprint['blueprint_draft'] = taskblueprint['draft'];
                    taskblueprint['relative_start_time'] = 0;
                    taskblueprint['relative_stop_time'] = 0;
                    taskblueprint.duration = moment.utc((taskblueprint.duration || 0)*1000).format('HH:mm:ss');
                    taskblueprintsList.push(taskblueprint);
                })
            }
        }
        return taskblueprintsList;
    },
    getTaskDetailsByBluePrintSchUnitById: async function(scheduleunit) {
        const response = await this.getTaskBPWithSubtaskTemplateOfSU(scheduleunit);
        return {
            id: scheduleunit.id,
            tasks: response,
            type: 'Blueprint'
        }
    },
    getTaskDetailsByDraftSchUnitById: async function(id, loadTemplate, loadSubtasks, loadSubtaskTemplate) {
        const response = await this.getTasksBySchedulingUnit(id, loadTemplate, loadSubtasks, loadSubtaskTemplate);
        return {
            id,
            type: 'Draft',
            tasks: response
        }
    },
    getTasksBySchedulingUnit: async function(id, loadTemplate, loadSubtasks, loadSubtaskTemplate){
        let scheduletasklist=[];
        // let taskblueprints = [];
        // Common keys for Task and Blueprint
        let commonkeys = ['id','created_at','description','name','tags','updated_at','url','do_cancel','relative_start_time','relative_stop_time','start_time','stop_time','duration','status'];
        // await this.getTaskBlueprints().then( blueprints =>{
        //     taskblueprints = blueprints.data.results;'
        // });
        await this.getTasksDraftBySchedulingUnitId(id)
        .then(async(response) =>{
            for(const task of response.data.results){
                let scheduletask = [];
                scheduletask['tasktype'] = 'Draft';
                scheduletask['actionpath'] = '/task/view/draft/'+task['id'];
                scheduletask['blueprint_draft'] = task['task_blueprints'];
                scheduletask['status'] = task['status'];

              
                //fetch task draft details
                for(const key of commonkeys){
                    scheduletask[key] = task[key];
                }
                scheduletask['created_at'] = moment(task['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                scheduletask['updated_at'] = moment(task['updated_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                scheduletask['specifications_doc'] = task['specifications_doc'];
                scheduletask.duration = moment.utc((scheduletask.duration || 0)*1000).format('HH:mm:ss'); 
                scheduletask.produced_by = task.produced_by;
                scheduletask.produced_by_ids = task.produced_by_ids;
                scheduletask.relative_start_time = moment.utc(scheduletask.relative_start_time*1000).format('HH:mm:ss'); 
                scheduletask.relative_stop_time = moment.utc(scheduletask.relative_stop_time*1000).format('HH:mm:ss'); 
                if (loadTemplate) {
                    scheduletask.template = await TaskService.getTaskTemplate(task.specifications_template_id);
                    scheduletask.type_value = scheduletask.template.type_value;
                }
               //Fetch blueprint details for Task Draft
	            const draftBlueprints = await TaskService.getDraftsTaskBlueprints(task.id);
                // let filteredblueprints =  _.filter(taskblueprints, function(o) {
                //     if (o.draft_id === task['id']) return o;
                // });

                let subTasktemplate = {}
                for(const blueprint of draftBlueprints){
                    let taskblueprint = [];
                    taskblueprint['tasktype'] = 'Blueprint';
                    taskblueprint['actionpath'] = '/task/view/blueprint/'+blueprint['id'];
                    taskblueprint['blueprint_draft'] = blueprint['draft'];
                    taskblueprint['status'] = blueprint['status'];
                  
                    for(const key of commonkeys){
                        taskblueprint[key] = blueprint[key];
                    }
                    taskblueprint['created_at'] = moment(blueprint['created_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                    taskblueprint['updated_at'] = moment(blueprint['updated_at'], moment.ISO_8601).format("YYYY-MMM-DD HH:mm:ss");
                    taskblueprint.duration = moment.utc((taskblueprint.duration || 0)*1000).format('HH:mm:ss'); 
                    taskblueprint.relative_start_time = moment.utc(taskblueprint.relative_start_time*1000).format('HH:mm:ss'); 
                    taskblueprint.relative_stop_time = moment.utc(taskblueprint.relative_stop_time*1000).format('HH:mm:ss');
                    
                    if (loadTemplate) {
                        taskblueprint.template = scheduletask.template;
                    }
                    if (loadSubtasks) {
                        let subTasks = [];
                        for (const subtaskId of blueprint.subtasks_ids) {
                            const subTask = await TaskService.getSubtaskDetails(subtaskId);
                            if (loadSubtaskTemplate) {
                                //To avoid repeated api call for template if it has already loaded
                                if (subTasktemplate[subTask.specifications_template_id]) {
                                    subTask.subTaskTemplate = subTasktemplate[subTask.specifications_template_id];
                                } else {
                                    const subTaskTemplate = await TaskService.getSubtaskTemplate(subTask.specifications_template_id);
                                    subTask.subTaskTemplate = subTaskTemplate;
                                    subTasktemplate[subTask.specifications_template_id] = subTaskTemplate;
                                }
                            }
                            subTasks.push((subTask));
                        }
                        taskblueprint.subTasks = subTasks;
                    }       
                    //Add Blue print details to array
                    scheduletasklist.push(taskblueprint);
                }
                //Add Task Draft details to array
                scheduletasklist.push(scheduletask);
            }
            if (loadTemplate) {
                const ingest = scheduletasklist.find(task => task.template.type_value === 'ingest');
                let promises = [];
                // Get Task Relation for all producer
                ingest.produced_by_ids.map(id => promises.push(this.getTaskRelation(id)));
                const res = await Promise.all(promises);
                promises = [];
                // Getting producer name for all producers
                res.map(producer => promises.push(this.getTaskDraft(producer.producer_id)));
                const producers = await Promise.all(promises);
                producers.map(producer => {
                    const tasks = scheduletasklist.filter(task => producer.consumed_by_ids.includes(task.id));
                    tasks.map(task => {
                        task.producerDetails = producer;
                        task.isProducer = true;
                    });
                });
            }   
        }).catch(function(error) {
            console.error('[schedule.services.getScheduleTasksBySchedulingUnitId]',error);
        });
        return scheduletasklist;
    },
    getTaskRelation: async function(id) {
        let res;
        await axios.get(`/api/task_relation_draft/${id}`)
        .then(response => {
            res= response;
        }).catch(function(error) {
            console.error('[schedule.services.getTaskBlueprints]',error);
        });
        return res.data;
    },
    getTaskDraft: async function(id) {
        let res;
        await axios.get(`/api/task_draft/${id}`)
        .then(response => {
            res= response;
        }).catch(function(error) {
            console.error('[schedule.services.getTaskBlueprints]',error);
        });
        return res.data;
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
    getTasksDraftBySchedulingUnitId: async function (id, loadTemplate){
        let res=[];
        await axios.get('/api/scheduling_unit_draft/'+id+'/task_draft/?ordering=id')
        .then(async response => {
            res= response;
            if (response && response.data.results && loadTemplate) {
                for(const task of response.data.results){
                    task.template = await TaskService.getTaskTemplate(task.specifications_template_id);
                }
            }
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
    getSchedulingConstraintTemplates: async function(){
        try {
            const response = await axios.get('/api/scheduling_constraints_template/');
            return response.data.results;
        }   catch(error) {
            console.error(error);
            return [];
        };
    },
    getSchedulingConstraintTemplate: async function(id){
        try {
            const response = await axios.get(`/api/scheduling_constraints_template/${id}`);
            return response.data;
        }   catch(error) {
            console.error(error);
            return null;
        };
    },
    saveSUDraftFromObservStrategy: async function(observStrategy, schedulingUnit, constraint,station_groups) {
        try {
            // Create the scheduling unit draft with observation strategy and scheduling set
            const url = `/api/scheduling_unit_observing_strategy_template/${observStrategy.id}/create_scheduling_unit/?scheduling_set_id=${schedulingUnit.scheduling_set_id}&name=${schedulingUnit.name}&description=${schedulingUnit.description}`
            const suObsResponse = await axios.get(url);
            schedulingUnit = suObsResponse.data;
            if (schedulingUnit && schedulingUnit.id) {
                // Update the newly created SU draft requirement_doc with captured parameter values
                schedulingUnit.requirements_doc = observStrategy.template;
                schedulingUnit.scheduling_constraints_doc = constraint.scheduling_constraints_doc;
                schedulingUnit.scheduling_constraints_template_id = constraint.id;
                schedulingUnit.scheduling_constraints_template = constraint.constraint.url;
                delete schedulingUnit['duration'];
                schedulingUnit = await this.updateSchedulingUnitDraft(schedulingUnit);
                if (!schedulingUnit || !schedulingUnit.id) {
                    return {
                        error: true,
                        messsage: 'Unable to create scheduling unit'
                    };
                }
                // Create task drafts with updated requirement_doc
                schedulingUnit = await this.createSUTaskDrafts(schedulingUnit);
                if (schedulingUnit && schedulingUnit.task_drafts.length > 0) {
                    return schedulingUnit;
                }
            }
            return {
                error: true,
                messsage: 'Unable to create task drafts'
            };
        }   catch(error) {
            console.error(error);
            return {
                error: true
            };
        };
    },
    
    updateSUDraftFromObservStrategy: async function(observStrategy,schedulingUnit,tasks,tasksToUpdate,station_groups) {
        try {
            delete schedulingUnit['duration'];
           
            schedulingUnit = await this.updateSchedulingUnitDraft(schedulingUnit);
            if (!schedulingUnit.error) {
                for (const taskToUpdate in tasksToUpdate) {
                    let task = tasks.find(task => { return task.name === taskToUpdate});
                    task.specifications_doc = observStrategy.template.tasks[taskToUpdate].specifications_doc;
                    if (task.specifications_doc.station_groups) {
                        task.specifications_doc.station_groups = station_groups;
                    }
                    delete task['duration'];
                    delete task['relative_start_time'];
                    delete task['relative_stop_time'];
                    task = await TaskService.updateTask('draft', task);
                    if (task.error) {
                        schedulingUnit = task;
                    }
                }
            }
            return schedulingUnit;
        }   catch(error) {
            console.error(error);
            return {
                error: true
            };
        };
    },
    updateSchedulingUnitDraft: async function(schedulingUnit) {
        try {
           schedulingUnit.scheduling_constraints_doc = ( schedulingUnit.scheduling_constraints_doc == null)?"": schedulingUnit.scheduling_constraints_doc;
            const suUpdateResponse = await axios.put(`/api/scheduling_unit_draft/${schedulingUnit.id}/`, schedulingUnit);
            return suUpdateResponse.data;
        }   catch(error) {
            console.error("Mistake",error);
            return {
                error: true,
                message: 'Unable to update the scheduling unit'
            }
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
    },
    getSchedulingListByProject: async function(project){
        /*
        SU -  Schedulign Unit
        Get Scheduling Unit Draft and It's Blueprints using Project ID. there is no direct API to get SU form project (API request -TMSS-349)
        Use Fetch all Scheduling Set and filter Scheduling Set with Project ID => Get SU Draft list and SU Blueprints
        */
        try {
          let schedulingunitlist = [];
          //Fetch all Scheduling Set as there is no API to fetch Scheduling Set for a Project
          await this.getSchedulingSets().then(async schedulingsetlist =>{
            let schedulingsets = schedulingsetlist.filter(scheduingset => scheduingset.project_id === project)
            for(const scheduleset of schedulingsets){
                //Fecth SU Drafts for the Scheduling Set
                await this.getSchedulingBySet(scheduleset.id).then(async suDraftList =>{
                    for(const suDraft of suDraftList){
                        suDraft['actionpath']='/schedulingunit/view/draft/'+suDraft.id;
                        suDraft['type'] = 'Draft';
                        suDraft['duration'] = moment.utc((suDraft.duration || 0)*1000).format('HH:mm:ss');
                        schedulingunitlist = schedulingunitlist.concat(suDraft);
                        //Fetch SU Blue prints for the SU Draft
                        await this.getBlueprintsByschedulingUnitId(suDraft.id).then(suBlueprintList =>{
                            for(const suBlueprint of suBlueprintList.data.results){
                                suBlueprint.duration = moment.utc((suBlueprint.duration || 0)*1000).format('HH:mm:ss'); 
                                suBlueprint.type="Blueprint"; 
                                suBlueprint['actionpath'] = '/schedulingunit/view/blueprint/'+suBlueprint.id;
                                schedulingunitlist = schedulingunitlist.concat(suBlueprint);
                            }
                        })
                    }
                })
            }
          })
          return schedulingunitlist;
        } catch (error) {
          console.error('[project.services.getSchedulingListByProject]',error);
        }
      },     
      getSchedulingBySet: async function(id){
        try{
          const response = await axios.get(`/api/scheduling_set/${id}/scheduling_unit_draft/?ordering=id`);
          return response.data.results;
        } catch (error) {
          console.error('[project.services.getSchedulingUnitBySet]',error);
        }
      },
      createSchedulingUnitBlueprintTree: async function(id) {
          try {
            const response = await axios.get(`/api/scheduling_unit_draft/${id}/create_blueprints_and_subtasks`);
            return response.data;
          } catch(error) {
              console.error(error);
          }
      },
      getStationGroup: async function() {
        try {
          //  const response = await axios.get('/api/station_type/');
          //  return response.data.results;
          return [{
            value: 'Dutch'
        },{
            value: 'International'
        },{
            value: 'Core'
        },{
            value: 'Remote'
        },{
            value: 'Superterp'
        }]
        }   catch(error) {
            console.error(error);
            return [];
        };
    },
    getStations: async function(e) {
        try {
           // const response = await axios.get('/api/station_groups/stations/1/dutch');
           const response = await axios.get(`/api/station_groups/stations/1/${e}`);
            return response.data;
        }   catch(error) {
            console.error(error);
            return [];
        }
    },
      getProjectList: async function() {
        try {
          const response = await axios.get('/api/project/');
          return response.data.results;
        } catch (error) {
          console.error('[project.services.getProjectList]',error);
        }
      }
}

export default ScheduleService;