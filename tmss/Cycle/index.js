import React, {Component} from 'react';

import CycleList from './CycleList'

export class Cycle extends Component {
    constructor(props){
      super(props)
      this.state = {
         cyclelist: []
       
}
    }
   
    render() {
        return (
            <>
                <h2>Cycle List</h2>
				<CycleList/>
                
            </>
        );
    }
}

export default Cycle;