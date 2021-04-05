const axios = require('axios');

const CycleService = {
    getAllCycles: async function () {
        try {
            const url = `/api/cycle`;
            const response = await axios.get(url);
            return response.data.results;
        } catch (error) {
            console.error(error);
        }
    },
    // Duplicate
    // now renamed getCycleById to getProjectsByCycle
    getProjectsByCycle: async function (id) {
        try {
            const url = `/api/cycle/${id}/project`;
            const response = await axios.get(url);
            return response.data.results;
        } catch (error) {
            console.error(error);
        }
    },
    getAllCycleQuotas: async function () {
        let res = [];
        // To be changed once the cycle_quota for cycle is available.
        await axios.get('/api/cycle_quota/?limit=1000&offset=0')
            .then(response => {
                res = response.data.results;
            }).catch(function (error) {
                console.error('[cycle.services.cycle_quota]', error);
            });
        return res;
    },
    // Duplicate
      getCycle: async function(id) {
        try {
          const response = await axios.get((`/api/cycle/${id}`));
          return response;
        } catch (error) {
          console.error(error);
        }
      },
      // To be removed
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
      //Duplicate
      getResources: async function() {
        try {
            const url = `/api/resource_type`;
            const response = await axios.get(url);
            return response.data.results;
          } catch (error) {
            console.error('[cycle.services.getResources]',error);
          }
    },
    getCycleQuota: async function(id) {
      try {
        const response = await axios.get((`/api/cycle_quota/${id}`));
        return response.data;
      } catch (error) {
        console.error(error);
      }
    },
    saveCycle: async function(cycle, cycleQuota) {
      try {
        const response = await axios.post(('/api/cycle/'), cycle);
        cycle = response.data
        for (let quota of cycleQuota) {
          quota.cycle = cycle.url;
          this.saveCycleQuota(quota);
        }
        return response.data;
      } catch (error) {
        console.log(error.response.data);
        return error.response.data;
      }
    },
    saveCycleQuota: async function(cycleQuota) {
      try {
        const response = await axios.post(('/api/cycle_quota/'),cycleQuota);
        return response.data;
      } catch (error) {
        console.error(error);
        return null;
      }
    }, 
    updateCycle: async function(id, cycle) {
      try {
        const response = await axios.put((`/api/cycle/${id}/`), cycle);
        return response.data;
      } catch (error) {
        console.log(error.response.data);
        //return error.response.data;
      }
    },
    deleteCycleQuota: async function(cycleQuota) {
      try {
        const response = await axios.delete(`/api/cycle_quota/${cycleQuota.id}/`);
        return response.status===204?{message: 'deleted'}:null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    updateCycleQuota: async function(cycleQuota) {
      try {
        const response = await axios.put(`/api/cycle_quota/${cycleQuota.id}/`, cycleQuota);
        return response.data;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    //Duplicate
    getCycleDetails: async function(id) {
      try {
        const response = await axios.get((`/api/cycle/${id}`));
        let cycle = response.data;
        return cycle;
      } catch(error) {
        console.error(error);
        return null;
      }
    },
}

export default CycleService;
