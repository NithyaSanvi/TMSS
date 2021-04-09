import _, { round } from 'lodash';

const UnitConverter = {
    resourceUnitMap: {'time':{display: 'Hours', conversionFactor: 3600, mode:'decimal', minFractionDigits:0, maxFractionDigits: 2 }, 
                      'bytes': {display: 'TB', conversionFactor: (1024*1024*1024*1024), mode:'decimal', minFractionDigits:0, maxFractionDigits: 3}, 
                      'number': {display: 'Numbers', conversionFactor: 1, mode:'decimal', minFractionDigits:0, maxFractionDigits: 0},
                      'days': {display: 'Days', conversionFactor: (3600*24), mode:'decimal', minFractionDigits:0, maxFractionDigits: 0}},

    getDBResourceUnit: function() {

    },

    getUIResourceUnit: function(type, value) {
        try{
            if(this.resourceUnitMap[type]){
                var retval = Number.parseFloat(value/(this.resourceUnitMap[type].conversionFactor)).toFixed(this.resourceUnitMap[type].maxFractionDigits)
                return retval;
            }
          
        }catch(error){
            console.error('[unit.converter.getUIResourceUnit]',error);
        }
        return value;
    },
    getSecsToHHmmss: function(seconds) {
        if (seconds) {
            const hh = Math.floor(seconds/3600);
            const mm = Math.floor((seconds - hh*3600) / 60 );
            const ss = +((seconds -(hh*3600)-(mm*60)) / 1);
            return (hh<10?`0${hh}`:`${hh}`) + ':' + (mm<10?`0${mm}`:`${mm}`) + ':' + (ss<10?`0${ss}`:`${ss}`);
        }
        return seconds;
    },
    getHHmmssToSecs: function(seconds) {
        if (seconds) {
            const strSeconds = _.split(seconds, ":");
            return strSeconds[0]*3600 + strSeconds[1]*60 + Number(strSeconds[2]);
        }
        return 0;
    },
    radiansToDegree: function(object) {
        for(let type in object) {
            if (type === 'transit_offset') {
                continue;
            }else if (typeof object[type] === 'object') {
               this.radiansToDegree(object[type]);
            } else {
                object[type] = (object[type] * 180) / Math.PI;
            }
        }
    },
    degreeToRadians(object) {
        for(let type in object) {
            if (type === 'transit_offset') {
                continue;
            } else if (typeof object[type] === 'object') {
                this.degreeToRadians(object[type]);
            } else {
                object[type] = object[type] * (Math.PI/180);
            }
        }
    },
    /**
     * Function to convert Angle 1 & 2 input value for UI. 
     */
    getAngleInput(prpInput, isDegree) {
        if (prpInput){
            const isNegative = prpInput<0;
            prpInput = prpInput * (isNegative?-1:1);
            const degrees = prpInput * 180 / Math.PI;
            if (isDegree) {
                const dd = Math.floor(prpInput * 180 / Math.PI);
                const mm = Math.floor((degrees-dd) * 60);
                const ss = round((degrees-dd-(mm/60)) * 3600,4);
                return (isNegative?'-':'') + (dd<10?`0${dd}`:`${dd}`) + 'd' + (mm<10?`0${mm}`:`${mm}`) + 'm' + (ss<10?`0${ss}`:`${ss}`) + 's';
            }   else {
                const hh = Math.floor(degrees/15);
                const mm = Math.floor((degrees - (hh*15))/15 * 60 );
                const ss = round((degrees -(hh*15)-(mm*15/60))/15 * 3600, 4);
                return (hh<10?`0${hh}`:`${hh}`) + 'h' + (mm<10?`0${mm}`:`${mm}`) + 'm' + (ss<10?`0${ss}`:`${ss}`) + 's';
            }
        } else {
            return isDegree?"0d0m0s":'0h0m0s';
        }
    },

    /**
     * Function to convert Angle 1 & 2 input value for Backend. 
     */
    getAngleOutput(prpOutput, isDegree) {
        if(prpOutput){
            const splitOutput = prpOutput.split(':');
            const seconds = splitOutput[2]?splitOutput[2].split('.')[0]:splitOutput[2];
            let milliSeconds = prpOutput.split('.')[1] || '0000';
            milliSeconds = milliSeconds.padEnd(4,0);
            if (isDegree) {
                return ((splitOutput[0]*1 + splitOutput[1]/60 + seconds/3600 + milliSeconds/36000000)*Math.PI/180);
            }   else {
                return ((splitOutput[0]*15 + splitOutput[1]/4  + seconds/240 + milliSeconds/2400000)*Math.PI/180);
            }
        }else{
            return "00:00:00.0000";
        }
    },
    /**
     * Function to check the input type/format based on the matching predeifined regular expression. It can be any of the supported format
     * like dms, hms, degrees, hours, radians. Example values are 10h10m10s, 10h10m10.1234s, 10:10:10 hour, 10:10:10.1234 hours,
     * 10.1234 hours, 15d15m15s, 15d15m15.1515s, 15:15:15 degree, 15:15:15.1515 degrees, 15.1515 degrees. If only number is entered, it will
     * be considered as radians.
     * @param {String} input - value entered in the angle field. 
     * @returns String - the format of the input identified. If no format is identified, returns null. 
     */
    getAngleInputType(input) {
        if (input.match(/^\-?((\d0?d(0?0m)(0?0(\.\d{1,4})?s))|(([0-8]?\d)d(([0-5]?\d)m)(([0-5]?\d)(\.\d{1,4})?s)))$/)) {
            return 'dms';
        }   else if (input.match(/^([0-1]?\d|2[0-3])h([0-5]?\d)m([0-5]?\d)(\.\d{1,4})?s$/)) {
            return 'hms';
        }   else if (input.match(/^-?((\d0(.0{1,4})?)|([0-8]?\d)(\.\d{1,4})?) ?d(egree)?s?$/)) {
            return 'degrees';
        }   else if (input.match(/^([0-1]?\d|2[0-3])(\.\d{1,4})? ?h(our)?s?$/)) {
            return 'hours';
        }   else if (input.match(/^\-?((\d0?:(00:)(00))|(([0-8]\d):(([0-5]\d):)(([0-5]\d)(\.\d{1,4})?))) ?d(egree)?s?$/)) {
            return 'deg_format';
        }   else if (input.match(/^([0-1]?\d|2[0-3]):([0-5]?\d):([0-5]?\d)(\.\d{1,4})? ?h(our)?s?$/)) {
            return 'hour_format';
        }   else if (input.match(/^\-?[0-6](\.\d{1,20})?$/)) {
            return 'radians';
        }   else {
            return null;
        }
    },
    /**
     * Function to validate an angle input value based on  the format entered and converrt to radians
     * @param {String} angle - value to be parsed to radians.
     * @returns number - radian value.
     */
    parseAngle(angle) {
        let radians = 0;
        const angleType = this.getAngleInputType(angle);
        switch(angleType) {
            case 'dms' : {
                radians = this.convertAngleToRadian(angle);
                break;
            }
            case 'hms' : {
                radians = this.convertAngleToRadian(angle);
                break;
            }
            case 'degrees' : {
                radians = this.convertToRadians(angle.replace('d','').replace('egree','').replace('s','').replace(' ',''));
                break;
            }
            case 'hours' : {
                radians = this.convertToRadians(angle.replace('h','').replace('our','').replace('s','').replace(' ','') * 15);
                break;
            }
            case 'deg_format' : {
                radians  = this.getAngleOutput(angle.replace('d','').replace('egree','').replace('s','').replace(' ',''), true);
                break;
            }
            case 'hour_format' : {
                radians = this.getAngleOutput(angle.replace('h','').replace('our','').replace('s','').replace(' ',''), false);
                break;
            }
            case 'radians': {
                radians = parseFloat(angle);
                break;
            }
            default: {
                break;
            }
        }
        return radians;
    },
    /**
     * Convert a degree value to radian
     * @param {*} angle 
     * @returns 
     */
    convertToRadians(angle) {
        return angle * Math.PI /180;
    },
    /**
     * Converts a formatted string to a radian value
     * @param {String} angle 
     * @returns 
     */
    convertAngleToRadian(angle) {
        let radian = 0;
        const isDegree = angle.indexOf('d') > 0;
        const degreeHourSplit = isDegree?angle.split("d"):angle.split("h");
        let degreeHour = degreeHourSplit[0];
        const isNegativeAngle = parseInt(degreeHour)<0;
        degreeHour = isNegativeAngle?degreeHour*-1:degreeHour;
        const minuteSplit = degreeHourSplit[1].split('m');
        const minute = minuteSplit[0];
        const second = minuteSplit[1].replace('s','');
        if (isDegree) {
            radian = this.convertToRadians((degreeHour*1 + minute/60 + second/3600));
            radian = isNegativeAngle?radian*-1:radian;
        }   else {
            radian = this.convertToRadians((degreeHour*15 + minute/4 + second/240));
        }
        return radian;
    }
};

export default UnitConverter;