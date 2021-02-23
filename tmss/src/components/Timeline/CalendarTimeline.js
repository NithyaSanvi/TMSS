import React, {Component} from 'react';
import Timeline, {
    TimelineMarkers,
    TimelineHeaders,
    SidebarHeader,
    DateHeader,
    CustomMarker,
    CursorMarker,
    // CustomHeader
  } from 'react-calendar-timeline';
import containerResizeDetector from 'react-calendar-timeline/lib/resize-detector/container';
import moment from 'moment';
import _ from 'lodash';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

import UtilService from '../../services/util.service';

import 'react-calendar-timeline/lib/Timeline.css';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import UIConstants from '../../utils/ui.constants';

// Label formats for day headers based on the interval label width
const DAY_HEADER_FORMATS = [{ name: "longer", minWidth: 300, maxWidth: 50000, format: "DD dddd, MMMM YYYY"},
                            { name: "long", minWidth: 135, maxWidth: 300, format: "DD-MMMM-YYYY"},
                            {name: "mediumLong", minWidth: 100, maxWidth: 135, format: "DD-MMM-YYYY"},
                            {name: "medium", minWidth: 75, maxWidth: 100, format: "DD-MMM-YY"},
                            {name: "short", minWidth: 50, maxWidth: 75, format: "DD-MMM"},
                            {name: "mini", minWidth: 10, maxWidth: 50, format: "DD"},
                            {name: "micro", minWidth: 10, maxWidth: 25, format: "DD"},
                            {name: "nano", minWidth: 0, maxWidth: 0, format: ""}];

//>>>>>> Constants for date/time formats, zoom level definition & defaults
const UTC_DATE_FORMAT = "YYYY-MM-DD";
const UTC_TIME_FORMAT = "HH:mm:ss";
const UTC_LST_KEY_FORMAT = "YYYY-MM-DDTHH:mm:00";
const UTC_LST_HOUR_FORMAT = "YYYY-MM-DDTHH:00:00";
const UTC_LST_DAY_FORMAT = "YYYY-MM-DDT00:00:00";
const ZOOM_LEVELS = [{name: '30 Minutes', value: 30 * 60},
                     {name: '1 Hour', value: 1 * 60 * 60},
                     {name: '3 Hours', value: 3 * 60 * 60},
                     {name: '6 Hours', value: 6 * 60 * 60},
                     {name: '12 Hour', value: 12 * 60 * 60},
                     {name: '1 Day', value: 24 * 60 * 60},
                     {name: '2 Days', value: 2 * 24 * 60 * 60},
                     {name: '3 Days', value: 3 * 24 * 60 * 60},
                     {name: '5 Days', value: 5 * 24 * 60 * 60},
                     {name: '1 Week', value: 7 * 24 * 60 * 60},
                     {name: '2 Weeks', value: 14 * 24  * 60 * 60},
                     {name: '4 Weeks', value: 28 * 24 * 60 * 60},
                     {name: 'Custom', value: 24 * 60 * 60}];
const DEFAULT_ZOOM_LEVEL = "2 Days";
const DEFAULT_GROUP = [{'id': 0, 'title': ''}]; // 1st row is added purposefully to show cursor labels
//<<<<<<

/**
 * Component to create a calendar timeline based out of react-calendar-timeline with UTC and LST date headers.
 */
export class CalendarTimeline extends Component {

    constructor(props) {
      super(props);
      let group = DEFAULT_GROUP;
      if (props.group) {
          group = group.concat(props.group);
      }
      const defaultZoomLevel = _.find(ZOOM_LEVELS, {name: DEFAULT_ZOOM_LEVEL});
      this.state = {
        defaultStartTime: props.startTime?props.startTime.clone():null || moment().utc().add(-1 * defaultZoomLevel.value/2, 'seconds'),
        defaultEndTime: props.endTime?props.endTime.clone():null || moment().utc().add(1 * defaultZoomLevel.value/2, 'seconds'),
        group: group,
        items: props.items || [],
        //>>>>>> Properties to pass to react-calendar-timeline component
        stackItems: props.stackItems || false,
        zoomAllowed: props.zoomAllowed || true,
        minZoom: props.minZoom || (1 * 60 * 1000),                  // One Minute
        maxZoom: props.maxZoom || (32 * 24 * 60 * 60 * 1000),       // 32 hours
        zoomLevel: props.zoomLevel || DEFAULT_ZOOM_LEVEL,
        isTimelineZoom: true,
        zoomRange: null,
        prevZoomRange: null,
        lineHeight: props.rowHeight || 50,                          // Row line height
        sidebarWidth: props.sidebarWidth || 200,
        timeSteps: props.timeSteps || {minute: 1},
        canMove: props.itemsMovable || false,
        canResize: props.itemsResizable || false,
        canchangeGroup: props.itemGroupChangeable || true,
        //<<<<<< Properties to pass to react-calendar-timeline component
        showCursor: props.showCursor || true,
        timeHeaderLabelVisibile: true,
        currentUTC: props.currentUTC || moment().utc(),             // Current UTC for clock display
        currentLST: null,                                           // Current LST for clock display
        cursorLST: moment().format('HH:mm:ss'),                     // Holds the LST value for the cursot position in the timeline
        lastCursorPosition: null,                                   // To track the last cursor position and fetch the data from server if changed
        utcLSTMap:{},                                               // JSON object to hold LST values fetched from server for UTC and show LST value in cursor label
        lstDateHeaderMap: {},                                       // JSON object to hold header value for the LST axis in required format like 'HH' or 'MM' or others
        lstDateHeaderUnit: 'hour',                                  // Unit to be considered for the LST axis header based on the visible duration
        isLSTDateHeaderLoading: true,
        dayHeaderVisible: true,                                     // To control the Day header visibility based on the zoom level
        weekHeaderVisible: false,                                   // To control the Week header visibility based on the zoom level
        allowLive: props.showLive===undefined?true:props.showLive,
        allowDateSelection: props.showDateRange===undefined?true:props.showDateRange,
        viewType: props.viewType || UIConstants.timeline.types.NORMAL,
        isLive: false
      }
      if (props.viewType && props.viewType===UIConstants.timeline.types.WEEKVIEW) {
        this.state.timelineStartDate = this.state.defaultStartTime.clone();
        this.state.timelineEndDate = this.state.defaultEndTime.clone();
      }
      this.itemClickCallback = props.itemClickCallback;             // Pass timeline item click event back to parent
      this.ZOOM_LEVELS = props.viewType===UIConstants.timeline.types.WEEKVIEW?
                            _.filter(ZOOM_LEVELS, (level => { return level.value<=24*60*60 && level.name!=="Custom"})):ZOOM_LEVELS;
      
      //>>>>>>> Override function of timeline component
      this.onZoom = this.onZoom.bind(this);                         
      this.onBoundsChange = this.onBoundsChange.bind(this);
      this.onTimeChange = this.onTimeChange.bind(this);
      //<<<<<< Override function of timeline component
      
      //>>>>>> Custom Renderer Functions
      this.renderSidebarHeader = this.renderSidebarHeader.bind(this);
      this.renderDayHeader = this.renderDayHeader.bind(this);
      this.renderUTCDateHeader = this.renderUTCDateHeader.bind(this);
      this.renderLSTDateHeader = this.renderLSTDateHeader.bind(this);
      this.renderCursor = this.renderCursor.bind(this);
      this.renderItem = this.renderItem.bind(this);
      this.renderNormalSuntimeHeader = this.renderNormalSuntimeHeader.bind(this);
      //<<<<<<< Custom Renderer Functions

      //>>>>>> Functions of this component
      this.setCurrentUTC = this.setCurrentUTC.bind(this);
      this.getLSTof = this.getLSTof.bind(this);
      this.onItemClick = this.onItemClick.bind(this);
      this.resetToCurrentTime = this.resetToCurrentTime.bind(this);
      this.moveLeft = this.moveLeft.bind(this);
      this.moveRight = this.moveRight.bind(this);
      this.zoomIn = this.zoomIn.bind(this);
      this.zoomOut = this.zoomOut.bind(this);
      this.setZoomRange = this.setZoomRange.bind(this);
      //<<<<<< Functions of this component
      
      //>>>>>> Public functions of the component
      this.updateTimeline = this.updateTimeline.bind(this);
      //<<<<<< Public functions of the component
    }

    componentDidMount() {
        const setCurrentUTC = this.setCurrentUTC;
        // Load LST date header values
        this.loadLSTDateHeaderMap(this.state.defaultStartTime, this.state.defaultEndTime, this.state.lstDateHeaderUnit);
        // Set initial UTC clock time from server
        setCurrentUTC(true);        
        // Update UTC clock periodically in sync with server
        setInterval(function(){setCurrentUTC(true)}, 60000);
        // Update UTC clock every second to keep the clock display live
        setInterval(function(){setCurrentUTC()}, 1000);
        if (this.state.viewType === UIConstants.timeline.types.WEEKVIEW) {
            this.addWeekSunTimes(this.state.defaultStartTime, this.state.defaultEndTime, this.state.group, this.state.items)
                .then(items => {
                    this.setState({items: items});
                });
        }
    }

