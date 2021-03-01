import React, { Component } from 'react';
import {Calendar} from 'primereact/calendar';
import moment from 'moment';
import UIConstants from '../../utils/ui.constants';

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
    this.setState({
      date:parentCellData
    })
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
    return (
         <Calendar
              d dateFormat = {UIConstants.CALENDAR_DATE_FORMAT}
              value= {this.state.date}
              onChange= {e => {this.updateDateChanges(e)}}
              onBlur= {e => {this.updateDateChanges(e)}}
              //data-testid="start"
              showTime= {true}
              showSeconds= {true}
              hourFormat= "24"
              showIcon= {false} inline
          />
        );
  }


  updateDateChanges(e){
    if(e.value){
      this.setState({date : e.value});
    }
  }

  ondatechange(e){
    this.setState({date : e.value}); 
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