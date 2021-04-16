import React, { Component } from 'react';
 
export default class BeamformersRenderer extends Component {
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
        if(value && value['param_0']) {
            value = JSON.stringify(value['param_0']);
        } else {
            value = JSON.stringify(value);
        }
      
      return  <> 
                {value && 
                    value
                  }
              </>;
    }
}