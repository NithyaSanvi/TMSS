const UnitConverter = {
    resourceUnitMap: {'second':{display: 'Hours', conversionFactor: 3600, mode:'decimal', minFractionDigits:0, maxFractionDigits: 2 }, 
                      'byte': {display: 'TB', conversionFactor: (1024*1024*1024*1024), mode:'decimal', minFractionDigits:0, maxFractionDigits: 3}, 
                      'number': {display: 'Numbers', conversionFactor: 1, mode:'decimal', minFractionDigits:0, maxFractionDigits: 0}},

    getDBResourceUnit: function() {

    },
    getUIResourceUnit: function() {

    }
};

export default UnitConverter;