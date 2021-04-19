import $RefParser from "@apidevtools/json-schema-ref-parser";
import _ from 'lodash';
const axios = require('axios');

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
    /**
     * 
     * @param {String} timestamps - Date in 'YYYY-MM-DD' format. Multiples dates are separated by commas (2020-08-15, 2021-01-26).
     */
    getAllStationSunTimings: async(timestamps) => {
      try {
        let allStations = (await axios.get("/api/station_groups/stations/1/All")).data.stations;
        let allStationSuntimes = (await axios.get(`/api/util/sun_rise_and_set?stations=${allStations.join(",")}&timestamps=${timestamps}`)).data;
        return allStationSuntimes;
      } catch(error) {
        console.error(error);
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
    },
    resolveSchema: async function(schema) {
      let properties = schema.properties;
      schema.definitions = schema.definitions?schema.definitions:{};
      if (properties) {
          for (const propertyKey in properties) {
              let property = properties[propertyKey];
              if (property["$ref"] && !property["$ref"].startsWith("#")) {    // 1st level reference of the object
                  const refUrl = property["$ref"];
                  let newRef = refUrl.substring(refUrl.indexOf("#"));
                  let defKey = refUrl.substring(refUrl.lastIndexOf("/")+1);
                  schema.definitions[defKey] = (await $RefParser.resolve(refUrl)).get(newRef);
                  property["$ref"] = newRef;
                  if(schema.definitions[defKey].type && (schema.definitions[defKey].type === 'array'
                      || schema.definitions[defKey].type === 'object')){
                      let resolvedItems = await this.resolveSchema(schema.definitions[defKey]);
                      if (resolvedItems.items && resolvedItems.items['$ref'] && _.keys(resolvedItems.definitions).length===1) {
                          const resolvedRefKey = resolvedItems.items['$ref'];
                          resolvedItems.items = resolvedItems.definitions[resolvedRefKey.substring(resolvedRefKey.lastIndexOf("/")+1)];
                      } else {
                        schema.definitions = {...schema.definitions, ...resolvedItems.definitions};
                      }
                      delete resolvedItems['definitions'];
                  }
              }   else if(property["type"] === "array") {             // reference in array items definition
                  let resolvedItems = await this.resolveSchema(property["items"]);
                  schema.definitions = {...schema.definitions, ...resolvedItems.definitions};
                  delete resolvedItems['definitions'];
                  property["items"] = resolvedItems;
              }   else if(property["type"] === "object" && property.properties) {
                  property = await this.resolveSchema(property);
                  schema.definitions = {...schema.definitions, ...property.definitions};
                  delete property['definitions'];
              }
              properties[propertyKey] = property;
          }
      }   else if (schema["oneOf"] || schema["anyOf"]) {             // Reference in OneOf/anyOf array
          let defKey = schema["oneOf"]?"oneOf":"anyOf";
          let resolvedOneOfList = []
          for (const oneOfProperty of schema[defKey]) {
              const resolvedOneOf = await this.resolveSchema(oneOfProperty);
              resolvedOneOfList.push(resolvedOneOf);
              if (resolvedOneOf.definitions) {
                schema.definitions = {...schema.definitions, ...resolvedOneOf.definitions};
              }
          }
          schema[defKey] = resolvedOneOfList;
      }   else if (schema["$ref"] && !schema["$ref"].startsWith("#")) {   //reference in oneOf list item
          const refUrl = schema["$ref"];
          let newRef = refUrl.substring(refUrl.indexOf("#"));
          let defKey = refUrl.substring(refUrl.lastIndexOf("/")+1);
          schema.definitions[defKey] = (await $RefParser.resolve(refUrl)).get(newRef);
          if (schema.definitions[defKey].properties || schema.definitions[defKey].type === "object"
                || schema.definitions[defKey].type === "array") {
              let property = await this.resolveSchema(schema.definitions[defKey]);
              schema.definitions = {...schema.definitions, ...property.definitions};
              delete property['definitions'];
              schema.definitions[defKey] = property;
          }
          schema["$ref"] = newRef;
      }   else if(schema["type"] === "array") {             // reference in array items definition
          let resolvedItems = await this.resolveSchema(schema["items"]);
          schema.definitions = {...schema.definitions, ...resolvedItems.definitions};
          delete resolvedItems['definitions'];
          schema["items"] = resolvedItems;
      }
      return schema;
  },
  localStore:function(data){
    const {type,key,value}=data;
    if(type=='set'){
      localStorage.setItem(key,JSON.stringify(value));
    }else if(type=='get'){
      return JSON.parse(localStorage.getItem(key));
    }else if(type=='remove'){
      localStorage.removeItem(key);
    }
  }
}

export default UtilService;