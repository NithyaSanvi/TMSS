import React, { Component } from 'react';
 
export default class BetweenRenderer extends Component {
  constructor(props) {
    super(props);
  }
 
  /**
    Show cell value in grid
   */
  render() {
    let row = [];
    let value = '';
    if (this.props.colDef.field.startsWith('gdef_')) {
        row = this.props.agGridReact.props.context.componentParent.state.commonRowData[0];
        value =  row[this.props.colDef.field];
    }
    else {
        row = this.props.agGridReact.props.rowData[this.props.node.rowIndex];
        value =  row[this.props.colDef.field];
    }
   // let row = this.props.agGridReact.props.rowData[this.props.node.rowIndex];
   // let value =  row[this.props.colDef.field];
    return  <> 
                {value && 
                    value
                }
            </>;
  }
}