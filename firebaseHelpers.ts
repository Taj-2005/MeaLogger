import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function saveMealToFirestore(mealId: string, mealData: any) {
  const mealRef = doc(collection(db, 'meals'), mealId);
  await setDoc(mealRef, mealData);
}

export async function fetchMealsFromFirestore(userEmail: string) {
  const q = query(collection(db, 'meals'), where('userEmail', '==', userEmail));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}