import _ from 'lodash';

import UnitConverter from './../utils/unit.converter'

const axios = require('axios');

axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

const ProjectService = {
    getProjectCategories: async function() {
        try {
          const url = `/api/project_category/`;
          const response = await axios.get(url);
          return response.data.results;
        } catch (error) {
          console.error(error);
        }
    },
    getPeriodCategories: async function() {
        try {
          const url = `/api/period_category/`;
          const response = await axios.get(url);
          return response.data.results;
        } catch (error) {
          console.error(error);
        }
    },
    getFileSystem: async function(){
      try {
        const url = `/api/filesystem/`;
        const response = await axios.get(url);
        return response.data.results;
      } catch (error) {
        console.error(error);
      } 
      },
    getCluster:async function(){
     try {
        const url = `/api/cluster/`;
        const response = await axios.get(url);
        return response.data.results;
      } catch (error) {
        console.error(error);
      } 
    },
    getResources: async function() {
        try {
            // const url = `/api/resource_type/?ordering=name`;
            const url = `/api/resource_type`;
            const response = await axios.get(url);
            // console.log(response);
            return response.data.results;
          } catch (error) {
            console.error(error);
          }
    },
    getDefaultProjectResources: async function() {
        try {
          return Promise.resolve({'LOFAR Observing Time': 3600, 
                    'LOFAR Observing Time prio A': 3600, 
                    'LOFAR Observing Time prio B': 3600,
                    'CEP Processing Time': 3600,
                    'LTA Storage': 1024*1024*1024*1024,
                    'Number of triggers': 1,
                    'LOFAR Support Time': 3600});
        } catch (error) {
          console.error(error);
        }
    },
    saveProject: async function(project, projectQuota) {
      try {
        const response = await axios.post(('/api/project/'), project);
        project = response.data
        for (let quota of projectQuota) {
          quota.project = project.url;
          this.saveProjectQuota(quota);
        }
        return response.data;
      } catch (error) {
        // console.log(error);
        console.log(error.response.data);
        return error.response.data;
      }
    },
    updateProject: async function(id, project) {
      try {
        const response = await axios.put((`/api/project/${id}/`), project);
        return response.data;
      } catch (error) {
        // console.log(error);
        console.log(error.response.data);
        return error.response.data;
      }
    },
    saveProjectQuota: async function(projectQuota) {
      try {
        const response = await axios.post(('/api/project_quota/'), projectQuota);
        return response.data;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    updateProjectQuota: async function(projectQuota) {
      try {
        const response = await axios.put(`/api/project_quota/${projectQuota.id}/`, projectQuota);
        return response.data;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    deleteProjectQuota: async function(projectQuota) {
      try {
        const response = await axios.delete(`/api/project_quota/${projectQuota.id}/`);
        return response.status===204?{message: 'deleted'}:null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    getProjects: async function() {
      try {
        const response = await axios.get(('/api/project/'));
        let projects = response.data.results;
        const response1 = await axios.get(('/api/project_quota'));
        const allProjectQuota = response1.data.results;
        for (let project of projects) {
          let projectQuota = _.filter(allProjectQuota, function(projQuota) { return _.includes(project.project_quota_ids, projQuota.id)});
          for (const quota of projectQuota) {
            project[quota.resource_type_id] = quota;
          }
        }
        return response.data.results;
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    getProjectDetails: async function(id) {
      try {
        const response = await axios.get((`/api/project/${id}`));
        let project = response.data;
        return project;
      } catch(error) {
        console.error(error);
        return null;
      }
    },
    getProjectQuota: async function(quotaId) {
      try {
        const response = await axios.get((`/api/project_quota/${quotaId}`));
        return response.data;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    getProjectList: async function() {
      try {
        const response = await axios.get('/api/project/');
        return response.data.results;
      } catch (error) {
        console.error('[project.services.getProjectList]',error);
      }
    },

    getResourceUnitType: async function(resource_type_id, resourceTypes){
      let res_unit_type = '';
      try{
        await resourceTypes.forEach(resourcetype => {
          if(resourcetype.name === resource_type_id){
            res_unit_type = resourcetype.quantity_value;
            return res_unit_type;
          }
        });
      } catch (error) {
        console.error('[project.services.getResourceUnitType]',error);
      }
      return res_unit_type;
    },
  
    getUpdatedProjectQuota: async function(projects) {
      let results = {};
      try{
        if(projects){
          await this.getResources()
          .then(resourcetypes =>{
              results.resourcetypes = resourcetypes;
          })
          .then( async ()=>{
            for(const project of projects){
              for(const  id of project.quota_ids){
                await ProjectService.getProjectQuota(id).then(async quota =>{
                    const resourceType = _.find(results.resourcetypes, ["name", quota.resource_type_id]);
                    project[quota.resource_type_id] = UnitConverter.getUIResourceUnit(resourceType.quantity_value, quota.value);
                  })
              }
              projects.map((pro,index) => {
                if(pro.name === project.name){
                  project['actionpath']= '/project/view';
                  projects[index] = project;
                }
                return pro;
              });
            }
          });
          results.projects = projects;
          return results.projects;
        }
      } catch (error) {
        console.error('[project.services.getUpdatedProjectQuota]',error);
      }
      return results;
    },
}

export default ProjectService;