    shouldComponentUpdate() {
        return true;
    }

    componentDidUpdate() {
        // console.log("Component Updated");
    }

    /**
     * Sets current UTC and LST time either from the server or locally.
     * @param {boolean} systemClock - to differetiate whether tosync with server or local update
     */
    setCurrentUTC(systemClock) {
        if(systemClock) {
            UtilService.getUTC()
                .then(async (utcString) => { 
                    const currentUTC = moment.utc(utcString);
                    this.setState({currentUTC: currentUTC});
                    let currentLST = await UtilService.getLST(utcString);
                    this.setState({currentLST: moment(currentUTC.format('DD-MMM-YYYY ') + currentLST.split('.')[0], 'DD-MMM-YYYY HH:mm:ss')})
                } );
        }   else {
            this.setState({currentUTC: this.state.currentUTC.add(1, 'second'), 
                            currentLST: this.state.currentLST?this.state.currentLST.add(1, 'second'):null});
        }
        if (this.state.isLive) {
            this.changeDateRange(this.state.defaultStartTime.add(1, 'second'), this.state.defaultEndTime.add(1, 'second'));
            // const result = this.props.dateRangeCallback(this.state.defaultStartTime.add(1, 'second'), this.state.defaultEndTime.add(1, 'second'));
            // let group = DEFAULT_GROUP.concat(result.group);
        }
    }

    /**
     * Loads LST header values from server and keeps in a state JSON object for respective UTC values in required format
     * @param {moment} startTime 
     * @param {moment} endTime 
     * @param {string} lstDateHeaderUnit 
     */
    async loadLSTDateHeaderMap(startTime, endTime, lstDateHeaderUnit) {
        // let lstDateHeaderMap = this.state.lstDateHeaderMap;
        let lstDateHeaderMap = {};
        // const lstDateHeaderUnit = this.state.lstDateHeaderUnit;
        const timeDiff = endTime.diff(startTime, lstDateHeaderUnit);
        const range = _.range(timeDiff);
        for (const value of range) {
            const colUTC = startTime.clone().add(value, lstDateHeaderUnit).utc();
            const formattedColUTC = colUTC.format(lstDateHeaderUnit==="hour"?UTC_LST_HOUR_FORMAT:UTC_LST_DAY_FORMAT);
            // if (!lstDateHeaderMap[formattedColUTC]) {
                const lst = await UtilService.getLST(formattedColUTC);
                const lstDate = moment(colUTC.format(`MM-DD-YYYY ${lst.split('.')[0]}`), 'MM-DD-YYYY HH:mm:ss').add(30, 'minutes');
                lstDateHeaderMap[formattedColUTC] = lstDateHeaderUnit==="hour"?lstDate.format('HH'):lstDate.format('DD');
            // }
        }
        this.setState({lstDateHeaderMap: lstDateHeaderMap, isLSTDateHeaderLoading: false});
    }

    /**
     * Gets the LST value for the UTC passed. 
     * If no value present in the state JSON object, fetches from the server and update the state object
     * @param {moment} utc 
     */
    getLSTof(utc) {
        utc = moment.utc(utc.format(UTC_LST_KEY_FORMAT));

        // Condition to reduce or avoid repeated server request as the request is sent asynchronously if multiple calls are there for same value
        if (!this.state.lastCursorPosition || this.state.lastCursorPosition.diff(utc, 'minutes')>0
                || this.state.lastCursorPosition.diff(utc, 'minutes')<0) {
            let utcLSTMap = this.state.utcLSTMap;
            const formattedUTC = utc.format(UTC_LST_KEY_FORMAT);
            if (utcLSTMap[formattedUTC]) {
                this.setState({lastCursorPosition:utc, cursorLST: utcLSTMap[formattedUTC]});
            }   else {
                if (_.keys(utcLSTMap).indexOf(formattedUTC)<0) {
                    UtilService.getLST(formattedUTC).then(lst => {
                        utcLSTMap[formattedUTC] = lst;
                        this.setState({utcLSTMap: utcLSTMap, lastCursorPosition:utc, cursorLST: lst}); 
                    });
                    utcLSTMap[formattedUTC] = null;
                    this.setState({utcLSTMap: utcLSTMap});
                }
            }
        }
    }

    /** Custom Left Side Bar Header Render function that is passed to the timeline component */
    renderSidebarHeader({ getRootProps }) {
        let monthDuration = "";
        const startMonth = this.state.defaultStartTime.format('MMM');
        const endMonth = this.state.defaultEndTime.format('MMM');
        if (startMonth !== endMonth) {
            monthDuration = `(${startMonth}-${endMonth})`;
        }
        return (<div {...getRootProps()} className="sidebar-header"
                    style={{width: `${this.state.sidebarWidth}px`}}>
                    <div className="sidebar-header-row">{this.state.viewType===UIConstants.timeline.types.NORMAL?
                                    (this.state.dayHeaderVisible?`Day${monthDuration}`:`Week${monthDuration}`)
                                    :`Week (${this.state.timelineStartDate.week()}) / Day`}</div> 
                    <div className="sidebar-header-row">{this.state.dayHeaderVisible?`UTC(Hr)`:`UTC(Day)`}</div>
                    <div className="sidebar-header-row">{this.state.dayHeaderVisible?`LST(Hr)`:`LST(Day)`}</div>
                    {/* {this.state.viewType === UIConstants.timeline.types.NORMAL &&  */}
                        <div className="p-grid legend-row" 
                            style={{height:this.props.showSunTimings?'0px':'0px'}}>
                            <div className="col-4 legend-suntime legend-sunrise">Sunrise</div>
                            <div className="col-4 legend-suntime legend-sunset">Sunset</div>
                            <div className="col-4 legend-suntime legend-night">Night</div>
                        </div>
                    {/* } */}
                </div>
        );
    }

    /**
     * Day header formatter based on the width of the header label
     * @param {moment} time 
     * @param {number} labelWidth 
     */
    formatDayHeader(time, labelWidth) {
        const dayFormat = _.find(DAY_HEADER_FORMATS, (format) => { return (format.minWidth<labelWidth && format.maxWidth>labelWidth);});
        return time.format(dayFormat?dayFormat.format:"DD-MM-YY");
    }

    /** Custom Render function for Day Header to pass to the DateHeader component of the Timeline compoent */
    renderDayHeader({ getIntervalProps, intervalContext, data }) {
        const currentZoomValue = _.find(ZOOM_LEVELS, {name: this.state.zoomLevel}).value;
        const intervalStartTime = intervalContext.interval.startTime.utc();
        const labelWidth = intervalContext.interval.labelWidth;
        let displayValue = "";

        // For zoom levels less than 1 day, header value is formatted and label width is re-calculated
        let intervals = 86400 / currentZoomValue;
        const formattedTime = intervalStartTime.format("HH");
        intervals = intervals < 1? 1: intervals;
        const newLabelWidth = labelWidth * 24 / intervals;
        displayValue = parseInt(formattedTime)%(24/intervals)===0?this.formatDayHeader(intervalStartTime, newLabelWidth):""
        let divStyle = getIntervalProps().style;
        if (displayValue) {
            divStyle.width = `${newLabelWidth}px`;
            divStyle.fontSize = newLabelWidth < 20?"12px":"14px";
            return (<div {...getIntervalProps()} className="rct-dateHeader" style={divStyle}>
                <span>
                    {displayValue}
                </span>
            </div>);
        }   else {
            return "";
        }
    }

