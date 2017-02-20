(function(){
  'use strict';

  if (!('caches' in window)) {
    console.log('Caches API not found');
    return;
  }

  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
  }

  if (!('serviceWorker' in navigator)) {
    console.log('Service worker not supported');
    return;
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function sendSubscription(subscription){
    fetch('/subscription', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ subscription: subscription }),
    });
  }

  navigator.serviceWorker
    .register('/sw.js')
    .then(function(registration){
      console.log('Registered: ', registration);
      registration.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(window.pushKey),
        })
        .then(function(subscription){
          console.log('Endpoint URL: ', subscription.endpoint);
          // send subscription object to server
          sendSubscription(subscription);
        })
        .catch(function(err){
          if (Notification.permission === 'denied') {
            console.log('Permission for notification was denied');
          } else {
            console.log('Unable to subscribe to push', err);
          }
        });
    })
    .catch(function(error){
      console.log('Error: ', error);
    });

  Notification.requestPermission(function(status) {
    console.log('Notification permission status: ', status);
  });
}());

