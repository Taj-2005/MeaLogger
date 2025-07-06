export interface Meal {
  id: string;
  title: string;
  mealType: string;
  date: string;
  timestamp: string;
  imageUri?: string;
  imageUrl?: string;
  calories?: number;
}