    /** Custom Render function for DateHeader component to display UTC time/date values in the date header */
    renderUTCDateHeader({ getIntervalProps, intervalContext, data }) {
        let showBorder = true;
        let divStyle = getIntervalProps().style;
        const labelWidth = intervalContext.interval.labelWidth;
        let widthFactor = 1;
        let displayValue = "";

        // Display value decided based on the unit as per the zoom level
        if (this.state.lstDateHeaderUnit === "hour") {
            displayValue = intervalContext.interval.startTime.utc().format('HH');
            widthFactor = 24;
        }   else if (this.state.lstDateHeaderUnit === "day") {
            displayValue = intervalContext.interval.endTime.utc().format('DD');
            widthFactor = 30;
        }

        // >>>>>>*** This code should be updated with reduced lines or by creating separate function
        // Calculate width factor to adjust the label width based on the unit and interval length
        if (labelWidth < 1) {
            showBorder = false;             // If the linewidth is very less, don't display border. Instead show a marker line below the label
        }   else if (labelWidth < 2) {
            widthFactor = widthFactor/2;
            showBorder = false;
        }   else if (labelWidth < 4) {
            widthFactor = widthFactor/3;
        }   else if (labelWidth < 5) {
            widthFactor = widthFactor/4;
        }   else if (labelWidth < 5.5) {
            widthFactor = widthFactor/6;
        }   else if (labelWidth < 7) {
            widthFactor = widthFactor/8;
        }   else if (labelWidth < 12) {
            widthFactor = widthFactor/12;
        }   else {
            widthFactor = 1;
        }
        // <<<<<<*** This code should be updated with reduced lines or by creating separate function
        displayValue = parseInt(displayValue)%Math.floor(widthFactor)===0?displayValue:"";
        divStyle.fontSize = labelWidth>16?"14px":(labelWidth>12?"12px":(labelWidth>10?"10px":"10px"));
        divStyle.borderLeft = showBorder?divStyle.borderLeft:"0px dashed #bbb";
        
        if (displayValue) {
            divStyle.width = `${labelWidth * widthFactor}px`;
            return <div {...getIntervalProps()} className="rct-dateHeader" style={divStyle}>
                { (this.state.timeHeaderLabelVisibile)?
                    (showBorder)?
                        <span key={`utchead-${displayValue}`}>
                            {displayValue}
                        </span>:
                        <>
                            <span style={{height: '30px', lineHeight:'15px', textAlign: 'center', transform:(labelWidth<12?"rotate(0deg)":"")}}>
                            { displayValue}<br/>
                            <span style={{color: '#bbb'}}>{"|"}</span>
                            </span>
                        </>
                    :""}
            </div>
        }   else {
            return "";
        }
    }

    /** Custom Render function to be passed to DateHeader component to display LST values in date header */
    renderLSTDateHeader({ getIntervalProps, intervalContext, data }) {
        let showBorder = true;
        const utc = moment(intervalContext.interval.endTime).utc();
        // Decide the value to be displayed based on the unit set for the zoom level
        let lstDisplayValue = this.state.lstDateHeaderMap[utc.format(this.state.lstDateHeaderUnit === "hour"?UTC_LST_HOUR_FORMAT:UTC_LST_DAY_FORMAT)];
        let divStyle = getIntervalProps().style;
        const labelWidth = intervalContext.interval.labelWidth;
        let widthFactor = 1;
        if (this.state.lstDateHeaderUnit === "hour") {
            widthFactor = 24;
        }   else if (this.state.lstDateHeaderUnit === "day") {
            widthFactor = 30;
        }
        // >>>>>>*** This code should be updated with reduced lines or by creating separate function
        // Calculate width factor to adjust the label width based on the unit and interval length
        if (labelWidth < 1) {
            showBorder = false;
        }   else if (labelWidth < 2) {
            widthFactor = widthFactor/2;
            showBorder = false;
        }   else if (labelWidth < 4) {
            widthFactor = widthFactor/3;
        }   else if (labelWidth < 5) {
            widthFactor = widthFactor/4;
        }   else if (labelWidth < 5.5) {
            widthFactor = widthFactor/6;
        }   else if (labelWidth < 7) {
            widthFactor = widthFactor/8;
        }   else if (labelWidth < 12) {
            widthFactor = widthFactor/12;
        }   else {
            widthFactor = 1;
        }
        // <<<<<<*** This code should be updated with reduced lines or by creating separate function
        
        // Values to be displayed at regular intervals only
        if (widthFactor === 24) {
            lstDisplayValue = lstDisplayValue==="12"?lstDisplayValue:"";
        }   else if (widthFactor === 30) {
            lstDisplayValue = lstDisplayValue==="5"?lstDisplayValue:"";
        }   else {
            lstDisplayValue = parseInt(lstDisplayValue)%widthFactor===0?lstDisplayValue:"";
        }
        divStyle.fontSize = labelWidth>16?"14px":(labelWidth>12?"12px":(labelWidth>10?"10px":"10px"));
        divStyle.borderLeft = showBorder?divStyle.borderLeft:"0px dashed #bbb";
        if (lstDisplayValue) {
            divStyle.width = `${labelWidth * widthFactor}px`;
            return <div {...getIntervalProps()} className="rct-dateHeader" style={divStyle}>
                <span>
                    {/* {intervalContext.interval.startTime.format('HH')} */}
                    {lstDisplayValue}
                </span>
            </div>
        }   else {
            return "";
        }
    }

    /** Custom renderer to show sunrise, sunset and night times */
    renderNormalSuntimeHeader({
        headerContext: { intervals },
        getRootProps,
        getIntervalProps,
        showPeriod,
        data,
    }) {
        const sunTimeMap = this.state.sunTimeMap;
        return (
        <div {...getRootProps()}>
            {intervals.map(interval => {
            const dayStyle = {
                lineHeight: '30px',
                backgroundColor: 'white',
                color: 'white'
            }
            const nightStyle = {
                lineHeight: '30px',
                backgroundColor: 'grey',
                color: 'grey'
            }
            const sunriseStyle = {
                lineHeight: '30px',
                backgroundColor: 'yellow',
                color: 'yellow'
            }
            const sunsetStyle = {
                lineHeight: '30px',
                backgroundColor: 'orange',
                color: 'orange'
            }
            // Get the intervals UTC date format and time
            const intervalDate = interval.startTime.clone().utc().format("YYYY-MM-DD");
            const intervalTime = interval.startTime.clone().utc();
            // Get the suntime for the UTC date
            const intervalDateSunTime = sunTimeMap[intervalDate];
            let intervalStyle = dayStyle;
            // If suntime is available display suntime blocks
            if (intervalDateSunTime) {
                if (intervalTime.isBefore(intervalDateSunTime.sunrise.start) || 
                    intervalTime.isAfter(intervalDateSunTime.sunset.end)) {
                    intervalStyle = nightStyle;
                }   else if (intervalTime.isSameOrAfter(intervalDateSunTime.sunrise.start) &&
                            intervalTime.isSameOrBefore(intervalDateSunTime.sunrise.end)) {
                    intervalStyle = sunriseStyle;
                }   else if (intervalTime.isSameOrAfter(intervalDateSunTime.sunset.start) && 
                            intervalTime.isSameOrBefore(intervalDateSunTime.sunset.end)) {
                    intervalStyle = sunsetStyle;
                }
                return (
                    <div className={`suntime-header, ${intervalStyle}`}
                    {...getIntervalProps({
                        interval,
                        style: intervalStyle
                    })}
                    >&nbsp;
                    </div>
                )
            }   else {
                return ("");
            }
            })}
        </div>
        )
    }

    /**
     * Function to render sunrise and before sunrise timings on the timeline view in normal view.
     * @param {Array} sunRiseTimings 
     */
    renderSunriseMarkers(sunRiseTimings) {
        let endPoint = 0;
        return (
            <>
            {sunRiseTimings && sunRiseTimings.length>0 && sunRiseTimings.map((item, index) => (
            <>
                {/* Marker to get the position of the sunrise end time */}
                <CustomMarker key={"sunrise-pos-"+index} date={item.end}>
                    {({ styles, date }) => {
                        endPoint = styles.left;
                        return ""
                    }}
                </CustomMarker>
                {/* Marker to represent dark light before sunrise on the day */}
                <CustomMarker key={"bef-sunrise-"+index} date={item.start.clone().hours(0).minutes(0).seconds(0)}>
                    {({ styles, date }) => {
                        const customStyles = {
                            ...styles,
                            backgroundColor: 'grey',
                            opacity:0.7,
                            zIndex: 10,
                            // width: '3px'
                            width: (endPoint-styles.left)
                        }
                        return <div style={customStyles} />
                    }}
                </CustomMarker>
                {/* Marker to represent the duration of sunrise */}
                <CustomMarker key={"sunrise-"+index} date={item.start}>
                    {({ styles, date }) => {
                        const customStyles = {
                        ...styles,
                        backgroundColor: 'yellow',
                        opacity:0.7,
                        zIndex: 10,
                        // width: '3px'
                        width: (endPoint-styles.left)
                        }
                        return <div style={customStyles} />
                    }}
                </CustomMarker>
            </>
            ))}
            </>
        );
    }

    /**
     * Function to render sunset & after sunset timings on the timeline view in normal view.
     * @param {Array} sunSetTimings 
     */
    renderSunsetMarkers(sunSetTimings) {
        let endPoint = 0;
        return (
            <>
            {sunSetTimings && sunSetTimings.length>0 && sunSetTimings.map((item, index) => (
            <>
                {/* Marker to get the position of the sunset end time */}
                <CustomMarker key={"sunset-pos-"+index} date={item.end}>
                        {({ styles, date }) => {
                            endPoint = styles.left;
                            return ""
                        }}
                </CustomMarker>
                {/* Marker to represent the dark light after sunset */}
                <CustomMarker key={"after-sunset-"+index} date={item.start.clone().hours(23).minutes(59).seconds(59)}>
                    {({ styles, date }) => {
                        const customStyles = {
                        ...styles,
                        backgroundColor: 'grey',
                        opacity:0.7,
                        zIndex: 10,
                        left: endPoint,
                        width: styles.left-endPoint
                        }
                        return <div style={customStyles} />
                    }}
                </CustomMarker>
                {/* Marker to represent the actual sunset duration */}
                <CustomMarker key={"sunset-"+index} date={item.start}>
                    {({ styles, date }) => {
                        const customStyles = {
                        ...styles,
                        backgroundColor: 'orange',
                        opacity:0.7,
                        zIndex: 10,
                        width: endPoint - styles.left
                        }
                        return <div style={customStyles} />
                    }}
                </CustomMarker>
            </>
            ))}
            </>
        );
    }

