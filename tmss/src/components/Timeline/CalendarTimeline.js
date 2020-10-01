import React, {Component} from 'react';
import Timeline, {
    TimelineMarkers,
    TimelineHeaders,
    SidebarHeader,
    DateHeader,
    CustomMarker,
    CursorMarker
  } from 'react-calendar-timeline';
import containerResizeDetector from 'react-calendar-timeline/lib/resize-detector/container';
import moment from 'moment';
import _ from 'lodash';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

import UtilService from '../../services/util.service';

import 'react-calendar-timeline/lib/Timeline.css';
import { Calendar } from 'primereact/calendar';

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
const UTC_DISPLAY_FORMAT = "YYYY-MM-DDTHH:mm:ss";
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
        defaultStartTime: props.startTime || moment().utc().add(-1 * defaultZoomLevel.value/2, 'seconds'),
        defaultEndTime: props.endTime || moment().utc().add(1 * defaultZoomLevel.value/2, 'seconds'),
        group: group,
        items: props.items || [],
        //>>>>>> Properties to pass to react-calendar-timeline component
        stackItems: props.stackItems || true,
        zoomAllowed: props.zoomAllowed || true,
        minZoom: props.minZoom || (1 * 60 * 1000),                  // One Minute
        maxZoom: props.maxZoom || (32 * 24 * 60 * 60 * 1000),       // 32 hours
        zoomLevel: DEFAULT_ZOOM_LEVEL,
        isTimelineZoom: true,
        zoomRange: null,
        prevZoomRange: null,
        lineHeight: props.rowHeight || 50,                          // Row line height
        sidebarWidth: props.sidebarWidth || 200,
        timeSteps: props.timeSteps || {minute: 60},
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
        weekHeaderVisible: false                                    // To control the Week header visibility based on the zoom level
      }
      this.itemClickCallback = props.itemClickCallback;             // Pass timeline item click event back to parent
      
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
                    this.setState({currentLST: moment(currentUTC.format('DD-MMM-YYYY ') + currentLST)})
                } );
        }   else {
            this.setState({currentUTC: this.state.currentUTC.add(1, 'second'), 
                            currentLST: this.state.currentLST?this.state.currentLST.add(1, 'second'):null});
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
                const lstDate = moment(colUTC.format(`DD-MMM-YYYY ${lst}`)).add(30, 'minutes');
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
        return (<div {...getRootProps()} 
                    style={{color: '#ffffff', textAlign: "right", width: `${this.state.sidebarWidth}px`, 
                            paddingRight: '10px', backgroundColor: '#8ba7d9'}}>
                    <div style={{height:'30px'}}>{this.state.dayHeaderVisible?`Day${monthDuration}`:`Week${monthDuration}`}</div> 
                    <div style={{height:'30px'}}>{this.state.dayHeaderVisible?`UTC(Hr)`:`UTC(Day)`}</div>
                    <div style={{height:'30px'}}>{this.state.dayHeaderVisible?`LST(Hr)`:`LST(Day)`}</div>
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
                        <span>
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

    /** Custom Render function to pass to the CursorMarker component to display cursor labels on cursor movement */
    renderCursor({ styles, date }) {
        const utc = moment(date).utc();
        this.getLSTof(utc);
        const cursorLST = this.state.cursorLST;
        let cursorTextStyles = {};
        cursorTextStyles.backgroundColor = '#c40719'
        cursorTextStyles.width = `${this.state.lineHeight*4}px`;
        cursorTextStyles.color = '#ffffff';
        cursorTextStyles.zIndex = '9999';
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
        const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
        const backgroundColor = itemContext.selected?item.bgColor:item.bgColor;
        // const backgroundColor = itemContext.selected ? (itemContext.dragging ? "red" : item.selectedBgColor) : item.bgColor;
        // const borderColor = itemContext.resizing ? "red" : item.color;
        const itemContentStyle = {lineHeight: `${Math.floor(itemContext.dimensions.height)}px`, 
                                  fontSize: "14px",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  textAlign: "center"};
                        
        return (
          <div
            {...getItemProps({
              style: {
                background: backgroundColor,
                color: item.color,
                // borderColor,
                borderStyle: "solid",
                borderWidth: 1,
                borderRadius: 3,
                borderLeftWidth: itemContext.selected ? 3 : 1,
                borderRightWidth: itemContext.selected ? 3 : 1
              },
              onMouseDown: () => {
                this.onItemClick(item);
              }
            })}
          >
            {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : null}
    
            <div
              style={{
                height: itemContext.dimensions.height,
                //overflow: "hidden",
                paddingLeft: 3,
                //textOverflow: "ellipsis",
                //whiteSpace: "nowrap"
              }}
            >
              {/* <div style={itemContentStyle}><span>{item.project}</span></div>
              <div style={itemContentStyle}><span>{item.name}</span></div>
              <div style={itemContentStyle}><span>{item.duration}</span></div> */}
              <div style={itemContentStyle}><span>{item.title}</span></div>
            </div>
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
        this.loadLSTDateHeaderMap(moment(visibleTimeStart).utc(), moment(visibleTimeEnd).utc(), this.state.lstDateHeaderUnit);
        updateScrollCanvas(visibleTimeStart, visibleTimeEnd);
        this.setState({defaultStartTime: moment(visibleTimeStart), defaultEndTime: moment(visibleTimeEnd)})
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
     * Resets the timeline view to default zoom and move to the current timeline
     */
    resetToCurrentTime(){
        this.setState({defaultStartTime: moment().utc().add(-24, 'hours'),
                        defaultEndTime: moment().utc().add(24, 'hours'), zoomLevel: DEFAULT_ZOOM_LEVEL,
                        dayHeaderVisible: true, weekHeaderVisible: false, lstDateHeaderUnit: "hour"});
    }

    /**
     * Changes the zoom level and updates the timeline visible times, loads LST DateHeader values, 
     * callbacks the parent to fetch item and group for the changed visible timeline
     * @param {String} zoomLevel 
     * @param {boolean} isTimelineZoom 
     */
    changeZoomLevel(zoomLevel, isTimelineZoom) {
        zoomLevel = zoomLevel?zoomLevel: DEFAULT_ZOOM_LEVEL;
        const newZoomLevel = _.find(ZOOM_LEVELS, {'name': zoomLevel});
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
            this.loadLSTDateHeaderMap(startTime, endTime, 'hour');
            const result = this.props.dateRangeCallback(startTime, endTime);
            let group = DEFAULT_GROUP.concat(result.group);
            this.setState({zoomLevel: zoomLevel, defaultStartTime: startTime, defaultEndTime: endTime, 
                            isTimelineZoom: isTimelineZoom, zoomRange: null, 
                            dayHeaderVisible: true, weekHeaderVisible: false, lstDateHeaderUnit: 'hour',
                            group: group, items: result.items});
        }
    }

    /**
     * Moves the timeline left 1/10th of the visible timeline duration
     */
    moveLeft() {
        let visibleTimeStart = this.state.defaultStartTime;
        let visibleTimeEnd = this.state.defaultEndTime;
        const visibleTimeDiff = visibleTimeEnd.valueOf()-visibleTimeStart.valueOf();
        const secondsToMove = visibleTimeDiff / 1000 / 10 ;
        this.setState({defaultStartTime: visibleTimeStart.add(-1 * secondsToMove, 'seconds'),
                        defaultEndTime: visibleTimeEnd.add(-1 * secondsToMove, 'seconds')});
    }

    /**
     * Moves the timeline right 1/10th of the visible timeline length
     */
    moveRight() {
        let visibleTimeStart = this.state.defaultStartTime;
        let visibleTimeEnd = this.state.defaultEndTime;
        const visibleTimeDiff = visibleTimeEnd.valueOf()-visibleTimeStart.valueOf();
        const secondsToMove = visibleTimeDiff / 1000 / 10 ;
        this.setState({defaultStartTime: visibleTimeStart.add(1 * secondsToMove, 'seconds'),
                        defaultEndTime: visibleTimeEnd.add(1 * secondsToMove, 'seconds')});
    }

    /**
     * Zooms In to the next pre-defined zoom level
     */
    zoomIn() {
        /*let visibleTimeStart = this.state.defaultStartTime;
        let visibleTimeEnd = this.state.defaultEndTime;
        const visibleTimeDiff = visibleTimeEnd.valueOf()-visibleTimeStart.valueOf();
        if (visibleTimeDiff > this.state.minZoom) {
            const secondsToZoom = visibleTimeDiff / 1000 / 2 / 4 * 3 ;
            this.setState({defaultStartTime: visibleTimeStart.add(1*secondsToZoom, 'seconds'),
                            defaultEndTime: visibleTimeEnd.add(-1*secondsToZoom, 'seconds')});
        }*/
        let prevZoomLevel = this.state.zoomLevel;
        const prevZoomObject = _.find(ZOOM_LEVELS, {'name': prevZoomLevel});
        const prevZoomIndex = ZOOM_LEVELS.indexOf(prevZoomObject);
        if (prevZoomIndex > 0) {
            this.changeZoomLevel(ZOOM_LEVELS[prevZoomIndex-1].name, false);
        }
    }

    /**
     * Zooms out to the next pre-defined zoom level
     */
    zoomOut() {
        /*let visibleTimeStart = this.state.defaultStartTime;
        let visibleTimeEnd = this.state.defaultEndTime;
        const visibleTimeDiff = visibleTimeEnd.valueOf()-visibleTimeStart.valueOf();
        if (visibleTimeDiff < this.state.maxZoom) {
            const secondsToZoom = visibleTimeDiff / 1000 * 3 / 2;
            this.setState({defaultStartTime: visibleTimeStart.add(-1*secondsToZoom, 'seconds'),
                            defaultEndTime: visibleTimeEnd.add(1*secondsToZoom, 'seconds')});
        }*/
        let prevZoomLevel = this.state.zoomLevel;
        const prevZoomObject = _.find(ZOOM_LEVELS, {'name': prevZoomLevel});
        const prevZoomIndex = ZOOM_LEVELS.indexOf(prevZoomObject);
        if (prevZoomIndex < ZOOM_LEVELS.length-2) {
            this.changeZoomLevel(ZOOM_LEVELS[prevZoomIndex+1].name, false);
        }
    }

    /**
     * Function to call when the custom date range is changed. Updates visible timelines, date header unit, 
     * calls back parent to get updated group and item records, LST date header values
     * @param {array} value - array of moment object
     */
    setZoomRange(value){
        let startDate, endDate = null;
        if (value) {
            // Set all values only when both range values available in the array else just set the value to reflect in the date selection component
            if (value[1]!==null) {
                startDate = moment.utc(moment(value[0]).format("DD-MMM-YYYY"));
                endDate = moment.utc(moment(value[1]).format("DD-MMM-YYYY 23:59:59"));
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
                const result = this.props.dateRangeCallback(startDate, endDate);
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

    render() {
        return (
            <React.Fragment>
                {/* Toolbar for the timeline */}
                <div className="p-fluid p-grid timeline-toolbar">
                    {/* Clock Display */}
                    <div className="p-col-3" style={{padding: '0px 0px 0px 10px'}}>
                        <div style={{marginTop: "0px"}}>
                            <label style={{marginBottom: "0px"}}>UTC:</label><span>{this.state.currentUTC.format(UTC_DISPLAY_FORMAT)}</span>
                        </div>
                        {this.state.currentLST && 
                            <div style={{marginTop: "0px"}}>
                                <label style={{marginBottom: "0px"}}>LST:</label><span>{this.state.currentLST.format("HH:mm:ss")}</span>
                            </div>
                        }
                    </div>
                    {/* Date Range Selection */}
                    <div className="p-col-4">
                        {/* <span className="p-float-label"> */}
                        <Calendar id="range" placeholder="Select Date Range" selectionMode="range" showIcon={!this.state.zoomRange}
                                value={this.state.zoomRange} onChange={(e) => this.setZoomRange( e.value )} readOnlyInput />
                        {/* <label htmlFor="range">Select Date Range</label>
                        </span> */}
                        {this.state.zoomRange && <i className="pi pi-times pi-primary" style={{position: 'relative', left:'90%', bottom:'20px', cursor:'pointer'}} 
                                                    onClick={() => {this.setZoomRange( null)}}></i>}
                    </div>
                    {/* Reset to default zoom and current timeline */}
                    <div className="p-col-1" style={{padding: '5px 0px'}}>
                        <Button label="" icon="pi pi-arrow-down" className="p-button-rounded p-button-success" id="now-btn" onClick={this.resetToCurrentTime} title="Rest Zoom & Move to Current Time"/>
                    </div>
                    {/* Zoom Select */}
                    <div className="p-col-2" style={{paddingRight: '0px'}}>
                        <Dropdown optionLabel="name" optionValue="name" 
                                style={{fontSize: '10px'}}
                                value={this.state.zoomLevel} 
                                options={ZOOM_LEVELS} 
                                filter showClear={false} filterBy="name"
                                onChange={(e) => {this.changeZoomLevel(e.value, false)}} 
                                placeholder="Zoom"/>
                    </div>
                    {/* Zoom and Move Action */}
                    <div className="p-col-2 timeline-actionbar">
                        <button className="p-link" title="Move Left" onClick={e=> { this.moveLeft() }}><i className="pi pi-angle-left"></i></button>
                        <button className="p-link" title="Zoom Out" onClick={e=> { this.zoomOut() }} disabled={this.state.zoomLevel.startsWith('Custom')}><i className="pi pi-minus-circle"></i></button>
                        <button className="p-link" title="Zoom In" onClick={e=> { this.zoomIn() }} disabled={this.state.zoomLevel.startsWith('Custom')}><i className="pi pi-plus-circle"></i></button>
                        <button className="p-link" title="Move Right" onClick={e=> { this.moveRight() }} onMouseDown={e=> { this.moveRight() }}><i className="pi pi-angle-right"></i></button>
                    </div>
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
                    stackItems={this.state.stackItems}
                    traditionalZoom={this.state.zoomAllowed}
                    minZoom={this.state.minZoom}
                    maxZoom={this.state.maxZoom}
                    lineHeight={this.state.lineHeight} itemHeightRatio={0.95}
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