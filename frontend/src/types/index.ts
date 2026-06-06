export interface Medicine {
  id: string;
  name: string;
  brand: string;
  category: 'prescription' | 'otc' | 'wellness' | 'personal-care';
  price: number;
  image: string;
  prescriptionRequired: boolean;
  description: string;
  dosage: string;
  sideEffects: string[];
  safetyAdvice: string;
  inStock: boolean;
  rating: number;
  reviewsCount: number;
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface Address {
  fullName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  phone: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  shippingAddress: Address;
  paymentMethod: string;
  prescriptionUploaded: string | null;
  total: number;
  status: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  fullName: string;
  email: string;
  date: string;
  timeSlot: string;
  symptoms: string;
  doctor: {
    name: string;
    specialty: string;
    image: string;
  };
  status: string;
  createdAt: string;
}
