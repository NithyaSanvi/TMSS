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
    }
};

export default UnitConverter;
