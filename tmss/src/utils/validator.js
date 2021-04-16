import UnitConverter from "./unit.converter";

const Validator = {
    validateTime(value) {
        const angleType = UnitConverter.getAngleInputType(value);
        if (angleType && ['hms', 'hours', 'hour_format', 'radians'].indexOf(angleType)>=0) {
            if (angleType === 'radians' && (parseFloat(value)<0 || parseFloat(value) > 6.2831)) {
                return false;
            }
            return true;
        }
        return false;
    },
    validateAngle(value) {
        const angleType = UnitConverter.getAngleInputType(value);
        if (angleType && ['dms', 'degrees', 'deg_format', 'radians'].indexOf(angleType)>=0) {
            if (angleType === 'radians' && (parseFloat(value) < -1.57079632679489661923 || parseFloat(value) > 1.57079632679489661923)) {
                return false;
            }
            return true;
        }
        return false;
    },

    /**
     * Validates whether any of the given property values is modified comparing the old and new object.
     * @param {Object} oldObject - old object that is already existing in the state list
     * @param {Object} newObject - new object received from the websocket message
     * @param {Array} properties - array of string (name of the properties) to veriy
     */
    isObjectModified(oldObject, newObject, properties) {
        let isModified = false;
        // If oldObject is not found, the object should be got from server
        if(!oldObject && newObject) {
            return true;
        }
        for (const property of properties) {
            if (oldObject[property] !== newObject[property]) {
                isModified = true;
            }
        }
        return isModified;
    }
};

export default Validator;
