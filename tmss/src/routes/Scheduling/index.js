import React, {Component} from 'react';
import { TieredMenu } from 'primereact/tieredmenu';
//import { Growl } from 'primereact/components/growl/Growl';
import _ from 'lodash';
import SchedulingUnitList from './SchedulingUnitList';
import PageHeader from '../../layout/components/PageHeader';
import SUBCreator from './sub.create';
import { appGrowl } from '../../layout/components/AppGrowl';
export class Scheduling extends Component {
    constructor(props){
        super(props);
        this.state = {
            scheduleunit: [],
            schedule_unit_task: [] ,
            isLoading:false,
            redirect: '',
            dialog: {header: 'Confirm', detail: 'Do you want to create blueprints for the selected drafts?'},
            dialogVisible: false
        };
        
        this.optionsMenu = React.createRef();
        this.menuOptions = [ {label:'Add Scheduling Set', icon: "fa fa-", command: () => {this.selectOptionMenu('Add-SU-Set') }}];
        this.checkAndCreateSUB = this.checkAndCreateSUB.bind(this);
        this.showOptionMenu = this.showOptionMenu.bind(this);
        this.selectOptionMenu = this.selectOptionMenu.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
    }
   
    /**
     * Callback function to close the dialog prompted.
     */
    closeDialog() {
        this.setState({dialogVisible: false});
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
    checkAndCreateSUB() {
        if (this.suList.selectedRows.length > 0) {
            const suBlueprintList = _.filter(this.suList.selectedRows, (schedulingUnit) => { return schedulingUnit.type.toLowerCase() === "blueprint"});
            const suDraftsList = _.filter(this.suList.selectedRows, (schedulingUnit) => { return schedulingUnit.type.toLowerCase() === "draft"});
            const hasDrafts = suDraftsList.length > 0 ? true : false;
            const hasBlueprint = suBlueprintList.length > 0 ? true : false;
            if (hasBlueprint && !hasDrafts) {
                appGrowl.show({severity: 'info', summary: 'Select Row', detail: 'Please select one or more Scheduling Unit Draft(s)'});
            }   else if (hasBlueprint && hasDrafts) {
                this.subCreator.checkBlueprint(this.suList, true);
            } else {
                this.subCreator.checkBlueprint(this.suList, false);
            }
        }   else {
            appGrowl.show({severity: 'info', summary: 'Select Row', detail: 'Please select one or more Scheduling Unit Draft(s)'});
        }
    }

    render() {
		   return (
            <>
                <TieredMenu className="app-header-menu" model={this.menuOptions} popup ref={el => this.optionsMenu = el} />
                <PageHeader location={this.props.location} title={'Scheduling Unit - List'}
                            actions={[
                                {icon:'fa-stamp', title: 'Create Blueprint', type:'button',
                                        actOn:'click', props : { callback: this.checkAndCreateSUB}},
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