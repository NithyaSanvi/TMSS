import axios from 'axios'

axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

const WorkFlowService = { 
    getWorkFlowProcess: async () => {
        let res = [];
        await axios.get(`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_process/`)
        .then(response => {
            res= response.data.results; 
        }).catch(function(error) {
            console.error('[WorkFlowService.getReportingTogetReportingTo]',error);
        });
        return res;
    },
    getReportingTo: async function (id) {
        let res = [];
        await axios.get(`/workflow_api/scheduling_unit_flow/qa_reporting_to/${id}/`)
        .then(response => {
            res= response.data.results; 
        }).catch(function(error) {
            console.error('[WorkFlowService.getReportingTogetReportingTo]',error);
        });
        return res;
    },
    saveReportingTo: async function (data){
        let res = [];
        await axios.post(`/workflow_api/scheduling_unit_flow/qa_reporting_to`, data)
        .then(response => {
            res= response.data; 
        }).catch(function(error) {
            console.error('[WorkFlowService.getReportingTogetReportingTo]',error);
        });
        return res;
    },
    updateWorkFlowProcess: async (process) => {
        let res = [];
        await axios.put((`/workflow_api/scheduling_unit_flow/qa_scheduling_unit_process/${process.id}`), process)
        .then(response => {
            res= response.data; 
        }).catch(function(error) {
            console.error('[WorkFlowService.qa_scheduling_unit_process]',error);
        });
        return res;
    }
};

export default WorkFlowService;