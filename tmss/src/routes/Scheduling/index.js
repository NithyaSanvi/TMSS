import React, {Component} from 'react';
import SchedulingUnitList from './SchedulingUnitList'

export class Scheduling extends Component {
    constructor(props){
        super(props)
        this.state = {
            scheduleunit: [],
            schedule_unit_task: [] 
        }
    }
   
    render() {
        return (
            <>
                <h2>Scheduling Unit - List</h2>
                {this.state.scheduleunit &&
                    <SchedulingUnitList /> 
                }
            </>
        );
    }
}

export default Scheduling;