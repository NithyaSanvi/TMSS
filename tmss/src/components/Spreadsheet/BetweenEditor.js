import React, { Component } from 'react';

import {Calendar} from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

import moment from 'moment';
import _ from 'lodash';
import UIConstants from '../../utils/ui.constants';

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export default class BetweenEditor extends Component {
  constructor(props) {
    super(props);
    this.tmpRowData = [];

    this.state = {
      showDialog: false,
      dialogTitle: '',
    };

    this.copyDateValue = this.copyDateValue.bind(this);
  }
  
  isPopup() {
    return true;
  }

  /**
   * Init the date value if exists
   */
  async componentDidMount(){
    let parentRows = this.props.agGridReact.props.rowData[this.props.node.rowIndex];
    let parentCellData = parentRows[this.props.colDef.field];
    this.tmpRowData = [];
    if(parentCellData){
      let cellDataArray = _.split(parentCellData, '|');
      await cellDataArray.forEach(dataVal =>{
        let line = {};
        let dataValue = _.split(dataVal, ',');
        line['from'] = (dataValue[0])? moment(dataValue[0]).toDate():'';
        line['until'] = ( dataValue[1])? moment(dataValue[1]).toDate():'';
        this.tmpRowData.push(line);
      });
    }
    if(this.tmpRowData.length>0){
      let row = this.tmpRowData[this.tmpRowData.length-1];
      if((row['from'] !== '' && row['from'] !== 'undefined') && (row['until'] !== '' && row['until'] !== 'undefined')){
        let line = {'from': '', 'until': ''};
        this.tmpRowData.push(line);
      }
    }else{
      let line = {'from': '', 'until': ''};
      this.tmpRowData.push(line);
    }
    
   await this.setState({
      rowData: this.tmpRowData,
      dialogTitle: (this.props.colDef.field === 'between') ? this.props.colDef.field : 'Not-Between',
      showDialog: true,
    });

  }

  /**
   * Call the function on click Esc or Close the dialog
   */
  async copyDateValue(){
      let consolidateDates = '';
      this.state.rowData.map(row =>{
          if((row['from'] !== '' && row['from'] !== 'undefined') && (row['until'] !== '' && row['until'] !== 'undefined')){
          consolidateDates += ((row['from'] !== '')?moment(row['from']).format(DATE_TIME_FORMAT):'' )+","+((row['until'] !== '')?moment(row['until']).format(DATE_TIME_FORMAT):'')+"|";
          }
      });
      await this.props.context.componentParent.updateTime(
          this.props.node.rowIndex,this.props.colDef.field, consolidateDates 
      );
      this.setState({ showDialog: false});
  }

  /*
  Set value in relevant field
  */
  updateDateChanges(rowIndex, field, e){
      let tmpRows = this.state.rowData;
      let row = tmpRows[rowIndex];
      row[field] = e.value;
      tmpRows[rowIndex] = row;
      if(this.state.rowData.length === rowIndex+1){
          let line = {'from': '', 'until': ''};
          tmpRows.push(line);
      }
      this.setState({
        rowData: tmpRows
      });
  }

  /*
    Remove the the row from dialog
  */
  removeInput(rowIndex){
      let tmpRows = this.state.rowData;
      delete tmpRows[rowIndex];
      this.setState({
         rowData: tmpRows
    } );
  }

render() {
  return (
    <>  
    {this.state.rowData && this.state.rowData.length > 0 &&
      <Dialog header={_.startCase(this.state.dialogTitle)} visible={this.state.showDialog} maximized={false}  
      onHide={() => {this.copyDateValue()}} inputId="confirm_dialog"
      footer={<div>
        <Button key="back" label="Close" onClick={() => {this.copyDateValue()}} />
        </div>
    } >
          <div className="ag-theme-balham" style={{ height: '500px', width: '600px', paddingLeft: '20px' }}>
            <div className="p-field p-grid" >
              <React.Fragment>
                <label key={'labelFrom'} className="col-lg-6 col-md-6 col-sm-12">From</label>
                <label key={'labelUntil'} className="col-lg-4 col-md-5 col-sm-12">Until</label>
                <label key={'labelRemove'} className="col-lg-2 col-md-2 col-sm-12">Remove</label>
              </React.Fragment>
            </div>
            {this.state.rowData.map((bdate, index) => (
                <React.Fragment key={index}>
                  <div className="p-field p-grid" >
                      <Calendar
                            d dateFormat="yy-mm-dd"
                            value= {this.state.rowData[index].from}
                            onChange= {e => {this.updateDateChanges(index, 'from', e)}}
                            onBlur= {e => {this.updateDateChanges(index, 'from', e)}}
                            showTime={true}
                            showSeconds={true}
                            hourFormat="24"
                            showIcon={true}
                        />
                        <Calendar
                            d dateFormat={UIConstants.CALENDAR_DATE_FORMAT}                           
                            value= {this.state.rowData[index].until}
                            onChange= {e => {this.updateDateChanges(index, 'until', e)}}
                          //  onBlur= {e => {this.updateDateChanges(index, 'until', e)}}
                            showTime={true}
                            showSeconds={true}
                            hourFormat="24"
                            showIcon={true}
                            style={{marginLeft:'60px'}}
                        />
                        {this.state.rowData.length !== (index+1) &&
                        <button className="p-link" style={{marginLeft: '6vw'}}  onClick={(e) => this.removeInput(index)} >
                              <i className="fa fa-trash pi-error"></i></button>
                              }
                    </div>
                    
                  </React.Fragment>
              ))}
        </div>
      </Dialog>
    }
   </>
  );
}
 
}