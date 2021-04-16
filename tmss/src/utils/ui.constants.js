const UIConstants = {
    tooltipOptions: {position: 'left', event: 'hover', className:"p-tooltip-custom"},
    timeline: {
        types: { NORMAL: "NORMAL", WEEKVIEW:"WEEKVIEW"}
    },
    httpStatusMessages: {
        400: {severity: 'error', summary: 'Error', sticky: true, detail: 'Request data may be incorrect. Please try again or contact system admin'},
        401: {severity: 'error', summary: 'Error', sticky: true, detail: 'Not authenticated, please login with valid credential'},
        403: {severity: 'error', summary: 'Error', sticky: true, detail: "You don't have permissions to this action, please contact system admin"},
        404: {severity: 'error', summary: 'Error', sticky: true, detail: 'URL is not recognized, please contact system admin'},
        408: {severity: 'error', summary: 'Error', sticky: true, detail: 'Request is taking more time to response, please try again or contact system admin'},
        500: {severity: 'error', summary: 'Error', sticky: true, detail: 'Server could not process the request, please check the data submitted is correct or contact system admin'},
        503: {severity: 'error', summary: 'Error', sticky: true, detail: 'Server is not available, please try again or contact system admin'},
    },
    CALENDAR_DATE_FORMAT: 'yy-mm-dd',
    CALENDAR_DATETIME_FORMAT : 'YYYY-MM-DD HH:mm:ss',
    CALENDAR_TIME_FORMAT: 'HH:mm:ss',
    CALENDAR_DEFAULTDATE_FORMAT: 'YYYY-MM-DD',
    UTC_DATE_TIME_FORMAT: "YYYY-MM-DDTHH:mm:ss",
    UTC_DATE_TIME_MS_FORMAT: "YYYY-MM-DDTHH:mm:ss.SSSSS"
}

export default UIConstants;