import React, { Component } from 'react';
import { InputMask } from 'primereact/inputmask';
import Validator from  '../../utils/validator';

const BG_COLOR= '#f878788f';

export default class TimeInputMask extends Component {
  constructor(props) {
    super(props);
    this.callbackUpdateAngle = this.callbackUpdateAngle.bind(this);
  }

  callbackUpdateAngle(e) {
    let isValid = false;
    if(Validator.validateTime(e.value)){
      e.originalEvent.target.style.backgroundColor = '';
      isValid = true;
    }else{
      e.originalEvent.target.style.backgroundColor = BG_COLOR;
    }
    
    this.props.context.componentParent.updateAngle(
      this.props.node.rowIndex,this.props.colDef.field,e.value,false,isValid
    );
    
  }
 
  afterGuiAttached(){
    this.input.input.focus();
  }
 
  render() {
    return (
        <InputMask 
          value={this.props.value}
          mask="99:99:99" 
          placeholder="HH:mm:ss" 
          className="inputmask" 
          onComplete={this.callbackUpdateAngle}
          ref={input =>{this.input = input}}
         />
    );
  }
}