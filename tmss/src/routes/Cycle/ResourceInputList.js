import React, {Component} from 'react';
import {InputNumber} from 'primereact/inputnumber';

/**
 * Component to get input for Resource allocation while creating and editing Cycle
 */
export class ResourceInputList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            list: props.list,
            cycleQuota: props.cycleQuota
        }
        this.updateEnabled = this.props.list.length===0?true:false;
        this.onInputChange = this.onInputChange.bind(this);
    }

    shouldComponentUpdate() {
        return true;
    }

    onInputChange(field, event) {
        if (this.props.callback) {
            this.props.callback(field, event);
        }
    }

    removeInput(field) {
        if (this.props.removeInputCallback) {
            this.props.removeInputCallback(field);
        }
    }

    render(){
        return (
            <>
                {this.props.list.length>0 && this.props.list.map((item, index) => (
                    <React.Fragment key={index+10}>
                    <label key={'label1-'+ index} className="col-lg-2 col-md-2 col-sm-12">{item.name}</label>
                    <div key={'div1-'+ index} className="col-lg-3 col-md-3 col-sm-12">
                        <InputNumber key={'item1-'+ index} id={'item1-'+ index} name={'item1-'+ index}
                            suffix={` ${this.props.unitMap[item.quantity_value]?this.props.unitMap[item.quantity_value].display:''}`}
                            placeholder={` ${this.props.unitMap[item.quantity_value]?this.props.unitMap[item.quantity_value].display:item.name}`} min={0} useGrouping={false}
                            value={this.props.cycleQuota[item.name]} 
                            onChange={(e) => this.onInputChange(item.name, e)}
                            onBlur={(e) => this.onInputChange(item.name, e)}
                            style={{width:"90%", marginRight: "5px"}}
                        />
                        <button className="p-link" data-testid={`${item.name}-btn`} onClick={(e) => this.removeInput(item.name)}>
                            <i className="fa fa-trash pi-error"></i></button>
                    </div>
                    <div className="col-lg-1 col-md-1 col-sm-12"></div>
                    </React.Fragment>
                ))}
            </>
        );
    }
}