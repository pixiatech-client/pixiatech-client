const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-9205859220-a6440.firebasestorage.app',
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function deleteAnonymousUsers() {
  let nextPageToken;
  let totalDeleted = 0;
  let totalFirestore = 0;
  let totalStorage = 0;

  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);

    for (const user of result.users) {
      const isAnonymous =
        !user.email &&
        !user.phoneNumber &&
        user.providerData.length === 0;

      if (!isAnonymous) continue;

      const uid = user.uid;
      console.log(`\n--- Suppression: ${uid} ---`);

      try {
        // 1. Delete Firestore user document
        const userRef = db.collection('users').doc(uid);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          await userRef.delete();
          totalFirestore++;
          console.log(`  -> users/${uid} supprimé`);
        }

        // 2. Delete notifications for this user
        const notifsSnap = await db.collection('notifications')
          .where('userId', '==', uid)
          .get();
        if (!notifsSnap.empty) {
          const batch = db.batch();
          notifsSnap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          totalFirestore += notifsSnap.size;
          console.log(`  -> ${notifsSnap.size} notification(s) supprimée(s)`);
        }

        // 3. Find and delete all chats where user is a participant
        const chatsSnap = await db.collection('chats')
          .where('participants', 'array-contains', uid)
          .get();

        for (const chatDoc of chatsSnap.docs) {
          const chatId = chatDoc.id;

          // Delete all messages subcollection
          const messagesSnap = await db
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .get();

          if (!messagesSnap.empty) {
            const batch = db.batch();
            messagesSnap.docs.forEach(m => batch.delete(m.ref));
            await batch.commit();
            totalFirestore += messagesSnap.size;
            console.log(`  -> chat ${chatId}: ${messagesSnap.size} message(s) supprimé(s)`);
          }

          // Delete Storage files for this chat
          try {
            const [files] = await bucket.getFiles({ prefix: `chats/${chatId}/` });
            if (files.length > 0) {
              await Promise.all(files.map(f => f.delete()));
              totalStorage += files.length;
              console.log(`  -> chat ${chatId}: ${files.length} fichier(s) supprimé(s)`);
            }
          } catch (e) {
            console.warn(`  -> chat ${chatId}: erreur Storage: ${e.message}`);
          }

          // Delete chat document
          await chatDoc.ref.delete();
          totalFirestore++;
          console.log(`  -> chat ${chatId} supprimé`);
        }

        // 4. Delete user uploads
        try {
          const [uploads] = await bucket.getFiles({ prefix: `uploads/${uid}` });
          if (uploads.length > 0) {
            await Promise.all(uploads.map(f => f.delete()));
            totalStorage += uploads.length;
            console.log(`  -> ${uploads.length} upload(s) supprimé(s)`);
          }
        } catch (e) {
          // No uploads, skip
        }

        // 5. Delete the Auth account (last, after all data cleanup)
        await admin.auth().deleteUser(uid);
        totalDeleted++;
        console.log(`  -> Auth compte supprimé ✓`);
      } catch (error) {
        console.error(`  ERREUR: ${error.message}`);
      }
    }

    nextPageToken = result.pageToken;
  } while (nextPageToken);

  console.log(`\n========================================`);
  console.log(`✅ ${totalDeleted} utilisateur(s) anonyme(s) supprimé(s)`);
  console.log(`📄 ${totalFirestore} document(s) Firestore supprimé(s)`);
  console.log(`🗄️  ${totalStorage} fichier(s) Storage supprimé(s)`);
  console.log(`========================================`);
}

deleteAnonymousUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
