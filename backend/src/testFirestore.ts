import { db } from './config/firebase';

(async () => {
  const docRef = db.collection('test').doc('hello');
  await docRef.set({ msg: 'Firestore is connected!' });
  console.log('✅ Firestore write successful');
})();
