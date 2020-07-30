import _ from 'lodash';

const axios = require('axios');

axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

const ProjectService = {
    getProjectCategories: async function() {
        try {
          const url = `/api/cycle`;
          const response = await axios.get(url);
          //return response.data.results;
          return [
                    {id: 1, name: "Regular"},
                    {id: 2, name: "User Shared Support"},
                    {id: 3, name: "Commissioning"},
                    {id: 4, name: "DDT"},
                    {id: 5, name: "Test"}
                 ];
        } catch (error) {
          console.error(error);
        }
    },
    getPeriodCategories: async function() {
        try {
          const url = `/api/cycle`;
          const response = await axios.get(url);
        //   return response.data.results;
            return [
                {id: 1, name: "Single Cycle"},
                {id: 2, name: "Long Term"},
                {id: 3, name: "Unbounded"}
            ];
        } catch (error) {
          console.error(error);
        }
    },
    getResources: async function() {
        return this.getResourceTypes()
            .then(resourceTypes => {
                return this.getResourceUnits()
                    .then(resourceUnits => {
                        for (let resourceType of resourceTypes) {
                            resourceType.resourceUnit = _.find(resourceUnits, ['name', resourceType.resource_unit_id]);
                        }
                        return resourceTypes;
                    })
            })
    },
    getResourceTypes: async function() {
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
    getResourceUnits: async function() {
        try {
            const url = `/api/resource_unit`;
            const response = await axios.get(url);
            // console.log(response);
            return response.data.results;
          } catch (error) {
            console.error(error);
          }
    },
    getDefaultProjectResources: async function() {
        try {
          const url = `/api/resource_unit`;
          const response = await axios.get(url);
          // return response.data.results;
          return {'LOFAR Observing Time': 3600, 
                    'LOFAR Observing Time prio A': 3600, 
                    'LOFAR Observing Time prio B': 3600,
                    'CEP Processing Time': 3600,
                    'LTA Storage': 1024*1024*1024*1024,
                    'Number of triggers': 1,
                    'LOFAR Support Time': 3600};
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
    saveProjectQuota: async function(projectQuota) {
      try {
        const response = await axios.post(('/api/project_quota/'), projectQuota);
        return response.data;
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
    }
}

export default ProjectService;