    /**
     * Function to render sunrise timings on the timeline view in normal view.
     * @param {Array} sunSetTimings 
     */
    renderNightMarkers(sunRiseTimings, sunSetTimings) {
        let endPoint = 0;
        return (
            <>
            {sunSetTimings && sunSetTimings.length>0 && sunSetTimings.map((item, index) => (
            <>
                <CustomMarker key={"sunset-"+index} date={item.end}>
                        {({ styles, date }) => {
                            endPoint = styles.left;
                            return ""
                        }}
                </CustomMarker>
                <CustomMarker key={"sunset-"+index} date={item.start}>
                    {({ styles, date }) => {
                        const customStyles = {
                        ...styles,
                        backgroundColor: 'orange',
                        width: endPoint - styles.left
                        }
                        return <div style={customStyles} />
                    }}
                </CustomMarker>
            </>
            ))}
            </>
        );
    }

    /** Custom Render function to pass to the CursorMarker component to display cursor labels on cursor movement */
    renderCursor({ styles, date }) {
        const utc = moment(date).utc();
        this.getLSTof(utc);
        const cursorLST = this.state.cursorLST;
        let cursorTextStyles = {};
        cursorTextStyles.backgroundColor = '#c40719'
        cursorTextStyles.width = `${this.state.lineHeight*4}px`;
        cursorTextStyles.color = '#ffffff';
        cursorTextStyles.zIndex = '999';
        cursorTextStyles.fontSize = `${this.state.lineHeight/30*8}px`;
        cursorTextStyles.height = `${this.state.lineHeight - 2}px`;
        cursorTextStyles.position = styles.position;
        cursorTextStyles.left = styles.left-(this.state.lineHeight*2);
        cursorTextStyles.top = '2px';
        cursorTextStyles.paddingLeft = "5px";
        cursorTextStyles.textAlign = "center";
        styles.backgroundColor = '#c40719';
        styles.display = "block !important";
        return (
            <>
                <div style={styles}  />
                <div style={cursorTextStyles}>
                    <div>UTC: { utc.format('DD-MMM-YYYY HH:mm:00')}</div>
                    <div>LST: {cursorLST}</div>
                </div>
            </>
        );
    }

    /** Custom function to pass to timeline component to render item */
    renderItem({ item, timelineContext, itemContext, getItemProps, getResizeProps }) {
        /* Reduce the item height so that the suntimings can be viewed above the item block.
           Also suntimes are rendered as items with tiny height to represent as horizontal bar above the actual items */
        if (item.type === "SUNTIME") {
            itemContext.dimensions.height = 3;
        }   else {
            itemContext.dimensions.height -= 3;
            if (!this.props.showSunTimings && this.state.viewType === UIConstants.timeline.types.NORMAL) {
                if (item.type === "RESERVATION") {
                    // itemContext.dimensions.top -= 20;
                    // itemContext.dimensions.height += 20;
                }   else {
                    // itemContext.dimensions.top -= 20;
                }
            }   else if (this.state.viewType === UIConstants.timeline.types.WEEKVIEW) {
                // itemContext.dimensions.top -= (this.props.rowHeight-5);
            }   else {
                if (item.type === "TASK") {
                    itemContext.dimensions.top += 6;
                    itemContext.dimensions.height -= 10;
                }   else {
                    itemContext.dimensions.top += 3;
                }
            }
            
        }
        const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
        const backgroundColor = itemContext.selected?item.bgColor:item.bgColor;
        let itemContentStyle = {lineHeight: `${Math.floor(item.type==="RESERVATION"?itemContext.dimensions.height/2:itemContext.dimensions.height)}px`, 
                                  fontSize: "14px",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  textAlign: "center"};
        if (item.type === "SCHEDULE" || item.type === "TASK") {
            itemContentStyle = {lineHeight: `${Math.floor(itemContext.dimensions.height/3)}px`, 
                                maxHeight: itemContext.dimensions.height,
                                  fontSize: "12px", fontWeight: "600",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "inherit",
                                  textAlign: "center"};
        }
        return (
          <div 
            {...getItemProps({
              className: `rct-item su-${item.status}`,
              style: {
                background: backgroundColor,
                color: item.color,
                // borderColor,
                borderStyle: "solid",
                borderWidth: item.type==="SUNTIME"?0:0,
                borderRadius: 3,
                borderLeftWidth: itemContext.selected ? 3 : 1,
                borderRightWidth: itemContext.selected ? 3 : 1,
                // opacity: item.type==="SUNTIME"?0.6:1
                zIndex: item.type==="SUNTIME"?79:80
              },
              onMouseDown: () => {
                  if (item.type !== "SUNTIME" && item.type !== "RESERVATION") {
                    this.onItemClick(item);
                  } else {

                  }
              }
            })} onMouseOver={(evt) => { this.onItemMouseOver(evt, item)}}
            onMouseOut={(evt) => { this.onItemMouseOut(evt, item)}}
          >
            {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : null}
    
                { item.type === "SCHEDULE" &&
                    <div style={itemContentStyle}>
                    <i style={{fontSize:"12px"}} className={`fa fa-user su-${item.status}-icon`} ></i>
                    <span>{`${item.project} - ${item.suId?item.suId:item.id} - ${item.name} - ${item.band} - ${item.duration}`}</span></div>
                }
                { item.type === "TASK" &&
                    <div style={itemContentStyle}>
                    <span>{`${item.project} - ${item.suId} - ${item.taskId} - ${item.name} - ${item.controlId} - ${item.typeValue} ${item.band?'- '+ item.band:''} - ${item.duration}`}</span></div>
                }

              { (item.type === "SUNTIME" || item.type === "RESERVATION") &&
                <div style={itemContentStyle}><span>{item.title}</span>
                    {item.type === "RESERVATION" &&
                        <div style={itemContentStyle}><span>{item.desc}</span></div> }
                </div> }
              
            {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : null}
          </div>
        );
    };
      
    /** Overriding function to pass to timeline component for zoom activities */
    onZoom(timelineContext) {
        // Update to the timeline values based on pre-defined zoom on mouse scroll
        if (this.state.isTimelineZoom) {
            if (!this.state.zoomLevel.startsWith("Custom")) {
                let startTime = moment(timelineContext.visibleTimeStart);
                let endTime = moment(timelineContext.visibleTimeEnd);
                const zoomTimeDiff = endTime.diff(startTime, 'seconds');
                const prevZoomLevel = _.find(ZOOM_LEVELS, {'name': this.state.zoomLevel});
                let zoomIndex = ZOOM_LEVELS.indexOf(prevZoomLevel);
                if (zoomTimeDiff < prevZoomLevel.value && zoomIndex>0) {
                    zoomIndex--;
                }   else if (endTime.diff(startTime, 'seconds') > prevZoomLevel.value && zoomIndex<ZOOM_LEVELS.length-2) {
                    zoomIndex++;
                }
                this.changeZoomLevel(ZOOM_LEVELS[zoomIndex].name, true)
            }
        }   else {
            this.setState({isTimelineZoom: true});
        }
    }

    /** Override function to pass to timeline component for custom action when timeline boundary changes */
    onBoundsChange(canvasTimeStart, canvasTimeEnd) {
        // To be implemented for lazy loading items 
    }

    /** Overriding function to pass to timeline component for custom actions when visible time changes */
    onTimeChange(visibleTimeStart, visibleTimeEnd, updateScrollCanvas) {
        let newVisibleTimeStart = moment(visibleTimeStart).utc();
        let newVisibleTimeEnd = moment(visibleTimeEnd).utc();
        if (this.state.viewType === UIConstants.timeline.types.WEEKVIEW) {
            const visibleTimeDiff = (visibleTimeEnd - visibleTimeStart)/1000;
            if (newVisibleTimeStart.isBefore(this.state.timelineStartDate)) {
                newVisibleTimeStart = this.state.timelineStartDate.clone();
                newVisibleTimeEnd = newVisibleTimeStart.clone().add(visibleTimeDiff, 'seconds');
            }   else if (newVisibleTimeEnd.isAfter(this.state.timelineEndDate)) {
                newVisibleTimeEnd = this.state.timelineEndDate.clone();
                newVisibleTimeStart = newVisibleTimeEnd.clone().add((-1 * visibleTimeDiff), 'seconds');
            }
        }
        this.loadLSTDateHeaderMap(newVisibleTimeStart, newVisibleTimeEnd, this.state.lstDateHeaderUnit);
        updateScrollCanvas(newVisibleTimeStart.valueOf(), newVisibleTimeEnd.valueOf());
        this.changeDateRange(newVisibleTimeStart, newVisibleTimeEnd);
        // this.setState({defaultStartTime: moment(visibleTimeStart), defaultEndTime: moment(visibleTimeEnd)})
        this.setState({defaultStartTime: newVisibleTimeStart, defaultEndTime: newVisibleTimeEnd});
    }

