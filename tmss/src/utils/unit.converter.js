import _ from 'lodash';

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
        if(prpInput){
            const degrees = prpInput * 180 / Math.PI;
            if (isDegree) {
                const dd = Math.floor(prpInput * 180 / Math.PI);
                const mm = Math.floor((degrees-dd) * 60);
                const ss = +((degrees-dd-(mm/60)) * 3600).toFixed(0);
                return (dd<10?`0${dd}`:`${dd}`) + ':' + (mm<10?`0${mm}`:`${mm}`) + ':' + (ss<10?`0${ss}`:`${ss}`);
            }   else {
                const hh = Math.floor(degrees/15);
                const mm = Math.floor((degrees - (hh*15))/15 * 60 );
                const ss = +((degrees -(hh*15)-(mm*15/60))/15 * 3600).toFixed(0);
                return (hh<10?`0${hh}`:`${hh}`) + ':' + (mm<10?`0${mm}`:`${mm}`) + ':' + (ss<10?`0${ss}`:`${ss}`);
            }
        }else{
            return "00:00:00";
        }
    },

    /**
     * Function to convert Angle 1 & 2 input value for Backend. 
     */
    getAngleOutput(prpOutput, isDegree) {
        if(prpOutput){
            const splitOutput = prpOutput.split(':');
            if (isDegree) {
                return ((splitOutput[0]*1 + splitOutput[1]/60 + splitOutput[2]/3600)*Math.PI/180);
            }   else {
                return ((splitOutput[0]*15 + splitOutput[1]/4  + splitOutput[2]/240)*Math.PI/180);
            }
        }else{
            return "00:00:00";
        }
        
    }
};

export default UnitConverter;
