const axios = require('axios');

const DataProductService = {
    
   getSubtaskInputDataproduct: async function(id){
    try {
      const url = `/api/subtask/${id}/input_dataproducts/`;
      const response = axios.get(url);
      return response;
    } catch (error) {
      console.error('[data.product.getSubtaskInputDataproduct]',error);
    }
   },
   getSubtaskOutputDataproduct: async function(id){
    try {
      const url = `/api/subtask/${id}/output_dataproducts/`;
      const response = axios.get(url);
      return response;
    } catch (error) {
      console.error('[data.product.getSubtaskOutputDataproduct]',error);
    }
   },
   getSubTaskTypes: async function(id){
    try {
        const url = `/api/subtask_template/${id}`;
        const response = axios.get(url);
        return response;
      } catch (error) {
        console.error('[data.product.getSubTaskTypes]',error);
      }
    },
    getSubtask: async function(id){
      try {
        const url = `/api/subtask/${id}`;
        const response = axios.get(url);
        return response;
      } catch (error) {
        console.error('[data.product.getSubtask]',error);
      }
      
    }
    
}

export default DataProductService;