    /**
     * Item Click event passed back to the parent.
     * @param {Object} item 
     */
    onItemClick(item) {
        if (this.itemClickCallback) {
            this.itemClickCallback(item);
        }
    }

    /**
     * Mouse Over event passed back to the parent.
     * @param {Object} item 
     */
    onItemMouseOver(evt, item) {
        if ((item.type==="SCHEDULE" || item.type==="TASK") && this.props.itemMouseOverCallback) {
            this.props.itemMouseOverCallback(evt, item);
        }
    }

    /**
     * Mouse out event passed back to the parent.
     * @param {Object} item 
     */
    onItemMouseOut(evt, item) {
        if ((item.type==="SCHEDULE" || item.type==="TASK") && this.props.itemMouseOutCallback) {
            this.props.itemMouseOutCallback(evt);
        }
    }

    /**
     * Function to call the parent function callback and fetch new data. It also retrieves sunrise and sunset time.
     * @param {moment} startTime 
     * @param {moment} endTime 
     */
    async changeDateRange(startTime, endTime, refreshData) {
        if (this.props.showSunTimings && this.state.viewType===UIConstants.timeline.types.NORMAL) {
            this.setNormalSuntimings(startTime, endTime);
        }
        const result = await this.props.dateRangeCallback(startTime, endTime, refreshData);
        if (!this.props.showSunTimings && this.state.viewType === UIConstants.timeline.types.NORMAL) {
            result.items = await this.addStationSunTimes(startTime, endTime, result.group, result.items);
        }   else if (this.state.viewType === UIConstants.timeline.types.WEEKVIEW) {
            let group = DEFAULT_GROUP.concat(result.group);
            result.items = await this.addWeekSunTimes(startTime, endTime, group, result.items);
        }
        return result;
    }

    /**
     * Function to set sunrise and sunset timings in Normal view.
     * @param {moment} startTime 
     * @param {moment} endTime 
     */
    setNormalSuntimings(startTime, endTime) {
        let sunRiseTimings = [], sunSetTimings = [], sunTimeMap={};
        const noOfDays = endTime.diff(startTime, 'days');
        for (const number of _.range(noOfDays+3)) {                     // Added 3 to have suntimes of day before start time and day after end time so that for small time duration also, suntimes will be available.
            let prevStartTime = startTime.clone().add(-1, 'days');
            const date = prevStartTime.clone().add(number, 'days').hours(12).minutes(0).seconds(0);
            const formattedDate = date.format("YYYY-MM-DD");
            UtilService.getSunTimings(formattedDate).then(timings => {
                if (timings) {
                    const sunriseStartTime = moment.utc(timings.sun_rise.start.split('.')[0]);
                    const sunriseEndTime = moment.utc(timings.sun_rise.end.split('.')[0]);
                    const sunsetStartTime = moment.utc(timings.sun_set.start.split('.')[0]);
                    const sunsetEndTime = moment.utc(timings.sun_set.end.split('.')[0]);
                    const sunriseTime = {start: sunriseStartTime, end: sunriseEndTime};
                    const sunsetTime = {start: sunsetStartTime, end: sunsetEndTime};
                    // if (moment.utc(timings.sunriseEndTime).isAfter(startTime)) {
                        sunRiseTimings.push(sunriseTime);
                    // }
                    // if (moment.utc(timings.sunsetStartTime).isBefore(endTime)) {
                        sunSetTimings.push(sunsetTime);
                    // }
                    sunTimeMap[formattedDate] = {sunrise: sunriseTime, sunset: sunsetTime};
                    this.setState({sunRiseTimings: sunRiseTimings, sunSetTimings: sunSetTimings, sunTimeMap: sunTimeMap});
                }
            });
        }
    }

    /**
     * 
     * @param {moment} startTime 
     * @param {moment} endTime 
     * @param {Array} stationGroup - Array of station group objects
     * @param {Array} items - Array of Item objects
     */
    async addStationSunTimes(startTime, endTime, stationGroup, items) {
        const noOfDays = endTime.diff(startTime, 'days');
        let sunItems = _.cloneDeep(items);
        for (const number of _.range(noOfDays+1)) {
            for (const station of stationGroup) {
                const date = startTime.clone().add(number, 'days').hours(12).minutes(0).seconds(0);
                const timings = await UtilService.getSunTimings(date.format("YYYY-MM-DD"), station.id);
                if (timings) {
                    let sunriseItem = { id: `sunrise-${number}-${station.id}`, 
                                        group: station.id,
                                        // title: `${timings.sun_rise.start} to ${timings.sun_rise.end}`,
                                        title: "",
                                        project: "",
                                        name: "",
                                        duration: "",
                                        start_time: moment.utc(timings.sun_rise.start),
                                        end_time: moment.utc(timings.sun_rise.end),
                                        bgColor: "yellow",
                                        selectedBgColor: "yellow",
                                        type: "SUNTIME"};
                    sunItems.push(sunriseItem);
                    let sunsetItem = _.cloneDeep(sunriseItem);
                    sunsetItem.id = `sunset-${number}-${station.id}`;
                    // sunsetItem.title = `${timings.sun_set.start} to ${timings.sun_set.end}`;
                    sunsetItem.title = "";
                    sunsetItem.start_time = moment.utc(timings.sun_set.start);
                    sunsetItem.end_time = moment.utc(timings.sun_set.end);
                    sunsetItem.bgColor = "orange";
                    sunsetItem.selectedBgColor = "orange";
                    sunItems.push(sunsetItem);
                    let befSunriseItem = _.cloneDeep(sunriseItem);
                    befSunriseItem.id = `bef-sunrise-${number}-${station.id}`;
                    // sunsetItem.title = `${timings.sun_set.start} to ${timings.sun_set.end}`;
                    befSunriseItem.title = "";
                    befSunriseItem.start_time = moment.utc(timings.sun_rise.start).hours(0).minutes(0).seconds(0);
                    befSunriseItem.end_time = moment.utc(timings.sun_rise.start);
                    befSunriseItem.bgColor = "grey";
                    befSunriseItem.selectedBgColor = "grey";
                    sunItems.push(befSunriseItem);
                    let afterSunsetItem = _.cloneDeep(sunriseItem);
                    afterSunsetItem.id = `aft-sunset-${number}-${station.id}`;
                    // sunsetItem.title = `${timings.sun_set.start} to ${timings.sun_set.end}`;
                    afterSunsetItem.title = "";
                    afterSunsetItem.start_time = moment.utc(timings.sun_set.end);
                    afterSunsetItem.end_time = moment.utc(timings.sun_set.end).hours(23).minutes(59).seconds(59);
                    afterSunsetItem.bgColor = "grey";
                    afterSunsetItem.selectedBgColor = "grey";
                    sunItems.push(afterSunsetItem);
                    let dayItem = _.cloneDeep(sunriseItem);
                    dayItem.id = `day-${number}-${station.id}`;
                    // sunsetItem.title = `${timings.sun_set.start} to ${timings.sun_set.end}`;
                    dayItem.title = "";
                    dayItem.start_time = moment.utc(timings.sun_rise.end);
                    dayItem.end_time = moment.utc(timings.sun_set.start);
                    dayItem.bgColor = "white";
                    dayItem.selectedBgColor = "white";
                    sunItems.push(dayItem);
                }   else {
                    /* If no sunrise and sunset, show it as night time. Later it should be done as either day or night. */
                    let befSunriseItem = { id: `bef-sunrise-${number}-${station.id}`, 
                                        group: station.id,
                                        // title: `${timings.sun_rise.start} to ${timings.sun_rise.end}`,
                                        title: "",
                                        project: "",
                                        name: "",
                                        duration: "",
                                        start_time: moment.utc(date.format("YYYY-MM-DD 00:00:00")),
                                        end_time: moment.utc(date.format("YYYY-MM-DD 23:59:59")),
                                        bgColor: "grey",
                                        selectedBgColor: "grey",
                                        type: "SUNTIME"};
                    sunItems.push(befSunriseItem);
                }
            }
        }
        if (!this.props.showSunTimings && this.state.viewType === UIConstants.timeline.types.NORMAL) {
            items = sunItems;
        }
        return items;
    }

