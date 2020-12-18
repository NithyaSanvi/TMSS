import React, { Component } from 'react';
 
export default class BetweenRenderer extends Component {
  constructor(props) {
    super(props);
  }
 
  /**
    Show cell value in grid
   */
  render() {
    let row = this.props.agGridReact.props.rowData[this.props.node.rowIndex];
    let value =  row[this.props.colDef.field];
    return <> {value && 
                value
              }</>;
  }
}