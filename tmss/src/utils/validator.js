const Validator = {
    validateTime(value) {
        const splitOutput = value.split(':');
        const seconds = splitOutput[2]?splitOutput[2].split('.')[0]:splitOutput[2];
        let milliSeconds = value.split('.')[1] || '0000';
        milliSeconds = milliSeconds.padEnd(4,0);
        if (splitOutput.length < 3) {
            return false;
        }   else {
            if (parseInt(splitOutput[0]) > 23 || parseInt(splitOutput[1])>59 || parseInt(splitOutput[2])>59) {
                return false;
            }
            const timeValue = parseInt(splitOutput[0]*60*60) + parseInt(splitOutput[1]*60) + parseInt(seconds) + milliSeconds/10000;
            if (timeValue >= 86400) {
                return false;
            }
        }
        return true;
    },
    validateAngle(value) {
        const splitOutput = value.split(':');
        const seconds = splitOutput[2]?splitOutput[2].split('.')[0]:splitOutput[2];
        let milliSeconds = value.split('.')[1] || '0000';
        milliSeconds = milliSeconds.padEnd(4,0);
        if (splitOutput.length < 3) {
            return false;
        }   else {
            if (parseInt(splitOutput[0]) > 90 || parseInt(splitOutput[1])>59 || parseInt(splitOutput[2])>59) {
                return false;
            }
            const timeValue = parseInt(splitOutput[0]*60*60) + parseInt(splitOutput[1]*60) + parseInt(seconds) + milliSeconds/10000;
            if (timeValue > 324000) {
                return false;
            }
        }
        return true;
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