    /**
     * To Render sunrise, sunset and night times as horizontal bar, new items are created and appended with actual items.
     * @param {moment} startTime 
     * @param {moment} endTime 
     * @param {Array} weekGroup 
     * @param {Array} items 
     */
    async addWeekSunTimes(startTime, endTime, weekGroup, items) {
        let sunItems = _.cloneDeep(items);
        for (const weekDay of weekGroup) {
            if (weekDay.value) {
                const timings = await UtilService.getSunTimings(weekDay.value.format("YYYY-MM-DD"), 'CS001');
                const sunriseStart = moment.utc(timings.sun_rise.start);
                const sunriseEnd = moment.utc(timings.sun_rise.end);
                const sunsetStart = moment.utc(timings.sun_set.start);
                const sunsetEnd = moment.utc(timings.sun_set.end);
                if (timings) {
                    let sunriseItem = { id: `sunrise-${weekDay.id}`, 
                                        group: weekDay.id,
                                        // title: `${timings.sun_rise.start} to ${timings.sun_rise.end}`,
                                        title: "",
                                        project: "",
                                        name: "",
                                        duration: "",
                                        start_time: startTime.clone().hours(sunriseStart.hours()).minutes(sunriseStart.minutes()).seconds(sunriseStart.seconds()),
                                        end_time: startTime.clone().hours(sunriseEnd.hours()).minutes(sunriseEnd.minutes()).seconds(sunriseEnd.seconds()),
                                        bgColor: "yellow",
                                        selectedBgColor: "yellow",
                                        type: "SUNTIME"};
                    sunItems.push(sunriseItem);
                    let sunsetItem = _.cloneDeep(sunriseItem);
                    sunsetItem.id = `sunset-${weekDay.id}`;
                    // sunsetItem.title = `${timings.sun_set.start} to ${timings.sun_set.end}`;
                    sunsetItem.title = "";
                    sunsetItem.start_time = startTime.clone().hours(sunsetStart.hours()).minutes(sunsetStart.minutes()).seconds(sunsetStart.seconds());
                    sunsetItem.end_time = startTime.clone().hours(sunsetEnd.hours()).minutes(sunsetEnd.minutes()).seconds(sunsetEnd.seconds());
                    sunsetItem.bgColor = "orange";
                    sunsetItem.selectedBgColor = "orange";
                    sunItems.push(sunsetItem);
                    let befSunriseItem = _.cloneDeep(sunriseItem);
                    befSunriseItem.id = `bef-sunrise-${weekDay.id}`;
                    // sunsetItem.title = `${timings.sun_set.start} to ${timings.sun_set.end}`;
                    befSunriseItem.title = "";
                    befSunriseItem.start_time = startTime.clone().hours(0).minutes(0).seconds(0);
                    befSunriseItem.end_time = startTime.clone().hours(sunriseStart.hours()).minutes(sunriseStart.minutes()).seconds(sunriseStart.seconds());;
                    befSunriseItem.bgColor = "grey";
                    befSunriseItem.selectedBgColor = "grey";
                    sunItems.push(befSunriseItem);
                    let afterSunsetItem = _.cloneDeep(sunriseItem);
                    afterSunsetItem.id = `aft-sunset-${weekDay.id}`;
                    // sunsetItem.title = `${timings.sun_set.start} to ${timings.sun_set.end}`;
                    afterSunsetItem.title = "";
                    afterSunsetItem.start_time = startTime.clone().hours(sunsetEnd.hours()).minutes(sunsetEnd.minutes()).seconds(sunsetEnd.seconds());
                    afterSunsetItem.end_time = startTime.clone().hours(23).minutes(59).seconds(59);
                    afterSunsetItem.bgColor = "grey";
                    afterSunsetItem.selectedBgColor = "grey";
                    sunItems.push(afterSunsetItem);
                }
            }
        }
        if (this.state.viewType === UIConstants.timeline.types.WEEKVIEW) {
            items = _.orderBy(sunItems, ['type'], ['desc']);
        }
        return items;
    }

    /**
     * Resets the timeline view to default zoom and move to the current timeline
     */
    async resetToCurrentTime(){
        if (this.state.viewType===UIConstants.timeline.types.NORMAL) {
            const startTime = moment().utc().add(-24, 'hours');
            const endTime = moment().utc().add(24, 'hours');
            let result = await this.changeDateRange(startTime, endTime);
            let group = DEFAULT_GROUP.concat(result.group);
            this.setState({defaultStartTime: startTime, defaultEndTime: endTime, 
                            zoomLevel: DEFAULT_ZOOM_LEVEL, dayHeaderVisible: true, 
                            weekHeaderVisible: false, lstDateHeaderUnit: "hour",
                            group: group, items: result.items});
        }   else {
            if (moment().utc().week()-this.state.timelineStartDate.week() !== 0) {
                this.changeWeek(moment().utc().week()-this.state.timelineStartDate.week());
            }   else {
                this.changeZoomLevel("1 Day");
            }
        }
    }

    /**
     * Changes the zoom level and updates the timeline visible times, loads LST DateHeader values, 
     * callbacks the parent to fetch item and group for the changed visible timeline
     * @param {String} zoomLevel 
     * @param {boolean} isTimelineZoom 
     */
    async changeZoomLevel(zoomLevel, isTimelineZoom) {
        zoomLevel = zoomLevel?zoomLevel: DEFAULT_ZOOM_LEVEL;
        const newZoomLevel = _.find(ZOOM_LEVELS, {'name': zoomLevel});
        this.setState({isTimelineZoom: isTimelineZoom});
        let startTime = this.state.defaultStartTime;
        let endTime = this.state.defaultEndTime;
        if (zoomLevel === 'Custom') {
            if (this.state.prevZoomRange) {
                this.setZoomRange(this.state.prevZoomRange);
            }
        }   else {
            const visibleDuration = endTime.diff(startTime, 'seconds');
            if (newZoomLevel.value < visibleDuration) {
                startTime = startTime.add(1 * (visibleDuration-newZoomLevel.value)/2, 'seconds');
                endTime = endTime.add(-1 * (visibleDuration-newZoomLevel.value)/2, 'seconds');
            }   else {
                startTime = startTime.add(-1 * (newZoomLevel.value-visibleDuration)/2, 'seconds');
                endTime = endTime.add(1 * (newZoomLevel.value-visibleDuration)/2, 'seconds');
            }
            if (this.state.viewType === UIConstants.timeline.types.WEEKVIEW) {
                if ( zoomLevel==="1 Day") {
                    startTime = this.state.timelineStartDate.clone();
                    endTime = startTime.clone().add(newZoomLevel.value, 'seconds');
                }   else {
                    if (startTime.isBefore(this.state.timelineStartDate)) {
                        startTime = this.state.timelineStartDate.clone();
                        endTime = startTime.clone().add(newZoomLevel.value, 'seconds');
                    }   else if (endTime.isAfter(this.state.timelineEndDate)) {
                        endTime = this.state.timelineEndDate.clone();
                        startTime = endTime.clone().add(-1 * ( newZoomLevel.value), 'seconds');
                    }
                }
            }
            this.loadLSTDateHeaderMap(startTime, endTime, 'hour');
            let result = await this.changeDateRange(startTime, endTime);
            let group = DEFAULT_GROUP.concat(result.group);
            this.setState({zoomLevel: zoomLevel, defaultStartTime: startTime, defaultEndTime: endTime, 
                            isTimelineZoom: true, zoomRange: null, 
                            dayHeaderVisible: true, weekHeaderVisible: false, lstDateHeaderUnit: 'hour',
                            group: group, items: result.items});
        }
    }

    /**
     * Moves the timeline left 1/10th of the visible timeline duration
     */
    async moveLeft() {
        let visibleTimeStart = this.state.defaultStartTime.utc();
        let visibleTimeEnd = this.state.defaultEndTime.utc();
        const visibleTimeDiff = visibleTimeEnd.valueOf()-visibleTimeStart.valueOf();
        let secondsToMove = visibleTimeDiff / 1000 / 10 ;
        let newVisibleTimeStart = visibleTimeStart.clone().add(-1 * secondsToMove, 'seconds');
        let newVisibleTimeEnd = visibleTimeEnd.clone().add(-1 * secondsToMove, 'seconds');
        if (this.state.viewType === UIConstants.timeline.types.WEEKVIEW &&
            newVisibleTimeStart.isBefore(this.state.timelineStartDate)) {
            newVisibleTimeStart = this.state.timelineStartDate.clone().hours(0).minutes(0).seconds(0);
            newVisibleTimeEnd = newVisibleTimeStart.clone().add(visibleTimeDiff/1000, 'seconds');
        }
        let result = await this.changeDateRange(newVisibleTimeStart, newVisibleTimeEnd);
        this.loadLSTDateHeaderMap(newVisibleTimeStart, newVisibleTimeEnd, 'hour');
        let group = DEFAULT_GROUP.concat(result.group);
        this.setState({defaultStartTime: newVisibleTimeStart,
                        defaultEndTime: newVisibleTimeEnd,
                        group: group, items: result.items});
    }

