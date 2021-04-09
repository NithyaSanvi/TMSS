/**
 * PubSub Pattern
 * Pub - Publish
 * Sub - Subscribe
 * Currently we dont have any common medium to tranfer value from one component to another(not child component).
 * So by using pubsub, we can easily broadcast value and any component can listen to that
 */

export default () => {
    const subscribers = {}

    function publish(eventName, data) {
      if (!Array.isArray(subscribers[eventName])) {
        return
      }
      subscribers[eventName].forEach((callback) => {
        callback(data)
      })
    }

    function subscribe(eventName, callback) {
      if (!Array.isArray(subscribers[eventName])) {
        subscribers[eventName] = []
      }
      subscribers[eventName].push(callback)
    }

    return {
      publish,
      subscribe,
    }
  } 
