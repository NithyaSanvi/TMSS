/**
 * Global Growl component to be used by all components in the app/route.
 * This enables displaying growl message even after moving to other route/page.
 */
export let appGrowl = null;

/**
 * To set the global reference for growl component from one main component in the app.
 * @param {Object} appGrowlRef 
 */
export const setAppGrowl = function(appGrowlRef) {
    appGrowl = appGrowlRef;
}
