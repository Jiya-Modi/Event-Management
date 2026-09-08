importScripts(
  'https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js',
);

importScripts(
  'https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js',
);

const firebaseConfig = {
  apiKey: 'AIzaSyAz8XfF_1t-GXhejgtLhpCEJ_GpciGv1ks',
  authDomain: 'event-management-27772.firebaseapp.com',
  projectId: 'event-management-27772',
  storageBucket: 'event-management-27772.firebasestorage.app',
  messagingSenderId: '730518034910',
  appId: '1:730518034910:web:8cd56cf25b3871cd07654f',
};

firebase.initializeApp(firebaseConfig); //firebase connected to project

const messaging = firebase.messaging(); //creates firebase messaging instance

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle =
    payload.notification?.title || 'Firebase Notification';

  const notificationOptions = {
    body: payload.notification?.body || 'You received a notification.',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions); // self refers to current service worker
  //current showNotification -> Browser Notification
});