    /**
     * Moves the timeline right 1/10th of the visible timeline length
     */
    async moveRight() {
        let visibleTimeStart = this.state.defaultStartTime.utc();
        let visibleTimeEnd = this.state.defaultEndTime.utc();
        const visibleTimeDiff = visibleTimeEnd.valueOf()-visibleTimeStart.valueOf();
        const secondsToMove = visibleTimeDiff / 1000 / 10 ;
        let newVisibleTimeStart = visibleTimeStart.clone().add(1 * secondsToMove, 'seconds');
        let newVisibleTimeEnd = visibleTimeEnd.clone().add(1 * secondsToMove, 'seconds');
        if (this.state.viewType === UIConstants.timeline.types.WEEKVIEW &&
            newVisibleTimeEnd.isAfter(this.state.timelineEndDate)) {
            newVisibleTimeEnd = this.state.timelineEndDate.clone().hours(23).minutes(59).minutes(59);
            newVisibleTimeStart = newVisibleTimeEnd.clone().add((-1 * visibleTimeDiff/1000), 'seconds');
        }
        let result = await this.changeDateRange(newVisibleTimeStart, newVisibleTimeEnd);
        this.loadLSTDateHeaderMap(newVisibleTimeStart, newVisibleTimeEnd, 'hour');
        let group = DEFAULT_GROUP.concat(result.group);
        this.setState({defaultStartTime: newVisibleTimeStart,
                        defaultEndTime: newVisibleTimeEnd,
                        group: group, items: result.items});
    }

    /**
     * Zooms In to the next pre-defined zoom level
     */
    zoomIn() {
        let prevZoomLevel = this.state.zoomLevel;
        const prevZoomObject = _.find(this.ZOOM_LEVELS, {'name': prevZoomLevel});
        const prevZoomIndex = this.ZOOM_LEVELS.indexOf(prevZoomObject);
        if (prevZoomIndex > 0) {
            this.changeZoomLevel(this.ZOOM_LEVELS[prevZoomIndex-1].name, false);
        }
    }

    /**
     * Zooms out to the next pre-defined zoom level
     */
    zoomOut() {
        let prevZoomLevel = this.state.zoomLevel;
        const prevZoomObject = _.find(this.ZOOM_LEVELS, {'name': prevZoomLevel});
        const prevZoomIndex = this.ZOOM_LEVELS.indexOf(prevZoomObject);
        const maxZoomOutLevel = this.ZOOM_LEVELS.length-(this.state.viewType===UIConstants.timeline.types.NORMAL?2:1);
        if (prevZoomIndex < maxZoomOutLevel) {
            this.changeZoomLevel(this.ZOOM_LEVELS[prevZoomIndex+1].name, false);
        }
    }

    /**
     * Function to call when the custom date range is changed. Updates visible timelines, date header unit, 
     * calls back parent to get updated group and item records, LST date header values
     * @param {array} value - array of moment object
     */
    async setZoomRange(value){
        let startDate, endDate = null;
        if (value) {
            // Set all values only when both range values available in the array else just set the value to reflect in the date selection component
            if (value[1]!==null) {
                startDate = moment.utc(moment(value[0]).format("YYYY-MM-DD"));
                endDate = moment.utc(moment(value[1]).format("YYYY-MM-DD 23:59:59"));
                let dayHeaderVisible = this.state.dayHeaderVisible;
                let weekHeaderVisible = this.state.weekHeaderVisible;
                let lstDateHeaderUnit = this.state.lstDateHeaderUnit;
                let rangeDays = endDate.diff(startDate, 'days');
                dayHeaderVisible = rangeDays > 35?false: true; 
                weekHeaderVisible = rangeDays > 35?true: false; 
                lstDateHeaderUnit = rangeDays > 35?"day":"hour";
                this.setState({zoomRange:value, prevZoomRange:value,
                                defaultStartTime: startDate, defaultEndTime: endDate, 
                                zoomLevel: ZOOM_LEVELS[ZOOM_LEVELS.length-1].name, isTimelineZoom: false,
                                dayHeaderVisible: dayHeaderVisible, weekHeaderVisible: weekHeaderVisible, 
                                lstDateHeaderUnit: lstDateHeaderUnit
                                });
                const result = await this.changeDateRange(startDate, endDate);
                let group = DEFAULT_GROUP.concat(result.group);
                this.setState({group: group, items: result.items});
                this.loadLSTDateHeaderMap(startDate, endDate, lstDateHeaderUnit);
            }   else {
                this.setState({zoomRange: value});
            }
        }   else {
            this.resetToCurrentTime();
        }
    }

    async changeWeek(direction) {
        this.setState({isWeekLoading: true});
        let startDate = this.state.group[1].value.clone().add(direction * 7, 'days');
        let endDate = this.state.group[this.state.group.length-1].value.clone().add(direction * 7, 'days').hours(23).minutes(59).seconds(59);
        let timelineStart = this.state.timelineStartDate.clone().add(direction * 7, 'days');
        let timelineEnd = this.state.timelineEndDate.clone().add(direction * 7, 'days');
        const result = await this.changeDateRange(startDate, endDate, true);
        let group = DEFAULT_GROUP.concat(result.group);
        let dayHeaderVisible = this.state.dayHeaderVisible;
        let weekHeaderVisible = this.state.weekHeaderVisible;
        let lstDateHeaderUnit = this.state.lstDateHeaderUnit;
        let rangeDays = endDate.diff(startDate, 'days');
        dayHeaderVisible = rangeDays > 35?false: true; 
        weekHeaderVisible = rangeDays > 35?true: false; 
        lstDateHeaderUnit = rangeDays > 35?"day":"hour";
        const items = await this.addWeekSunTimes(timelineStart, timelineEnd, group, result.items);
        this.setState({defaultStartTime: timelineStart, defaultEndTime: timelineEnd,
                        timelineStartDate: timelineStart, timelineEndDate: timelineEnd,
                        zoomLevel: this.ZOOM_LEVELS[this.ZOOM_LEVELS.length-1].name, isTimelineZoom: false,
                        dayHeaderVisible: dayHeaderVisible, weekHeaderVisible: weekHeaderVisible,
                        lstDateHeaderUnit: lstDateHeaderUnit, group: group, items: items});
        this.loadLSTDateHeaderMap(startDate, endDate, lstDateHeaderUnit);
        this.setState({isWeekLoading: false});
    }

    /**
     * Public function that can be called by its implementation class or function to pass required data and parameters
     * as objects
     * @param {Object} props 
     */
    async updateTimeline(props) {
        let group =  DEFAULT_GROUP.concat(props.group);
        if (!this.props.showSunTimings && this.state.viewType === UIConstants.timeline.types.NORMAL) {
            props.items = await this.addStationSunTimes(this.state.defaultStartTime, this.state.defaultEndTime, props.group, props.items);
        }   else if(this.props.showSunTimings && this.state.viewType === UIConstants.timeline.types.NORMAL) {
            this.setNormalSuntimings(this.state.defaultStartTime, this.state.defaultEndTime);
        }   else if (this.state.viewType === UIConstants.timeline.types.WEEKVIEW) {
            props.items = await this.addWeekSunTimes(this.state.defaultStartTime, this.state.defaultEndTime, group, props.items);
        }
        this.setState({group: group, items: _.orderBy(props.items, ['type'], ['desc'])});
    }

