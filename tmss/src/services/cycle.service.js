const axios = require('axios');

//axios.defaults.baseURL = 'http://192.168.99.100:8008/api';
axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

const CycleService = {
    getAllCycles: async function() {
        try {
          const url = `/api/cycle`;
          const response = await axios.get(url);
          return response.data.results;
        } catch (error) {
          console.error(error);
        }
      },
      getCycle: async function(id) {
        try {
          const url = `/api/cycle/${id}`;
          const response = await axios.get(url);
          return response.data.results;
        } catch (error) {
          console.error(error);
        }
      },
      
      getProjects: async function() {
        let res = [];
        await axios.get('/api/project/')
        .then(response => {
            res= response;
        }).catch(function(error) {
            console.error('[cycle.services.project]',error);
        });
        return res;
    },
    getCycleQuota: async function() {
        let res = [];
        await axios.get('/api/cycle_quota/')
        .then(response => {
            res= response;
        }).catch(function(error) {
            console.error('[cycle.services.cycle_quota]',error);
        });
        return res;
    },
    getResources: async function() {
    let res = [];
    await axios.get('/api/resource_type')
    .then(response => {
        res= response;
    }).catch(function(error) {
        console.error('[cycle.services.resource_type]',error);
    });
    return res;

}
}

export default CycleService;