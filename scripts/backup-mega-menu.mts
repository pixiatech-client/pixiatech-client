import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { firebaseConfig } from '../src/firebase/config';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function runBackup() {
  console.log('[BACKUP] Lecture de settings/mega_menu via client Firestore...');
  const ref = doc(db, 'settings', 'mega_menu');
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    console.error('[BACKUP-ERROR] Le document settings/mega_menu n\'existe pas !');
    process.exit(1);
  }

  const data = snap.data();
  if (!data) {
    console.error('[BACKUP-ERROR] Données vides dans settings/mega_menu !');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDocId = `mega_menu_backup_${timestamp}`;

  // 1. Sauvegarde locale sur disque
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const localFilePath = path.join(backupDir, `${backupDocId}.json`);
  fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`[BACKUP] Sauvegarde locale écrite avec succès : ${localFilePath}`);

  const originalKeys = Object.keys(data);
  const columnsCount = Array.isArray(data.columns) ? data.columns.length : 0;
  let totalItemsCount = 0;
  if (Array.isArray(data.columns)) {
    for (const col of data.columns) {
      if (Array.isArray(col.items)) {
        totalItemsCount += col.items.length;
      }
    }
  }

  console.log('[BACKUP-SUCCESS] Vérification des données sauvegardées :');
  console.log(`  - Clés document : ${originalKeys.join(', ')}`);
  console.log(`  - Colonnes : ${columnsCount}`);
  console.log(`  - Items : ${totalItemsCount}`);
  console.log(`  - Fichier local vérifiable : ${localFilePath}`);
  console.log(`  - Taille : ${fs.statSync(localFilePath).size} octets`);
}

runBackup().then(() => process.exit(0)).catch((err) => {
  console.error('[BACKUP-FATAL]', err);
  process.exit(1);
});
