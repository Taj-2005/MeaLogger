import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Save meal details (without image) to Firestore
export async function saveMealToFirestore(mealId: string, mealData: any) {
  const mealRef = doc(collection(db, 'meals'), mealId);
  await setDoc(mealRef, mealData);
}

// Fetch all meals from Firestore
export async function fetchMealsFromFirestore() {
  const snapshot = await getDocs(collection(db, 'meals'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}