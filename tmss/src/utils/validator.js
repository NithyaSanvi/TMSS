const Validator = {
    validateTime(value) {
        const splitOutput = value.split(':');
        if (splitOutput.length < 3) {
            return false;
        }   else {
              if (parseInt(splitOutput[0]) > 23 || parseInt(splitOutput[1])>59 || parseInt(splitOutput[2])>59) {
                  return false;
              }
              const timeValue = parseInt(splitOutput[0]*60*60) + parseInt(splitOutput[1]*60) + parseInt(splitOutput[2]);
              if (timeValue >= 86400) {
                  return false;
              }
          }
            return true;
        },
        validateAngle(value) {
            const splitOutput = value.split(':');
            if (splitOutput.length < 3) {
                return false;
            }   else {
                  if (parseInt(splitOutput[0]) > 90 || parseInt(splitOutput[1])>59 || parseInt(splitOutput[2])>59) {
                      return false;
                  }
                  const timeValue = parseInt(splitOutput[0]*60*60) + parseInt(splitOutput[1]*60) + parseInt(splitOutput[2]);
                  if (timeValue > 324000) {
                      return false;
                  }
              }
              return true;
            }
};

export default Validator;
