const admin = require('firebase-admin');
const logger = require('../utils/logger');

const initFirebase = () => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
    logger.info('✅ Firebase initialized successfully');
  } catch (error) {
    logger.error('❌ Firebase initialization failed:', error.message);
  }
};

const sendPushNotification = async ({ token, title, body, data = {} }) => {
  try {
    const message = {
      token,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    logger.error('❌ Push notification failed:', error.message);
    throw error;
  }
};

const sendMulticastNotification = async ({ tokens, title, body, data = {} }) => {
  try {
    const message = {
      tokens,
      notification: { title, body },
      data,
    };
    const response = await admin.messaging().sendEachForMulticast(message);
    return response;
  } catch (error) {
    logger.error('❌ Multicast notification failed:', error.message);
    throw error;
  }
};

module.exports = { initFirebase, sendPushNotification, sendMulticastNotification };