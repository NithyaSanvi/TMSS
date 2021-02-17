import React, { Component } from 'react';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import Stations from '../../routes/Scheduling/Stations';

//import moment from 'moment';
import _ from 'lodash';

//const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export default class StationEditor extends Component {
  constructor(props) {
    super(props);
    this.tmpRowData = [];
    this.isDelete = false;
    this.showDelete = false;
    this.previousValue= '';
    this.doCancel = true;
    this.state = {
      schedulingUnit: {},
      showDialog: false,
      dialogTitle: 'Station Group',
      missingStationFieldsErrors: [],
      stationGroup: [],
      customSelectedStations: []     
    };
    this.formRules = {};
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
    if ( this.props.colDef.field.startsWith('gdef_')) {
        this.showDelete = true;
    }
    let rowSU = this.props.agGridReact.props.rowData[this.props.node.rowIndex];
    this.previousValue = rowSU[this.props.colDef.field];
 
    if(this.previousValue && this.previousValue.length >0){
      let stationGroups = _.split(this.previousValue,  "|");
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
    
async deleteStationGroup() {
    this.isDelete = true;
    this.setState({ showDialog: false});
}

async closeStationGroup() {
  this.isDelete = false;
  this.doCancel = false;
  this.setState({ showDialog: false});
}

async cancelStationGroup() {
  this.isDelete = false;
  this.doCancel = true;
  this.setState({ showDialog: false});
}

async updateStationGroup() {
    let stationValue = '';
    const station_groups = [];
    if (!this.isDelete) {
        if (!this.doCancel) {
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
                });
            }
        }   else {
            stationValue = this.previousValue;
        }
    }
  
    await this.props.context.componentParent.updateCell(
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
          validForm: !missingStationFieldsErrors
      });
  });
};

render() {
  return (
    <>  
      <Dialog header={_.startCase(this.state.dialogTitle)} visible={this.state.showDialog} maximized={false}  
      onHide={() => {this.updateStationGroup()}} inputId="confirm_dialog" className="stations_dialog"
      footer={<div>
                  {this.showDelete &&
                      <Button className="p-button-danger" icon="pi pi-trash" label="Clear All" onClick={() => {this.deleteStationGroup()}} />
                  }
                  <Button  label="OK" icon="pi pi-check"  onClick={() => {this.closeStationGroup()}}  disabled={!this.state.validForm} style={{width: '6em'}} />
                  <Button className="p-button-danger" icon="pi pi-times" label="Cancel" onClick={() => {this.cancelStationGroup()}} />
              </div>
    } >
          <div className="ag-theme-balham" style={{ height: '90%', width: '1000px', paddingLeft: '20px' }}>
          <Stations
              stationGroup={this.state.stationGroup}
              onUpdateStations={this.onUpdateStations.bind(this)}
              height={'30em'}
          />
        </div>
      </Dialog>
   </>
  );
}
 
}