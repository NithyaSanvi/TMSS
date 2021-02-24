import React, { Component } from 'react';
import {MultiSelect} from 'primereact/multiselect';
import _ from 'lodash';

export default class SkySllector extends Component {
  constructor(props) {
    super(props);
          
    this.dailyOptions= [];
    this.state= {
      daily: [],
      dailyOptions: [],
    }
    this.callbackUpdateDailyCell = this.callbackUpdateDailyCell.bind(this);
  }

  async componentDidMount(){
    let selectedValues = null;
    if (this.props.colDef.field.startsWith('gdef_')) {
        selectedValues = this.props.data['gdef_daily'];
    }
    else {
        selectedValues = this.props.data['daily'];
    }
    let tmpDailyValue = [];
    if(selectedValues  && selectedValues.length>0){
        tmpDailyValue = _.split(selectedValues, ",");
    }
    await this.setState({
      daily: tmpDailyValue,
      dailyOptions: this.props.context.componentParent.state.dailyOption
    });
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
            {this.state.dailyOptions.length > 0 && 
                <MultiSelect  optionLabel="name"   value={this.state.daily} options={this.state.dailyOptions}
                optionValue="value" filter={true}
                onChange={this.callbackUpdateDailyCell}
                />
            }
        </div>
    );
  }
}