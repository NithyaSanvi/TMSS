const axios = require('axios');

//axios.defaults.baseURL = 'http://192.168.99.100:8008/api';
axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

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
        const response = await axios.get('/api/scheduling_unit_draft/' + id);
        return response.data;
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
        return null;
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
    }
    
}

export default TaskService;