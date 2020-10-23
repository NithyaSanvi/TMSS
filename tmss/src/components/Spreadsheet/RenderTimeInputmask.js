import React, { Component } from 'react';
import { InputMask } from 'primereact/inputmask';
import Validator from  '../../utils/validator';

export default class RenderTimeInputmask extends Component{
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
      e.originalEvent.target.style.backgroundColor = 'orange';
    }
    
    this.props.context.componentParent.updateAngle(
      this.props.node.rowIndex,this.props.colDef.field,e.value,false,isValid
    );
    
  }

  /*
  isPopup(){}
  isCancelBeforeStart(){}

  focusIn(){}
  focusOut(){}
  destroy(){}
  */

  isCancelAfterEnd(){
   // console.log('params',  this.props);
    
   // return false;
  }
  afterGuiAttached(){
    //this.input.input.focus();
  }

  
  getValue(){
   // console.log(this.input.value)
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