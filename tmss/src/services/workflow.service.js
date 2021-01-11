import axios from 'axios'

axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';

const WorkFlowService = { 
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
    saveReportingTo: async function (id, data){
        let res = [];
        await axios.put((`/workflow_api/scheduling_unit_flow/qa_reporting_to/${id}/`), data)
        .then(response => {
            res= response.data.results; 
        }).catch(function(error) {
            console.error('[WorkFlowService.getReportingTogetReportingTo]',error);
        });
        return res;
    }
};

export default WorkFlowService;