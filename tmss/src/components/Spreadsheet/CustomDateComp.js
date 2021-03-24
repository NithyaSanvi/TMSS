import React, { Component } from 'react';
import Flatpickr from "react-flatpickr";
import {Calendar} from 'primereact/calendar';
import moment from 'moment';
import UIConstants from '../../utils/ui.constants';
import UtilService from '../../services/util.service';

import "flatpickr/dist/flatpickr.css";

//const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export default class CustomDateComp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      date: '',
    };
  }

  componentDidMount(){
    let parentRows = this.props.agGridReact.props.rowData[this.props.node.rowIndex];
    let parentCellData = parentRows[this.props.colDef.field];
    UtilService.getUTC()
    .then(systemTime => {
      this.setState({
        date:parentCellData,
        systemTime: moment.utc(systemTime)
      })
    });
  }

  isPopup() {
    return true;
  }
  
  isCancelAfterEnd(){
    let date = (this.state.date !== '' && this.state.date !== 'undefined')? moment(this.state.date).format(UIConstants.CALENDAR_DATETIME_FORMAT) :'';
    this.props.context.componentParent.updateTime(
      this.props.node.rowIndex,this.props.colDef.field, date
    );
  }

  render() {
    return this.state.systemTime?(
        <Flatpickr
            data-enable-time 
            options={{
                    "inline": true,
                    "enableSeconds": true,
                    "time_24hr": true,
                    "defaultDate": this.state.systemTime?this.state.systemTime.format(UIConstants.CALENDAR_DEFAULTDATE_FORMAT):"",
                    "defaultHour": this.state.systemTime?this.state.systemTime.hours():12,
                    "defaultMinute": this.state.systemTime?this.state.systemTime.minutes():0
                    }}
            value={this.state.date}
            onChange= {value => {this.updateDateChanges(value[0]?value[0]:this.state.date)}}
        />
    ):"";
  }


  updateDateChanges(e){  
    this.setState({date : e || ''});  
  }

  ondatechange(e){
    this.setState({date : e}); 
  }
   
  getDate() {
    return this.state.date;
  }

  setDate(date) {
    this.setState({ date });
    this.picker.setDate(date);
  }
 
  updateAndNotifyAgGrid(date) {
    this.setState(
      {
        date,
      },
      this.props.onDateChanged
    );
  }

   
  onDateChanged = (selectedDates) => {
    this.props.context.componentParent.updateTime(
      this.props.node.rowIndex,this.props.colDef.field,selectedDates[0]
    );
  };
}