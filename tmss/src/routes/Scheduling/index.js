import React, {Component} from 'react';

import { TieredMenu } from 'primereact/tieredmenu';
import { Growl } from 'primereact/components/growl/Growl';

import SchedulingUnitList from './SchedulingUnitList';
import PageHeader from '../../layout/components/PageHeader';
import SUBCreator from './sub.create';

export class Scheduling extends Component {
    constructor(props){
        super(props);
        this.state = {
            scheduleunit: [],
            schedule_unit_task: [] ,
            isLoading:false,
            redirect: '',
            dialog: {header: 'Confirm', detail: 'Do you want to create blueprints for the selected drafts?'},
        };
        
        this.optionsMenu = React.createRef();
        this.menuOptions = [ {label:'Add Scheduling Set', icon: "fa fa-", command: () => {this.selectOptionMenu('Add-SU-Set') }}];
        this.createSUB = this.createSUB.bind(this);
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

    /**
     * Function to call the SUBCreator component's function to check and create SUBs
     */
    createSUB() {
        this.subCreator.checkAndCreateBlueprint(this.suList);
    }

    render() {
		   return (
            <>
                <Growl ref={(el) => this.growl = el} style={{paddingTop:"50px"}} />
                <TieredMenu className="app-header-menu" model={this.menuOptions} popup ref={el => this.optionsMenu = el} />
                <PageHeader location={this.props.location} title={'Scheduling Unit - List'}
                            actions={[
                                {icon:'fa-stamp', title: 'Create Blueprint', type:'button',
                                        actOn:'click', props : { callback: this.createSUB}},
                                {icon: 'fa fa-plus-square', title: 'Add New Scheduling Unit', 
                                        props: {pathname: '/schedulingunit/create'}},
                                        
                                {icon: 'fa fa-table', title: 'Add Scheduling Set', 
                                        props: {pathname: '/schedulingset/schedulingunit/create'}}]} />
                {this.state.scheduleunit && 
				<SchedulingUnitList allowRowSelection={true} ref={suList => {this.suList = suList}} /> }
                {/* Component that has functions to create Scheduling unit blueprint */}
                <SUBCreator ref={subCreator => {this.subCreator = subCreator}}/>
		    </>
        );
    }
}

export default Scheduling;