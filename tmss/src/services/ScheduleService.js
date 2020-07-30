import axios from 'axios'

export async function getScheduling_Unit_Draft(){
    let res = [];
    await axios.get('/api/scheduling_unit_draft/?ordering=id', {            
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic dGVzdDp0ZXN0" 
            }
      }  
    ).then(function(response) {
        res= response; 
    }).catch(function(error) {
        console.log('Error on Authentication',error);
    });
    return res;
}
  
export async function getScheduling_Unit_Draft_By_Id(id){
    let res = [];
    await axios.get('/api/scheduling_unit_draft/'+id, {            
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic dGVzdDp0ZXN0" 
            }
      }  
    ).then(function(response) {
        res= response; 
    }).catch(function(error) {
        console.log('Error on Authentication',error);
    });
    return res;
}

export async function getTasks_Draft_By_scheduling_Unit_Id(id){
    let res=[];
    await axios.get('/api/scheduling_unit_draft/'+id+'/task_draft/?ordering=id', {            
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic dGVzdDp0ZXN0" 
            }
      }  
    ).then(function(response) {
        res= response;
    }).catch(function(error) {
        console.log('Error on Authentication',error);
    });
    return res;
}

 