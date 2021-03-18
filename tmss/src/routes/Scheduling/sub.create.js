import React, {Component} from "react";
import _ from 'lodash';
import { appGrowl } from '../../layout/components/AppGrowl';
import { CustomPageSpinner } from "../../components/CustomPageSpinner";
import { CustomDialog } from "../../layout/components/CustomDialog";
import ScheduleService from "../../services/schedule.service";

export default class SUBCreator extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dialog: {header: 'Confirm', detail: 'Do you want to create blueprints for the selected drafts?'},
        };
        this.suList = [];
        this.bluePrintSelected = false;
        this.checkAndCreateBlueprint = this.checkAndCreateBlueprint.bind(this);
        this.checkBlueprint = this.checkBlueprint.bind(this);
        this.createBlueprintTree = this.createBlueprintTree.bind(this);
        this.createBlueprintTreeNewOnly = this.createBlueprintTreeNewOnly.bind(this);
        this.warningContent = this.warningContent.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
    }

    /**
     * Subcomponet to display in the confirmation dialog.
     */
    warningContent() {
        const suListWithBlueprint = this.state.schedulingUnitsWithBlueprint;
        const suListWithoutBlueprint = _.difference(this.suList.selectedRows, suListWithBlueprint);
        return (
            <>
                {suListWithBlueprint && suListWithBlueprint.length>0 && 
                <div>
                    <hr></hr>
                    <span>Blueprint(s) already exist for the following Scheduling Units. If you want to create a blueprint for all of them click “Yes”. If you want to create a blue print for a subset click “No” to change your selection.</span>
                    <div className="p-grid" key={`dlg-msg-head`} style={{marginTop: '10px'}}>
                        <label className="col-lg-3">ID</label>
                        <label className="col-lg-9">Name</label>
                    </div>
                    {suListWithBlueprint.map((schedulingUnit, index) => (
                        <div className="p-grid" key={`dlg-msg-${index}`} style={{marginBottom: "5px"}}>
                            <span className="col-lg-3">{schedulingUnit.id}</span>
                            <span className="col-lg-9">{schedulingUnit.name}</span>
                        </div>
                    ))}
                </div>
                }
                {suListWithoutBlueprint && suListWithoutBlueprint.length>0 && 
                <div>
                    <hr></hr>
                    <span>Selected Scheduling Unit drafts without blueprint are listed below.</span>
                    <div className="p-grid" key={`dlg-msg-head`} style={{marginTop: '10px'}}>
                        <label className="col-lg-3">ID</label>
                        <label className="col-lg-9">Name</label>
                    </div>
                    {suListWithoutBlueprint.map((schedulingUnit, index) => (
                        <div className="p-grid" key={`dlg-msg-${index}`} style={{marginBottom: "5px"}}>
                            <span className="col-lg-3">{schedulingUnit.id}</span>
                            <span className="col-lg-9">{schedulingUnit.name}</span>
                        </div>
                    ))}
                    {suListWithBlueprint && suListWithBlueprint.length>0 && 
                        <span>If you want to create blueprints for only drafts without blueprints, click 'Create Only New'</span>
                    }
                </div>
                }
                
            </>
        );
    }

    checkBlueprint(suList, hasBlueprint) {
        if (hasBlueprint) {
            this.bluePrintSelected = true;
        }   else {
            this.bluePrintSelected = false;
        }
        this.checkAndCreateBlueprint(_.cloneDeep(suList));
    }

    /**
     * Function to check if blueprint already exist for the selected Scheduling Units and propmt contfirmation dialog.
     * When confirmed will create new blueprints for the selected Scheduling Units.
     */
    checkAndCreateBlueprint(suList) {
        this.suList = suList;
       // if(this.bluePrintSelected) {
            this.suList.selectedRows = _.filter(this.suList.selectedRows, (schedulingUnit) => { return schedulingUnit.type.toLowerCase() === "draft"});
       // } 
       
        if (suList.selectedRows && suList.selectedRows.length>0) {
            let dialog = this.state.dialog;
            dialog.showIcon = true;
            if (this.bluePrintSelected) {
                dialog.detail = "Selected Blueprint(s) are ignored. Do you want to create blueprint for selected drafts?";
            }   else {
                dialog.detail = "Do you want to create blueprints for the selected drafts?";
            }
            dialog.content = this.warningContent;
            const schedulingUnitsWithBlueprint = _.filter(suList.selectedRows, schedulingUnit=> { return schedulingUnit.scheduling_unit_blueprints && schedulingUnit.scheduling_unit_blueprints.length>0});
            dialog.actions = [ {id:"yes", title: 'Yes', callback: this.createBlueprintTree},
                                {id:"no", title: 'No', callback: this.closeDialog} ]
            /* Add this action only when both new and old drafts are selected */
            if (schedulingUnitsWithBlueprint.length > 0 && suList.selectedRows.length>schedulingUnitsWithBlueprint.length) {
                dialog.actions.unshift({id:"newOnly", title: 'Create Only New', callback: this.createBlueprintTreeNewOnly});
            }
            this.setState({dialogVisible: true, dialog: dialog, schedulingUnitsWithBlueprint: _.sortBy(schedulingUnitsWithBlueprint,['id'])});
        }   else {
            appGrowl.show({severity: 'info', summary: 'Select Row', detail: 'Please select one or more Scheduling Unit Draft(s)'});
        }
    }

    /**
     * Callback function from dialog to create blueprints for only new drafts without blueprints.
     * @param {Event} event 
     */
    createBlueprintTreeNewOnly(event){
        this.createBlueprintTree(event, true);
    }

    /**
     * Function to create actual blueprints for the selected drafts
     * @param {Event} event 
     * @param {Boolean} excludeOld 
     */
    async createBlueprintTree(event, excludeOld) {
        this.setState({dialogVisible: false, showSpinner: true});
        let selectedRows = this.suList.selectedRows;
        // Remove old drafts from selected rows
        if (excludeOld) {
            selectedRows = _.difference(selectedRows, this.state.schedulingUnitsWithBlueprint);
        }
        for (const schedulingUnit of selectedRows) {
            await ScheduleService.createSchedulingUnitBlueprintTree(schedulingUnit.id);
        }
        this.setState({showSpinner: false, schedulingUnitsWithBlueprint:null});
        appGrowl.show({severity: 'success', summary: 'Success', detail: 'Blueprint(s) created successfully!'});
        this.suList.reloadData();
    }

    /**
     * Callback function to close the dialog.
     */
    closeDialog() {
        this.setState({dialogVisible: false});
    }
   
    render() {
        return (
            <>
            {/* Dialog component to show messages and get confirmation */}
            <CustomDialog type="confirmation" visible={this.state.dialogVisible} width="40vw"
                    header={this.state.dialog.header} message={this.state.dialog.detail} content={this.state.dialog.content}
                    onClose={this.closeDialog} onCancel={this.closeDialog} onSubmit={this.createBlueprintTree}
                    actions={this.state.dialog.actions}></CustomDialog>
            {/* Show spinner during backend API call */}
            <CustomPageSpinner visible={this.state.showSpinner} />
            </>
        );
    }
}