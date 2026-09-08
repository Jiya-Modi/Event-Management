const { initializeApp, cert } = require('firebase-admin/app');

const { getMessaging } = require('firebase-admin/messaging');

const serviceAccount = require('../../fcmServiceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount),
});

const messaging = getMessaging();

module.exports = {
  messaging,
};

//cert ->It is used to tell Firebase Admin:
//"Use this service-account JSON file as the credentials for authenticating my backend with Firebase."

//cert() creates a Firebase Admin credential object from the service-account certificate/credential
