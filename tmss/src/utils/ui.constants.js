const UIConstants = {
    tooltipOptions: {position: 'left', event: 'hover', className:"p-tooltip-custom"},
    timeline: {
        types: { NORMAL: "NORMAL", WEEKVIEW:"WEEKVIEW"}
    },
    httpStatusMessages: {
        400: {severity: 'error', summary: 'Error', sticky: true, detail: 'Error while process request, please contact system admin'},
        401: {severity: 'error', summary: 'Error', sticky: true, detail: 'Not authenticated, Please retry to login with valid credential'},
        403: {severity: 'error', summary: 'Error', sticky: true, detail: 'Unknown request, please contact system admin'},
        404: {severity: 'error', summary: 'Error', sticky: true, detail: 'URL is not recognized, please contact system admin'},
        408: {severity: 'error', summary: 'Error', sticky: true, detail: 'Request is taking more time to response, please contact system admin'},
        500: {severity: 'error', summary: 'Error', sticky: true, detail: 'Internal Server Error, URL may not exists, please contact system admin'},
        503: {severity: 'error', summary: 'Error', sticky: true, detail: 'Server not available, please check system admin'},
    },
    CALENDAR_DATE_FORMAT: 'yy-mm-dd',
    CALENDAR_DATETIME_FORMAT : 'YYYY-MM-DD HH:mm:ss',
    CALENDAR_TIME_FORMAT: 'HH:mm:ss',
    CALENDAR_DEFAULTDATE_FORMAT: 'YYYY-MM-DD',
    UTC_DATE_TIME_FORMAT: "YYYY-MM-DDTHH:mm:ss",
    UTC_DATE_TIME_MS_FORMAT: "YYYY-MM-DDTHH:mm:ss.SSSSS"
}

export default UIConstants;