import React, {useEffect} from "react";
import axios from "axios";
import { appGrowl } from './layout/components/AppGrowl';
import UIConstants from './utils/ui.constants';
import Auth from './authenticate/auth';
/**
 * Trigger and validate the response for https status code
 * @param {*} Wrapped 
 * @returns 
 */
const handleResponse= Wrapped => {
    function HandleResponse(props) {
        useEffect(()=>{
            axios.interceptors.response.use(function (response) {
                return response;
            }, function (error) {
                showMessage(error.response);
                return Promise.reject(error);
            });
        })
        return (
            <Wrapped {...props} />
        );
    }

    /**
     * Catch relavent http status code details to show in growl
     * @param {*} response 
     */
    function showMessage(response) {
        const httpStatusMsg = UIConstants.httpStatusMessages[response.status];
        if(httpStatusMsg) {
            appGrowl.show({severity: httpStatusMsg.severity, summary: httpStatusMsg.summary, sticky: httpStatusMsg.sticky, detail: '['+response.status+'] '+JSON.stringify(response.statusText)+ ' ['+httpStatusMsg.detail+']'});
        }   else {
            appGrowl.show({severity: 'error', summary: 'Error', sticky: 'true', detail: '['+response.status+'] '+JSON.stringify(response.statusText)+ '   '+JSON.stringify(response.data)});
        }
        if (response.status === 401) {
            Auth.logout();
            window.location.href = "/login";
        }
    }
    return HandleResponse;
}

export default handleResponse;