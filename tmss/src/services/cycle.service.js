const axios = require('axios');

//axios.defaults.baseURL = 'http://192.168.99.100:8008/api';
axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

const CycleService = {
    getAllCycle: async function (){
        let res = [];
        await axios.get('/api/cycle/')
        .then(response => {
            res= response;
        }).catch(function(error) {
            console.error('[cycle.services.getAllCycle]',error);
        });
        return res;
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