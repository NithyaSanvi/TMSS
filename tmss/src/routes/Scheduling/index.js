import React, {Component} from 'react';
import SchedulingUnitList from './SchedulingUnitList';
import PageHeader from '../../layout/components/PageHeader';
import { TieredMenu } from 'primereact/tieredmenu';

export class Scheduling extends Component {
    constructor(props){
        super(props);
        this.state = {
            scheduleunit: [],
            schedule_unit_task: [] ,
            isLoading:false,
            redirect: ''
        };
        
        this.optionsMenu = React.createRef();
        this.menuOptions = [ {label:'Add Scheduling Set', icon: "fa fa-", command: () => {this.selectOptionMenu('Add-SU-Set') }}];

        this.showOptionMenu = this.showOptionMenu.bind(this);
        this.selectOptionMenu = this.selectOptionMenu.bind(this);
    }
   
    showOptionMenu(event) {
        this.optionsMenu.toggle(event);
    }

    async selectOptionMenu(menuName) {
        switch(menuName) {
            case 'Add-SU-Set': {
                await this.setState({redirect: `/schedulingset/schedulingunit/create`});
                break;
            }
            default: {
                break;
            }
        }
    }

    render() {
		   return (
            <>
                 <TieredMenu className="app-header-menu" model={this.menuOptions} popup ref={el => this.optionsMenu = el} />
                 <PageHeader location={this.props.location} title={'Scheduling Unit - List'}
                            actions={[
                                                               
                                {icon: 'fa fa-plus-square', title: 'Add New Scheduling Unit', 
                                        props: {pathname: '/schedulingunit/create'}},
                                        
                                {icon: 'fa fa-table', title: 'Add Scheduling Set', 
                                        props: {pathname: '/schedulingset/schedulingunit/create'}}]} />
                {this.state.scheduleunit && 
				<SchedulingUnitList /> }
		    </>
        );
    }
}

export default Scheduling;