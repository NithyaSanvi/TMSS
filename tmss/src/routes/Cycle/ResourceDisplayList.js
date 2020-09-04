import React, {Component} from 'react';

/**
 * Component to get input for Resource allocation while creating and editing Cycle
 */
class ResourceDisplayList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cycleQuota: props.cycleQuota
        }
    }

    render(){
        return (
            <>
                {this.props.cycleQuota.length>0 && this.props.cycleQuota.map((item, index) => (
                    <React.Fragment key={index+10}>
                    <label key={'label1-'+ index} className="col-lg-3 col-md-3 col-sm-12">{item.resource.name}</label>
                    <span key={'div1-'+ index} className="col-lg-3 col-md-3 col-sm-12">
                        {item.value/(this.props.unitMap[item.resource.quantity_value]?this.props.unitMap[item.resource.quantity_value].conversionFactor:1)}
                        {` ${this.props.unitMap[item.resource.quantity_value]?this.props.unitMap[item.resource.quantity_value].display:''}`}
                    </span>
                    </React.Fragment>
                ))}
            </>
        );
    }
}

export default ResourceDisplayList;