const axios = require('axios');

const WorkflowService = { 
    getWorkflowProcesses: async function (){
        let data = [];
        try {
            let initResponse = await axios.get('/workflow_api/scheduling_unit_flow/qa_scheduling_unit_process/?ordering=id');
            data = initResponse.data.results;
            const totalCount = initResponse.data.count;
            const initialCount = initResponse.data.results.length;
            if (initialCount < totalCount) {
                let nextResponse = await axios.get(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_process/?ordering=id&limit=${totalCount-initialCount}&offset=${initialCount}`);
                data = data.concat(nextResponse.data.results);
            }
        }   catch(error) {
            console.log(error);
        }
        return data;
    },
    getWorkflowTasks: async function (){
        let data = [];
        try {
            let initResponse = await axios.get('/workflow_api/scheduling_unit_flow/qa_scheduling_unit_task/?ordering=id');
            data = initResponse.data.results;
            const totalCount = initResponse.data.count;
            const initialCount = initResponse.data.results.length;
            if (initialCount < totalCount) {
                let nextResponse = await axios.get(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_task/?ordering=id&limit=${totalCount-initialCount}&offset=${initialCount}`);
                data = data.concat(nextResponse.data.results);
            }
        }   catch(error) {
            console.log(error);
        }
        return data;
    },
    updateAssignTo: async (id, data) => {
        try {
            const response = await axios.post(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_task/${id}/assign/`, data);
            return response.data;
        }   catch(error) {
            console.error('[workflow.services.updateAssignTo]',error);
            return null;
        }
    },
    updateQA_Perform: async (id, data) => {
        try {
            const response = await axios.post(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_process/${id}/perform/`, data);
            return response.data;
        }   catch(error) {
            console.error('[workflow.services.updateQA_Perform]',error);
            return null;
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
        let currentTask = null;
        try {
            const response = await axios.post(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_process/${id}/current_task/`);
            currentTask = response.data[0];
        }   catch(error) {
            console.error('[workflow.services.current_task]',error);
        }
        return currentTask;
    },
    getQAReportingTo: async (id) => {
        try {
            const response = await axios.get(`/workflow_api/scheduling_unit_flow/qa_reporting_to/${id}`);
            return response.data;
        }   catch(error) {
            console.error('[workflow.services.qa_reporting_to]',error);
        }
    },
    getQAReportingSOS: async (id) => {
        try {
            const response = await axios.get(`/workflow_api/scheduling_unit_flow/qa_reporting_sos/${id}`);
            return response.data;
        }   catch(error) {
            console.error('[workflow.services.qa_reporting_sos]',error);
        }
    },
    getQAPIverification: async (id) => {
        try {
            const response = await axios.get(`/workflow_api/scheduling_unit_flow/qa_pi_verification/${id}`);
            return response.data;
        }   catch(error) {
            console.error('[workflow.services.qa_pi_verification]',error);
        }
    },
    getQADecideAcceptance: async (id) => {
        try {
            const response = await axios.get(`/workflow_api/scheduling_unit_flow/qa_decide_acceptance/${id}`);
            return response.data;
        }   catch(error) {
            console.error('[workflow.services.qa_decide_acceptance]',error);
        }
    }
}

export default WorkflowService;