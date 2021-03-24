const axios = require('axios');

const TaskService = {
    getTaskDetails: async function (taskType, taskId) {
        try {
          const url = taskType === 'blueprint'? '/api/task_blueprint/': '/api/task_draft/';
          const response = await axios.get(url + taskId);
          response.data.predecessors = [];
          response.data.successors = [];
          if (taskType === 'blueprint') {
            response.data.blueprints = [];
          } else {
            response.data.draftName = null;
          }
          return this.getTaskRelationsByTask(taskType, response.data)
                  .then(relations => {
                    response.data.predecessors = relations.predecessors;
                    response.data.successors = relations.successors;
                    if (taskType === 'draft') {
                      response.data.blueprints = relations.blueprints;
                    } else {
                      response.data.draftObject = relations.draft;
                    }
                    return response.data;
                  });
          
        } catch (error) {
          console.error(error);
        }
    },
    getTaskTemplate: async function(templateId) {
      try {
        const response = await axios.get('/api/task_template/' + templateId);
        return response.data;
      } catch (error) {
        console.log(error);
      }
    },
    getTaskTemplates: async function() {
      try {
        const response = await axios.get('/api/task_template/');
        return response.data.results;
      } catch (error) {
        console.log(error);
      }
    },
    getSchedulingUnit: async function(type, id) {
      try {
        const url = `/api/scheduling_unit_${type}/${id}`;
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error(error);
      }
    },
    getTaskDraftList: async function() {
      try {
        const url = `/api/task_draft`;
        const response = await axios.get(url);
        return response.data.results;
      } catch (error) {
        console.error(error);
      }
    },
    getTaskBlueprintList: async function() {
      try {
        const url = `/api/task_blueprint`;
        const response = await axios.get(url);
        return response.data.results;
      } catch (error) {
        console.error(error);
      }
    },
    updateTask: async function(type, task) {
      try {
        const response = await axios.put(('/api/task_draft/' + task.id + "/"), task);
        return response.data;
      } catch (error) {
        console.error(error);
        return {
          error: true,
          message: 'Unable to update task'
        };
      }
    },
    getTaskRelation: async function(type, id) {
      try {
        const url = type === 'blueprint'? '/api/task_blueprint/': `/api/task_draft/${id}/task_relation_draft/`;
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error(error);
      }
    },
    getTaskRelationsByTask: async function(type, task) {
      try {
        let relations = {};
        return this.getTaskPredecessors(type, task.id)
        .then( predecessors => {
          relations.predecessors = predecessors;
          return this.getTaskSuccessors(type, task.id);
        })
        .then( successors => {
          relations.successors = successors;
          if (type === 'draft') {
            return this.getDraftsTaskBlueprints(task.id);
          } else {
            return this.getTaskdraft(task.draft_id);
          }
        })
        .then( result => {
          if (type === 'draft') {
            relations.blueprints = result;
          } else {
            relations.draft = result;
          }
          return relations;
        });
      } catch (error) {
        console.log(error);
      }
    },
    getTaskPredecessors: async function(type, id) {
      try {
        const url = type === 'blueprint'? `/api/task_blueprint/${id}/predecessors`: `/api/task_draft/${id}/predecessors/`;
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error(error);
      }
    },
    getTaskSuccessors: async function(type, id) {
      try {
        const url = type === 'blueprint'? `/api/task_blueprint/${id}/successors`: `/api/task_draft/${id}/successors/`;
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error(error);
      }
    },
    getTaskTemplateSchemaResolved: async function(templateId) {
      try {
        const response = await axios.get('/api/task_template/' + templateId + '/ref_resolved_schema' );
        return response.data;
      } catch (error) {
        console.log(error);
      }
    },
    getDraftsTaskBlueprints: async function(id) {
      try {
        const url = `/api/task_draft/${id}/task_blueprint`;
        const response = await axios.get(url);
        return response.data.results;
      } catch (error) {
        console.error(error);
      }
    },
    getTaskdraft: async function(id) {
      try {
        const url = `/api/task_draft/${id}`;
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        console.error(error);
      }
    },
    getAllSubtaskStatusLogs: async function() {
      try {
        const count = (await axios.get('/api/subtask_state_log')).data.count;
        const response = await axios.get(`/api/subtask_state_log?offset=0&limit=${count}`);
        return response.data.results;
      } catch(error) {
        console.error(error);
      }
    },
    getSubtaskStatusLogs: async function(subtaskId) {
      try {
        const response = await axios.get(`/api/subtask/${subtaskId}/state_log`);
        return response.data;
      } catch(error) {
        console.error(error);
      }
    },
    getTaskStatusLogs: async function(taskId) {
      let statusLogs = [];
      try {
        let subtaskTemplates = {};
        const taskDetails = (await axios.get(`/api/task_blueprint/${taskId}`)).data;
        for (const subtaskId of taskDetails.subtasks_ids) {
          const subtaskDetails = await this.getSubtaskDetails(subtaskId);
          const subtaskLogs = await this.getSubtaskStatusLogs(subtaskId);
          let template = subtaskTemplates[subtaskDetails.specifications_template_id];
          if (!template) {
            template = (await this.getSubtaskTemplate(subtaskDetails.specifications_template_id));
            subtaskTemplates[subtaskDetails.specifications_template_id] = template;
          }
          for (let statusLog of subtaskLogs) {
            statusLog.subtask_type = template?template.name:"";
          }
          statusLogs = statusLogs.concat(subtaskLogs);
        }
      } catch(error) {
        console.error(error);
      }
      return statusLogs;
    },
    getSubtaskTemplates: async function(templateId) {
      try {
        const response = await axios.get(`/api/subtask_template/`);
        return response.data.results;
      } catch(error) {
        console.error(error);
      }
    },
    getSubtaskTemplate: async function(templateId) {
      try {
        const response = await axios.get(`/api/subtask_template/${templateId}`);
        return response.data;
      } catch(error) {
        console.error(error);
      }
    },
    getSubtaskDetails: async function(subtaskId) {
      try {
        return (await axios.get(`/api/subtask/${subtaskId}`)).data;
      } catch(error) {
        console.error(error);
      }
    },
    /**
     * Function to get the task relation objects
     * @param {Array} relationIds - Array of task_relation ids
     * @param {String} type  - 'draft' or 'blueprint'
     */
    getTaskRelations: async function(relationIds, type) {
      let taskRelations = [];
      try {
        for (const relationId of relationIds) {
          const taskRelation = (await axios.get(`/api/task_relation_${type}/${relationId}`)).data;
          taskRelations.push(taskRelation);
        }
      } catch(error) {

      }
      return taskRelations;
    },
    /**
     * Delete task based on task type
     * @param {*} type 
     * @param {*} id 
     */
    deleteTask: async function(type, id) {
        try {
            const url = type.toLowerCase() === 'blueprint'? `/api/task_blueprint/${id}`: `/api/task_draft/${id}`;
            await axios.delete(url);
            return true;
        } catch(error) {
            console.error(error);
            return false;
        }
    }
}

export default TaskService;
