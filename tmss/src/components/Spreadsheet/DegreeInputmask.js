import React, { Component } from 'react';
import { InputMask } from 'primereact/inputmask';
import Validator from  '../../utils/validator';

const BG_COLOR= '#f878788f';

export default class DegreeInputMask extends Component {
  constructor(props) {
    super(props);
    this.callbackUpdateAngle = this.callbackUpdateAngle.bind(this);
  }

  /**
   * Update Angle value 
   * @param {*} e 
   */
  callbackUpdateAngle(e) {
    let isValid = false;
    if(Validator.validateAngle(e.value)){
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
        <InputMask mask="99:99:99.9999" value={this.props.value}
        placeholder="DD:mm:ss.ssss" 
        className="inputmask"
        onComplete={this.callbackUpdateAngle}
        autoFocus
        ref={input =>{this.input = input}} />
    );
  }
}