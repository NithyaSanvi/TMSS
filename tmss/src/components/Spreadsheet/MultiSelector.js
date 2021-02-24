import React, { Component } from 'react';
import {MultiSelect} from 'primereact/multiselect';
import _ from 'lodash';

export default class SkySllector extends Component {
  constructor(props) {
    super(props);
          
    this.dailyOptions= [
      {name: 'require_day', value: 'require_day'},
      {name: 'require_night', value: 'require_night'},
      {name: 'avoid_twilight', value: 'avoid_twilight'}, 
    ];
    this.state= {
      daily: [],

    }
 
    this.callbackUpdateDailyCell = this.callbackUpdateDailyCell.bind(this);
  }

  async componentDidMount(){
    let selectedValues = this.props.data['daily'];
    if(selectedValues  && selectedValues.length>0){
      let tmpDailyValue = _.split(selectedValues, ",");
      await this.setState({
        daily: tmpDailyValue,
      });
    }
 
  }

  async callbackUpdateDailyCell(e) {
    this.setState({
      daily: e.value
    })
    let dailyValue = '';
    let selectedValues = e.value;
    await selectedValues.forEach( key =>{
      dailyValue += key+",";
    })
    dailyValue = _.trim(dailyValue)
    dailyValue = dailyValue.replace(/,([^,]*)$/, '' + '$1')   
  
    this.props.context.componentParent.updateCell(
      this.props.node.rowIndex,this.props.colDef.field,dailyValue
     );
     
  }
 
  afterGuiAttached(){
   // this.input.input.focus();
  }
  isPopup() {
    return true;
  }
  render() {
    return (
      <div className="col-sm-6">
        <MultiSelect  optionLabel="name"   value={this.state.daily} options={this.dailyOptions}
        optionValue="value" filter={true}
        onChange={this.callbackUpdateDailyCell}
        />
       </div>
    );
  }
}