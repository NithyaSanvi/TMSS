import React, {Component} from 'react';
import { Redirect } from 'react-router-dom/cjs/react-router-dom.min';
import moment from 'moment';
import _ from 'lodash';

// import SplitPane, { Pane }  from 'react-split-pane';

import AppLoader from '../../layout/components/AppLoader';
import PageHeader from '../../layout/components/PageHeader';
import Timeline from '../../components/Timeline';
import ViewTable from '../../components/ViewTable';

import ProjectService from '../../services/project.service';
import ScheduleService from '../../services/schedule.service';
import UtilService from '../../services/util.service';

import UnitConverter from '../../utils/unit.converter';

// Color constant for status
const STATUS_COLORS = { "ERROR": "FF0000", "CANCELLED": "#00FF00", "DEFINED": "#00BCD4", 
                        "SCHEDULABLE":"#0000FF", "SCHEDULED": "#abc", "OBSERVING": "#bcd",
                        "OBSERVED": "#cde", "PROCESSING": "#cddc39", "PROCESSED": "#fed",
                        "INGESTING": "#edc", "FINISHED": "#47d53d"};

/**
 * Scheduling Unit timeline view component to view SU List and timeline
 */
export class TimelineView extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            suBlueprints: [],       // Scheduling Unit Blueprints
            suDrafts: [],           // Scheduling Unit Drafts
            suBlueprintList: [],    // SU Blueprints filtered to view
            group:[],               // Timeline group from scheduling unit draft name
            items:[],               // Timeline items from scheduling unit blueprints grouped by scheduling unit draft
            isSUDetsVisible: false,
            canExtendSUList: true,
            canShrinkSUList: false,
            selectedItem: null
        }

        this.onItemClick = this.onItemClick.bind(this);
        this.closeSUDets = this.closeSUDets.bind(this);
        this.dateRangeCallback = this.dateRangeCallback.bind(this);
        this.resizeSUList = this.resizeSUList.bind(this);
    }

    async componentDidMount() {
        // Fetch all details from server and prepare data to pass to timeline and table components
        const promises = [  ProjectService.getProjectList(), 
                            ScheduleService.getSchedulingUnitBlueprint(),
                            ScheduleService.getSchedulingUnitDraft(),
                            ScheduleService.getSchedulingSets(),
                            UtilService.getUTC()] ;
        Promise.all(promises).then(responses => {
            const projects = responses[0];
            const suBlueprints = _.sortBy(responses[1].data.results, 'name');
            const suDrafts = responses[2].data.results;
            const suSets = responses[3]
            const group = [], items = [];
            const currentUTC = moment.utc(responses[4]);
            const defaultStartTime = currentUTC.clone().add(-24, 'hours');      // Default start time, this should be updated if default view is changed.
            const defaultEndTime = currentUTC.clone().add(24, 'hours');         // Default end time, this should be updated if default view is changed.
            let suList = [];
            for (const suDraft of suDrafts) {
                const suSet = suSets.find((suSet) => { return suDraft.scheduling_set_id===suSet.id});
                const project = projects.find((project) => { return suSet.project_id===project.name});
                if (suDraft.scheduling_unit_blueprints.length > 0) {
                    for (const suBlueprintId of suDraft.scheduling_unit_blueprints_ids) {
                        const suBlueprint = _.find(suBlueprints, {'id': suBlueprintId});
                        suBlueprint['actionpath'] = `/schedulingunit/view/blueprint/${suBlueprintId}`;
                        suBlueprint.suDraft = suDraft;
                        suBlueprint.project = project;
                        suBlueprint.suSet = suSet;
                        suBlueprint.durationInSec = suBlueprint.duration;
                        suBlueprint.duration = UnitConverter.getSecsToHHmmss(suBlueprint.duration);
                        // Select only blueprints with start_time and stop_time in the default time limit
                        if (suBlueprint.start_time && 
                            (moment.utc(suBlueprint.start_time).isBetween(defaultStartTime, defaultEndTime) ||
                             moment.utc(suBlueprint.stop_time).isBetween(defaultStartTime, defaultEndTime))) {
                            items.push(this.getTimelineItem(suBlueprint));
                            if (!_.find(group, {'id': suDraft.id})) {
                                group.push({'id': suDraft.id, title: suDraft.name});
                            }
                            suList.push(suBlueprint);
                        }
                    }
                }
            }

            this.setState({suBlueprints: suBlueprints, suDrafts: suDrafts, group: group, suSets: suSets,
                            projects: projects, suBlueprintList: suList, 
                            items: items, currentUTC: currentUTC, isLoading: false});
        });
    }

    /**
     * Function to get/prepare Item object to be passed to Timeline component
     * @param {Object} suBlueprint 
     */
    getTimelineItem(suBlueprint) {
        // Temporary for testing
        const diffOfCurrAndStart = moment().diff(moment(suBlueprint.stop_time), 'seconds');
        suBlueprint.status = diffOfCurrAndStart>=0?"FINISHED":"DEFINED";
        let item = { id: suBlueprint.id, 
            group: suBlueprint.suDraft.id,
            title: `${suBlueprint.project.name} - ${suBlueprint.suDraft.name} - ${(suBlueprint.durationInSec/3600).toFixed(2)}Hrs`,
            project: suBlueprint.project.name,
            name: suBlueprint.suDraft.name,
            duration: suBlueprint.durationInSec?`${(suBlueprint.durationInSec/3600).toFixed(2)}Hrs`:"",
            start_time: moment.utc(suBlueprint.start_time),
            end_time: moment.utc(suBlueprint.stop_time),
            bgColor: suBlueprint.status? STATUS_COLORS[suBlueprint.status.toUpperCase()]:"#2196f3",
            selectedBgColor: suBlueprint.status? STATUS_COLORS[suBlueprint.status.toUpperCase()]:"#2196f3"}; 
        return item;
    }

    /**
     * Callback function to pass to Timeline component for item click.
     * @param {Object} item 
     */
    onItemClick(item) {
        if (this.state.isSUDetsVisible && item.id===this.state.selectedItem.id) {
            this.closeSUDets();
        }   else {
            this.setState({selectedItem: item, isSUDetsVisible: true, canExtendSUList: false, canShrinkSUList:false});
        }
    }

    /**
     * Closes the SU details section
     */
    closeSUDets() {
        this.setState({isSUDetsVisible: false, canExtendSUList: true, canShrinkSUList: false});
    }

    /**
     * Callback function to pass to timeline component which is called on date range change to fetch new item and group records
     * @param {moment} startTime 
     * @param {moment} endTime 
     */
    dateRangeCallback(startTime, endTime) {
        let suBlueprintList = [], group=[], items = [];
        if (startTime && endTime) {
            for (const suBlueprint of this.state.suBlueprints) {
                if (moment.utc(suBlueprint.start_time).isBetween(startTime, endTime) 
                        || moment.utc(suBlueprint.stop_time).isBetween(startTime, endTime)) {
                    suBlueprintList.push(suBlueprint);
                    items.push(this.getTimelineItem(suBlueprint));
                    if (!_.find(group, {'id': suBlueprint.suDraft.id})) {
                        group.push({'id': suBlueprint.suDraft.id, title: suBlueprint.suDraft.name});
                    }
                } 
            }
        }   else {
            suBlueprintList = _.clone(this.state.suBlueprints);
            group = this.state.group;
            items = this.state.items;
        }
        this.setState({suBlueprintList: _.filter(suBlueprintList, (suBlueprint) => {return suBlueprint.start_time!=null})});
        // On range change close the Details pane
        this.closeSUDets();
        return {group: group, items: items};
    }

    /**
     * Function called to shrink or expand the SU list section width
     * @param {number} step - (-1) to shrink and (+1) to expand
     */
    resizeSUList(step) {
        let canExtendSUList = this.state.canExtendSUList;
        let canShrinkSUList = this.state.canShrinkSUList;
        if (step === 1) {
            // Can Extend when fully shrunk and still extendable
            canExtendSUList = (!canShrinkSUList && canExtendSUList)?true:false;
            canShrinkSUList = true;
        }   else {
            // Can Shrink when fully extended and still shrinkable
            canShrinkSUList = (canShrinkSUList && !canExtendSUList)?true:false;
            canExtendSUList = true;
        }
        this.setState({canExtendSUList: canExtendSUList, canShrinkSUList: canShrinkSUList});
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ {pathname: this.state.redirect} }></Redirect>
        }
        const isSUDetsVisible = this.state.isSUDetsVisible;
        const canExtendSUList = this.state.canExtendSUList;
        const canShrinkSUList = this.state.canShrinkSUList;
        return (
            <React.Fragment>
                <PageHeader location={this.props.location} title={'Scheduling Units - Timeline View'} />
                { this.state.isLoading ? <AppLoader /> :
                        <div className="p-grid">
                        {/* <SplitPane split="vertical" defaultSize={600} style={{height: 'auto'}} primary="second"> */}
                            {/* <div className={isSUDetsVisible || (canExtendSUList && !canShrinkSUList)?"resize-div-min col-lg-4 col-md-4 col-sm-12":((canExtendSUList && canShrinkSUList)?"resize-div-avg col-lg-5 col-md-5 col-sm-12":"resize-div-max col-lg-6 col-md-6 col-sm-12")}>
                                    <button className="p-link resize-btn" disabled={!this.state.canExtendSUList} 
                                        onClick={(e)=> { this.resizeSUList(1)}}>
                                        <i className="pi pi-step-forward"></i>
                                    </button>
                                    <button className="p-link resize-btn" disabled={!this.state.canShrinkSUList} 
                                            onClick={(e)=> { this.resizeSUList(-1)}}>
                                        <i className="pi pi-step-backward"></i>
                                    </button></div>  */}
                            {/* SU List Panel */}
                            <div className={isSUDetsVisible || (canExtendSUList && !canShrinkSUList)?"col-lg-4 col-md-4 col-sm-12":((canExtendSUList && canShrinkSUList)?"col-lg-5 col-md-5 col-sm-12":"col-lg-6 col-md-6 col-sm-12")}
                                 style={{position: "inherit", borderRight: "5px solid #efefef", paddingTop: "10px"}}>
                                <ViewTable 
                                    data={this.state.suBlueprintList} 
                                    defaultcolumns={[{name: "Name",
                                                        start_time:"Start Time", stop_time:"End Time"}]}
                                    optionalcolumns={[{description: "Description", duration:"Duration (HH:mm:ss)", actionpath: "actionpath"}]}
                                    columnclassname={[{"Start Time":"filter-input-50", "End Time":"filter-input-50",
                                                        "Duration (HH:mm:ss)" : "filter-input-50",}]}
                                    defaultSortColumn= {[{id: "Name", desc: false}]}
                                    showaction="true"
                                    tablename="timeline_scheduleunit_list"
                                    showTopTotal="false"
                                />
                            </div>
                            {/* Timeline Panel */}
                            <div className={isSUDetsVisible || (!canExtendSUList && canShrinkSUList)?"col-lg-6 col-md-6 col-sm-12":((canExtendSUList && canShrinkSUList)?"col-lg-7 col-md-7 col-sm-12":"col-lg-8 col-md-8 col-sm-12")}>
                                {/* Panel Resize buttons */}
                                <div className="resize-div">
                                    <button className="p-link resize-btn" disabled={!this.state.canShrinkSUList} 
                                            title="Shrink List/Expand Timeline"
                                            onClick={(e)=> { this.resizeSUList(-1)}}>
                                        <i className="pi pi-step-backward"></i>
                                    </button>
                                    <button className="p-link resize-btn" disabled={!this.state.canExtendSUList} 
                                            title="Expandd List/Shrink Timeline"
                                            onClick={(e)=> { this.resizeSUList(1)}}>
                                        <i className="pi pi-step-forward"></i>
                                    </button>
                                </div> 
                                <Timeline ref={(tl)=>{this.timeline=tl}} 
                                        group={this.state.group} 
                                        items={this.state.items}
                                        currentUTC={this.state.currentUTC}
                                        rowHeight={30} itemClickCallback={this.onItemClick}
                                        dateRangeCallback={this.dateRangeCallback}></Timeline>
                            </div>
                        {/* </SplitPane> */}
                            {/* Details Panel */}
                            {this.state.isSUDetsVisible &&
                                <div className="col-lg-2 col-md-2 col-sm-12" 
                                     style={{borderLeft: "1px solid #efefef", marginTop: "0px", backgroundColor: "#f2f2f2"}}>
                                    <div className="p-grid" style={{marginTop: '10px'}}>
                                        <h6 className="col-lg-10 col-sm-10">Details</h6>
                                        <button className="p-link" onClick={this.closeSUDets}><i className="fa fa-times"></i></button>
                                    
                                        <div className="col-12">
                                            {this.state.selectedItem.title}
                                        </div>

                                        <div className="col-12">Still In Development</div>
                                    </div>
                                </div>
                            }  
                        
                        </div>
                    
                }
            </React.Fragment>
        );
    }

}