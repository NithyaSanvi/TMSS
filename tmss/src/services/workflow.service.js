const axios = require('axios');

//axios.defaults.baseURL = 'http://192.168.99.100:8008/api';
axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';


const WorkflowService = { 
    updateAssignTo: async (id, data) => {
        try {
            const response = await axios.post(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_task/${id}/assign/`, data);
            return response.data;
        }   catch(error) {
            console.error('[workflow.services.updateAssignTo]',error);
        }
    },
    updateQA_Perform: async (id, data) => {
        try {
            const response = await axios.post(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_process/${id}/perform/`, data);
            return response.data;
        }   catch(error) {
            console.error('[workflow.services.updateQA_Perform]',error);
        }
    },
    getSchedulingUnitTask: async () => {
        try {
            const response = await axios.get(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_task/`);
            return response.data.results;
        }   catch(error) {
            console.error('[workflow.services.getSchedulingUnitTask]',error);
        }
    },
    getCurrentTask: async (id) => {
        try {
            const response = await axios.post(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_process/${id}/current_task/`);
            return response.data;
        }   catch(error) {
            console.error('[workflow.services.current_task]',error);
        }
    }
}

export default WorkflowService;