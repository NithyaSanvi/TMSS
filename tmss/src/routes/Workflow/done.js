import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Done extends Component {
render(){
    return(
        
<>
<div className="p-fluid">

<label>This scheduling unit has been fully handled. No further action is required.</label>

<label>Please find the data in the Long Term Archive https://lta.lofar.eu/ if it was ingested or revisit the Quality Assessment report <Link onClick={this.props.reportingPage}>QA Reporting</Link></label>
</div>
</>
    )
};
}
export default Done