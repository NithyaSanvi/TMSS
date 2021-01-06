const axios = require('axios');

axios.defaults.headers.common['Authorization'] = 'Basic dGVzdDp0ZXN0';
/**
 * Utility Service to fetch miscellaneous data from the server
 */
const UtilService = {
    /** Function to fetch current UTC time from the server which is the System Clock */
    getUTC: async function() {
        try {
          const url = `/api/util/utc`;
          const response = await axios.get(url);
          return response.data;
        } catch (error) {
          console.error(error);
        }
    },
    /** Function to fetch the equivalent LST (Local Sidereal Time) for a UTC timestamp. 
     * 'timestamp' should be a string in "YYYY-MM-DDTHH:mm:ss" format. 
     * Data fetched is stored in local storage to avoid repeated request to server for the same value.*/
    getLST: async (timestamp) => {
      try {
        let localUtcLstMap = localStorage.getItem('UTC_LST_MAP');
        if (localUtcLstMap) {
          localUtcLstMap = JSON.parse(localUtcLstMap);
          if (localUtcLstMap[timestamp]) {
            return Promise.resolve(localUtcLstMap[timestamp]);
          }
        }
        localUtcLstMap = localUtcLstMap?localUtcLstMap:{};
        const url = `/api/util/lst?timestamp=${timestamp}`;
        const response = await axios.get(url);
        const utcToLST = response.data.replace('h',':').replace('m',':').replace('s','');
        localUtcLstMap[timestamp] = utcToLST;
        localStorage.setItem('UTC_LST_MAP', JSON.stringify(localUtcLstMap));
        return utcToLST;
      } catch(error) {
        console.error(error);
      }
    },
    /** Function to fetch sun timings from the backend for single station. */
    getSunTimings: async(timestamp, station) => {
      try {
        station = station?station:"CS001";
        let stationTimestamp = (station?`${station}-`:"") + timestamp;
        let localSunTimeMap = localStorage.getItem('SUN_TIME_MAP');
        if (localSunTimeMap) {
          localSunTimeMap = JSON.parse(localSunTimeMap);
          if (localSunTimeMap[stationTimestamp]) {
            return Promise.resolve(localSunTimeMap[stationTimestamp]);
          }
        } else {
          localSunTimeMap = {};
        }
        const url = `/api/util/sun_rise_and_set?stations=${station?station:'CS001'}&timestamps=${timestamp}`;
        const stationSunTimings = (await axios.get(url)).data;
        let sunTimings = {sun_rise: stationSunTimings[station]['sunrise'][0], sun_set: stationSunTimings[station]['sunset'][0]};
        localSunTimeMap[stationTimestamp] = sunTimings;
        localStorage.setItem('SUN_TIME_MAP', JSON.stringify(localSunTimeMap));
        return sunTimings;
      } catch(error) {
        console.error(error);
        return  null;
      }
    },
    /** Gets all reservations in the system */
    getReservations: async() => {
      try {
        const reservations = (await axios.get("/api/reservation")).data.results;
        return reservations;
      } catch(error) {
        console.error(error);
      }
    },
    /** Gets reservation templates in the system */
    getReservationTemplates: async() => {
      try {
        const templates = (await axios.get("/api/reservation_template")).data.results;
        return templates;
      } catch(error) {
        console.error(error);
      }
    }
}

export default UtilService;