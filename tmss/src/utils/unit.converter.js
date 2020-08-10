const UnitConverter = {
    resourceUnitMap: {'time':{display: 'Hours', conversionFactor: 3600, mode:'decimal', minFractionDigits:0, maxFractionDigits: 2 }, 
                      'bytes': {display: 'TB', conversionFactor: (1024*1024*1024*1024), mode:'decimal', minFractionDigits:0, maxFractionDigits: 3}, 
                      'number': {display: 'Numbers', conversionFactor: 1, mode:'decimal', minFractionDigits:0, maxFractionDigits: 0}},

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
    }
};

export default UnitConverter; 