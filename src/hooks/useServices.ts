"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Types ──────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  price: number;
  priceLabel: string;
  category: string;
  subcategory: string;
  division: "auto" | "marine" | "fleet" | "rv";
  type?: string;
  sortOrder: number;
  isActive: boolean;
  showOnBooking: boolean;
  showOnPricing: boolean;
  bundleItems: string[];
  featured?: boolean;
  notes: string;
  laborHours: number;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface ServiceCategory {
  id: string;
  name: string;
  division: "auto" | "marine" | "fleet" | "rv";
  description: string;
  startingAt: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface UseServicesOptions {
  division?: "auto" | "marine" | "fleet" | "rv";
  category?: string;
  activeOnly?: boolean;
}

export interface UseServicesReturn {
  services: Service[];
  categories: ServiceCategory[];
  loading: boolean;
  error: string | null;
}

// ── Hook ───────────────────────────────────────────────────

export function useServices(
  options: UseServicesOptions = {}
): UseServicesReturn {
  const { division, category, activeOnly } = options;

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to services collection
  useEffect(() => {
    const constraints: QueryConstraint[] = [];

    if (division) {
      constraints.push(where("division", "==", division));
    }
    if (category) {
      constraints.push(where("category", "==", category));
    }
    if (activeOnly) {
      constraints.push(where("isActive", "==", true));
    }

    const q = query(collection(db, "services"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Service[];
        docs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setServices(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [division, category, activeOnly]);

  // Subscribe to serviceCategories collection
  useEffect(() => {
    const constraints: QueryConstraint[] = [];

    if (division) {
      constraints.push(where("division", "==", division));
    }
    if (activeOnly) {
      constraints.push(where("isActive", "==", true));
    }

    const q = query(collection(db, "serviceCategories"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ServiceCategory[];
        docs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setCategories(docs);
      },
      (err) => {
        setError(err.message);
      }
    );

    return unsubscribe;
  }, [division, activeOnly]);

  return { services, categories, loading, error };
}
