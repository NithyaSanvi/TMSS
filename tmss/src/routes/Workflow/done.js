import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Done extends Component {
render(){
return(        
<>
<div className="p-fluid">

<label htmlFor="addline"  style={{paddingLeft:"2px"},{color:"black"}}>This scheduling unit has been fully handled. No further action is required.</label><br/>

<label htmlFor="addline"  style={{paddingLeft:"2px"},{color:"black"}}>Please find the data in the Long Term Archive<a rel="noopener noreferrer" href= "https://lta.lofar.eu/" target="_blank"> https://lta.lofar.eu/ </a>if it was ingested or revisit the Quality Assessment report <Link onClick={this.props.reportingPage}>QA Reporting</Link></label>
</div>
</>
 )
};
}
export default Done