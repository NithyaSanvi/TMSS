import React, { Component } from 'react';
import { InputMask } from 'primereact/inputmask';
import Validator from  '../../utils/validator';

export default class DegreeInputMask extends Component {
  constructor(props) {
    super(props);
    this.callbackUpdateAngle = this.callbackUpdateAngle.bind(this);
  }

  callbackUpdateAngle(e) {
    let isValid = false;
    if(Validator.validateAngle(e.value)){
      e.originalEvent.target.style.backgroundColor = '';
      isValid = true;
    }else{
      e.originalEvent.target.style.backgroundColor = 'orange';
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
        <InputMask mask="99:99:99" value={this.props.value}
        placeholder="DD:mm:ss" 
        className="inputmask"
        onComplete={this.callbackUpdateAngle}
        autoFocus
        ref={input =>{this.input = input}} />
    );
  }
}