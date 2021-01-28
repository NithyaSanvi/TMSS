import React, { Component } from 'react';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import Stations from '../../routes/Scheduling/Stations';

import moment from 'moment';
import _ from 'lodash';

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export default class StationEditor extends Component {
  constructor(props) {
    super(props);
    this.tmpRowData = [];

    this.state = {
      schedulingUnit: {},
      showDialog: false,
      dialogTitle: 'Station Group',
      missingStationFieldsErrors: [],
      stationGroup: [],
      customSelectedStations: []     
    };
    this.formRules = {                 
      name: {required: true, message: "Name can not be empty"},
      description: {required: true, message: "Description can not be empty"},
  };
  }
  
  isPopup() {
    return true;
  }

  /**
   * Init the date value if exists
   */
  async componentDidMount(){
    let tmpStationGroups = [];
    let tmpStationGroup = {};
     
    let rowSU = this.props.agGridReact.props.rowData[this.props.node.rowIndex];
    let sgCellValue = rowSU[this.props.colDef.field];
 
    if(sgCellValue && sgCellValue.length >0){
      let stationGroups = _.split(sgCellValue,  "|");
      stationGroups.map(stationGroup =>{
        tmpStationGroup = {};
        let sgValue = _.split(stationGroup, ":");
        if(sgValue && sgValue[0].length>0){
          let stationArray = _.split(sgValue[0], ",");
           
          tmpStationGroup['stations'] = stationArray;
          tmpStationGroup['max_nr_missing'] = sgValue[1];
          tmpStationGroups.push(tmpStationGroup);
        }
        
      })
      this.setState({
        stationGroup: tmpStationGroups,
        showDialog: true
      });
    }else{
      let defaultSGs = this.props.context.componentParent.state.defaultStationGroups;
      if(defaultSGs){
        this.setState({
          stationGroup: defaultSGs,
          selectedStations: defaultSGs,
          showDialog: true
        });
      }
    }
  }
    
validateForm(fieldName) {
  let validForm = false;
  let errors = this.state.errors;
  let validFields = this.state.validFields;
  if (fieldName) {
      delete errors[fieldName];
      delete validFields[fieldName];
      if (this.formRules[fieldName]) {
          const rule = this.formRules[fieldName];
          const fieldValue = this.state.schedulingUnit[fieldName];
          if (rule.required) {
              if (!fieldValue) {
                  errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
              }   else {
                  validFields[fieldName] = true;
              }
          }
      }
  }   else {
      errors = {};
      validFields = {};
      for (const fieldName in this.formRules) {
          const rule = this.formRules[fieldName];
          const fieldValue = this.state.schedulingUnit[fieldName];
          if (rule.required) {
              if (!fieldValue) {
                  errors[fieldName] = rule.message?rule.message:`${fieldName} is required`;
              }   else {
                  validFields[fieldName] = true;
              }
          }
      }
  }
  this.setState({errors: errors, validFields: validFields});
  if (Object.keys(validFields).length === Object.keys(this.formRules).length) {
      validForm = true;
  }
  return validForm && !this.state.missingStationFieldsErrors;
}

async updateStationGroup(){
  let stationValue = '';
  const station_groups = [];
  (this.state.selectedStations || []).forEach(key => {
      let station_group = {};
      const stations = this.state[key] ? this.state[key].stations : [];
      const max_nr_missing = parseInt(this.state[key] ? this.state[key].missing_StationFields : 0);
      station_group = {
          stations,
          max_nr_missing
      };  
      station_groups.push(station_group);                 
  });
  this.state.customSelectedStations.forEach(station => {
      station_groups.push({
          stations: station.stations,
          max_nr_missing: parseInt(station.max_nr_missing)
      });
  });
  if(station_groups){
    station_groups.map(stationGroup =>{
        stationValue += stationGroup.stations+':'+stationGroup.max_nr_missing+"|";
    })
  }
  await this.props.context.componentParent.updateDailyCell(
    this.props.node.rowIndex,this.props.colDef.field, stationValue 
  );
  this.setState({ showDialog: false});
   
}

onUpdateStations = (state, selectedStations, missingStationFieldsErrors, customSelectedStations) => {
  this.setState({
      ...state,
      selectedStations,
      missingStationFieldsErrors,
      customSelectedStations
  }, () => {
      this.setState({
          validForm: this.validateForm()
      });
  });
};

render() {
  return (
    <>  
    
      <Dialog header={_.startCase(this.state.dialogTitle)} visible={this.state.showDialog} maximized={false}  
      onHide={() => {this.updateStationGroup()}} inputId="confirm_dialog"
      footer={<div>
        <Button key="back" label="Close" onClick={() => {this.updateStationGroup()}} />
        </div>
    } >
          <div className="ag-theme-balham" style={{ height: '90%', width: '1000px', paddingLeft: '20px' }}>
          <Stations
              stationGroup={this.state.stationGroup}
              onUpdateStations={this.onUpdateStations.bind(this)}
          />
        </div>
      </Dialog>
    
   </>
  );
}
 
}