import React, {Component} from 'react';
import SchedulingUnitList from './SchedulingUnitList';
import PageHeader from '../../layout/components/PageHeader';

export class Scheduling extends Component {
    constructor(props){
        super(props)
        this.state = {
            scheduleunit: [],
            schedule_unit_task: [] ,
			isLoading:false
        }
    }
   
    render() {
		   return (
            <>
                <PageHeader location={this.props.location} title={'Scheduling Unit - List'}
                            actions={[{icon: 'fa fa-plus-square', title: 'Add New Scheduling Unit', 
                                        props: {pathname: '/schedulingunit/create'}}]} />
                {this.state.scheduleunit && 
				<SchedulingUnitList /> }
		    </>
        );
    }
}

export default Scheduling;