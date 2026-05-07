'use client';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApp } from "firebase/app";

export async function uploadImage(file: File): Promise<string> {
  const firebaseApp = getApp();
  const storage = getStorage(firebaseApp);

  const fileName = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `uploads/${fileName}`);

  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}