    render() {
        return (
            <React.Fragment>
                {/* Toolbar for the timeline */}
                <div className={`p-fluid p-grid timeline-toolbar ${this.props.className}`}>
                    {/* Clock Display */}
                    <div className="p-col-2" style={{padding: '0px 0px 0px 10px'}}>
                        <div style={{marginTop: "0px"}}>
                            <label style={{marginBottom: "0px"}}>Date:</label><span>{this.state.currentUTC.format(UTC_DATE_FORMAT)}</span>
                        </div>
                        <div style={{marginTop: "0px"}}>
                            <label style={{marginBottom: "0px"}}>UTC:</label><span>{this.state.currentUTC.format(UTC_TIME_FORMAT)}</span>
                        </div>
                        {this.state.currentLST && 
                            <div style={{marginTop: "0px"}}>
                                <label style={{marginBottom: "0px"}}>LST:</label><span>{this.state.currentLST.format("HH:mm:ss")}</span>
                            </div>
                        }
                    </div>
                    <div className="p-col-1 timeline-filters">
                        {this.state.allowLive &&
                            <>
                                <label style={{paddingRight: "3px"}}>Live </label>
                                <Checkbox checked={this.state.isLive} label="Live" onChange={(e) => { this.setState({'isLive': e.checked})}} ></Checkbox>
                            </>}
                    </div>
                    {/* Date Range Selection */}
                    <div className="p-col-4 timeline-filters">
                        {this.state.allowDateSelection &&
                        <>
                        {/* <span className="p-float-label"> */}
                        <Calendar id="range" placeholder="Select Date Range" selectionMode="range" showIcon={!this.state.zoomRange}
                                value={this.state.zoomRange} onChange={(e) => this.setZoomRange( e.value )} readOnlyInput />
                        {/* <label htmlFor="range">Select Date Range</label>
                        </span> */}
                        {this.state.zoomRange && <i className="pi pi-times pi-primary" style={{position: 'relative', left:'90%', bottom:'20px', cursor:'pointer'}} 
                                                    onClick={() => {this.setZoomRange( null)}}></i>}
                        </>}
                        {this.state.viewType===UIConstants.timeline.types.WEEKVIEW &&
                            <>
                                <Button label="" icon="pi pi-angle-double-left" title="Previous Week" onClick={(e) =>{this.changeWeek(-1)}}/>
                                <label className="timeline-week-span">Week {this.state.isWeekLoading}</label>
                                <Button label="" icon="pi pi-angle-double-right" title="Next Week" onClick={(e) =>{this.changeWeek(1)}}/>
                                {this.state.isWeekLoading && <ProgressSpinner style={{width: '30px', height: '30px', marginLeft:'5px', paddingTop: '5px'}} strokeWidth="4" />}
                            </>
                        }
                    </div>
                    {/* Reset to default zoom and current timeline */}
                    <div className="p-col-1 timeline-button" >
                        <Button label="" icon="pi pi-arrow-down" className="p-button-rounded p-button-success" id="now-btn" onClick={this.resetToCurrentTime} title="Reset Zoom & Move to Current Time"/>
                    </div>
                    {/* Zoom Select */}
                    <div className="p-col-2 timeline-filters" style={{paddingRight: '0px'}}>
                        <Dropdown optionLabel="name" optionValue="name" 
                                style={{fontSize: '10px'}}
                                value={this.state.zoomLevel} 
                                options={this.ZOOM_LEVELS} 
                                filter showClear={false} filterBy="name"
                                onChange={(e) => {this.changeZoomLevel(e.value, false)}} 
                                placeholder="Zoom"/>
                    </div>
                    {/* Zoom and Move Action */}
                    <div className="p-col-2 timeline-actionbar timeline-filters">
                        <button className="p-link" title="Move Left" onClick={e=> { this.moveLeft() }}><i className="pi pi-angle-left"></i></button>
                        <button className="p-link" title="Zoom Out" onClick={e=> { this.zoomOut() }} disabled={this.state.zoomLevel.startsWith('Custom')}><i className="pi pi-minus-circle"></i></button>
                        <button className="p-link" title="Zoom In" onClick={e=> { this.zoomIn() }} disabled={this.state.zoomLevel.startsWith('Custom')}><i className="pi pi-plus-circle"></i></button>
                        <button className="p-link" title="Move Right" onClick={e=> { this.moveRight() }}><i className="pi pi-angle-right"></i></button>
                    </div>
                </div>
                <div className="p-grid legendbar">
                    <div className="col-9">
                        <div style={{fontWeight:'500', height: '25px'}}>Scheduling Unit / Task Status</div>
                        <div className="p-grid">
                            <div className="col-1 su-legend su-error" title="Error">Error</div>
                            <div className='col-1 su-legend su-cancelled' title="Cancelled">Cancelled</div>
                            <div className='col-1 su-legend su-defined' title="Defined">Defined</div>
                            <div className='col-1 su-legend su-schedulable' title="Schedulable">Schedulable</div>
                            <div className='col-1 su-legend su-scheduled' title="Scheduled">Scheduled</div>
                            <div className='col-1 su-legend su-started' title="Started">Started</div>
                            <div className='col-1 su-legend su-observing' title="Observing">Observing</div>
                            <div className='col-1 su-legend su-observed' title="Observed">Observed</div>
                            <div className='col-1 su-legend su-processing' title="Processing">Processing</div>
                            <div className='col-1 su-legend su-processed' title="Processed">Processed</div>
                            <div className='col-1 su-legend su-ingesting' title="Ingesting">Ingesting</div>
                            <div className='col-1 su-legend su-finished' title="Finished">Finished</div>
                        </div>
                    </div>
                    {!this.props.showSunTimings && this.state.viewType===UIConstants.timeline.types.NORMAL &&
                    <div className="col-3">
                        <div style={{fontWeight:'500', height: '25px'}}>Station Reservation</div>
                        <div className="p-grid">
                            <div className="col-3 su-legend reserve-not-available" title="Not Available">NA</div>
                            <div className="col-3 su-legend reserve-available" title="Available">Available</div>
                            <div className="col-3 su-legend reserve-manual" title="Manual">Manual</div>
                            <div className="col-3 su-legend reserve-dynamic" title="Dynamic">Dynamic</div>
                        </div>
                    </div>
                    }
                </div>
                <Timeline
                    groups={this.state.group}
                    items={this.state.items}
                    // Use these below properties to stop zoom and move
                    // defaultTimeStart={this.props.defaultStartTime?this.props.defaultStartTime:this.state.defaultStartTime}
                    // defaultTimeStart={this.state.defaultStartTime}
                    // defaultTimeEnd={this.state.defaultEndTime}
                    visibleTimeStart={this.state.defaultStartTime.valueOf()}
                    visibleTimeEnd={this.state.defaultEndTime.valueOf()}
                    resizeDetector={containerResizeDetector}
                    stackItems={this.props.stackItems || false}
                    traditionalZoom={this.state.zoomAllowed}
                    minZoom={this.state.minZoom}
                    maxZoom={this.state.maxZoom}
                    lineHeight={this.props.rowHeight || 50} itemHeightRatio={0.95}
                    sidebarWidth={this.state.sidebarWidth}
                    timeSteps={this.state.timeSteps}
                    onZoom={this.onZoom}
                    onBoundsChange={this.onBoundsChange}
                    onTimeChange={this.onTimeChange}
                    itemRenderer={this.renderItem}
                    canMove={this.state.canMove}
                    canResize={this.state.canResize}
                    canChangeGroup={this.state.canChangeGroup}>
                    <TimelineHeaders className="sticky">
                        <SidebarHeader>{({ getRootProps }) => {return this.renderSidebarHeader({ getRootProps })}}</SidebarHeader>
                        {this.state.weekHeaderVisible &&
                            <DateHeader unit="Week" labelFormat="w"></DateHeader> }
                        { this.state.dayHeaderVisible  &&
                            <DateHeader unit="hour" intervalRenderer={this.renderDayHeader}></DateHeader> }
                        <DateHeader unit={this.state.lstDateHeaderUnit} intervalRenderer={this.renderUTCDateHeader} ></DateHeader>
                        {!this.state.isLSTDateHeaderLoading &&
                            // This method keeps updating the header labels, so that the LST values will be displayed after fetching from server
                            <DateHeader unit={this.state.lstDateHeaderUnit} 
                                        intervalRenderer={({ getIntervalProps, intervalContext, data })=>{return this.renderLSTDateHeader({ getIntervalProps, intervalContext, data })}}>
                            </DateHeader>
                            // This method will render once but will not update the values after fetching from server
                            // <DateHeader unit={this.state.lstDateHeaderUnit} intervalRenderer={this.renderLSTDateHeader}></DateHeader>
                        }
                        {/* Suntime Header in normal view with sunrise, sunset and night time  */}
                        {/* {this.props.showSunTimings && this.state.viewType === UIConstants.timeline.types.NORMAL && this.state.sunTimeMap && 
                        <CustomHeader height={30} unit="minute" 
                            children={({ headerContext: { intervals }, getRootProps, getIntervalProps, showPeriod, data})=> {
                                return this.renderNormalSuntimeHeader({ headerContext: { intervals }, getRootProps, getIntervalProps, showPeriod, data})}}>
                        </CustomHeader>
                        } */}
                    </TimelineHeaders>

                    <TimelineMarkers>
                        {/* Current time line marker */}
                        <CustomMarker date={this.state.currentUTC}>
                            {({ styles, date }) => {
                                const customStyles = {
                                ...styles,
                                backgroundColor: 'green',
                                width: '2px'
                                }
                                return <div style={customStyles} />
                            }}
                        </CustomMarker>
                        {/* Show sunrise and sunset markers for normal timeline view (Not station view and week view */}
                        {this.props.showSunTimings && this.state.viewType===UIConstants.timeline.types.NORMAL &&
                            <>
                            {/* Sunrise time line markers */}
                            { this.renderSunriseMarkers(this.state.sunRiseTimings)}
                            {/* Sunset time line markers */}
                            { this.renderSunsetMarkers(this.state.sunSetTimings)}
                            </>
                        }
                        {this.state.showCursor?
                            <CursorMarker>
                                {this.renderCursor}
                            </CursorMarker>:""}
                    </TimelineMarkers>
                </Timeline>
            </React.Fragment>
        );
    }

}