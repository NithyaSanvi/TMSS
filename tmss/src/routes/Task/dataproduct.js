import React, {Component} from 'react';
import {Link} from 'react-router-dom'
import AppLoader from '../../layout/components/AppLoader';
import DataProductService from '../../services/data.product.service';
import TaskService from '../../services/task.service';
import ViewTable from './../../components/ViewTable';
import UnitConverter from './../../utils/unit.converter'

export class DataProduct extends Component{
    constructor(props){
        super(props);
        this.state = {
            isLoading: true,
            dataproduct:[],
            defaultcolumns: [ {
              type:{
                name:"Type",
                filter:"select"
              },
              filename:"File Name",
              fullpath:"File Path",
              storagelocation:{
                name:"Storage Location",
                filter:"select"
              },
              size:{
                name:"Size (TB)", 
                filter:"minMax"
              },
              completed:{
                name:"Completed %",
                filter:"minMax"
              },
              deleted_since:"Deleted at",
              }],
          optionalcolumns:  [{
          }],
          columnclassname: [{
            "Type" : "filter-input-50", "Completed %" : "filter-input-50", "Size (TB)": "filter-input-50", 
            "Deleted at" : "filter-input-150","Storage Location" : "filter-input-125"
          }],
          defaultSortColumn: [{id: "File Name", desc: true}],
        }
       
        if (this.props.match.params.id) {
            this.state.taskId = this.props.match.params.id;
            this.state.taskType = 'blueprint';
        }
    }

    componentDidMount(){
        this.getDataProduct(this.state.taskId, this.state.taskType);
    }
    
    /*
    Fetch Data Product for the Task, data are getting like below
    */
    async getDataProduct(id, type){
        // Task type = blueprint
          await TaskService.getTaskDetails(type, id).then(async taskBlueprint =>{
          let subTaskIds = taskBlueprint['subtasks_ids'];
          if(subTaskIds){
            let dataproducts = [];
            for(const id of subTaskIds){
              let storageLocation = '';
              await DataProductService.getSubtask(id).then( subtask =>{
                storageLocation = subtask.data.cluster_value;
              })
              //Fetch data product for Input Subtask and Output Subtask
              await DataProductService.getSubtaskInputDataproduct(id).then(async inputdata =>{
                for(const dataproduct of inputdata.data){
                  dataproduct['type'] = 'Input';
                  dataproduct['size'] = UnitConverter.getUIResourceUnit('bytes', dataproduct['size']);
                  dataproduct['fullpath'] = dataproduct['directory'];
                  dataproduct['storagelocation'] = storageLocation;
                  dataproducts.push(dataproduct);
                }
              }).then(
                await  DataProductService.getSubtaskOutputDataproduct(id).then(outputdata =>{
                  for(const dataproduct of outputdata){
                    dataproduct['type'] = 'Output';
                    dataproduct['size'] = UnitConverter.getUIResourceUnit('bytes', dataproduct['size']);
                    dataproduct['fullpath'] = dataproduct['directory'];
                    dataproduct['storagelocation'] = storageLocation;
                    dataproducts.push(dataproduct);
                  }
              })
             )
            }
            this.setState({
              dataproduct: dataproducts,
              task: taskBlueprint,
              isLoading: false,
            }) 
             
          }
        })
      }

    render(){
      return(
            <React.Fragment>
              <div className="p-grid">
                    <div className="p-col-10 p-lg-10 p-md-10">
                        <h2> Data Product - {this.state.task &&
                              <Link to={ { pathname:`/task/view/blueprint/${this.state.taskId}`}}> {this.state.task.name}</Link>
                              }   </h2>
                    </div>
                    <div className="p-col-2">
                    {this.state.task &&
                      <Link to={{ pathname:`/task/view/blueprint/${this.state.taskId}`}} title="Close" 
                                  style={{float:'right'}}>
                          <i className="fa fa-times" style={{marginTop: "10px", marginLeft: '5px'}}></i>
                      </Link>
                    }
                </div>
                </div>
                
            {this.state.isLoading? <AppLoader /> :
               <React.Fragment> 
                   {(!this.state.dataproduct  ||  this.state.dataproduct.length === 0) &&
                      <div > No data found!</div>
                    }
                    {this.state.dataproduct.length>0 &&
                      <ViewTable 
                          data={this.state.dataproduct} 
                          defaultcolumns={this.state.defaultcolumns} 
                          optionalcolumns={this.state.optionalcolumns}
                          columnclassname={this.state.columnclassname}
                          defaultSortColumn={this.state.defaultSortColumn}
                          showaction="false"
                          keyaccessor="id"
                          paths={this.state.paths}
                          defaultpagesize={this.state.dataproduct.length}
                          unittest={this.state.unittest}
                      />
                    }  
                </React.Fragment>

            }
            </React.Fragment>
        )
    }
}
 