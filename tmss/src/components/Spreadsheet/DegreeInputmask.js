import React, { Component } from 'react';
import Validator from  '../../utils/validator';
import Cleave from 'cleave.js/react';

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
    if (Validator.validateAngle(e.target.value)) {
      e.target.style.backgroundColor = '';
      isValid = true;
    } else  {
      e.target.style.backgroundColor = BG_COLOR;
    }
    this.props.context.componentParent.updateAngle(
      this.props.node.rowIndex,this.props.colDef.field,e.target.value,false,isValid
    );
  }

  afterGuiAttached() {
    this.input.focus();
    this.input.select();
  }

  render() {
    return (
      <Cleave placeholder="Degree/Radian" value={this.props.value}
          title="Enter in dms or degrees or radians"
          className="inputmask" 
          htmlRef={(ref) => this.input = ref }
          onChange={this.callbackUpdateAngle} />
    );
  }
}