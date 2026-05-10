import type { WizardSelection } from './lineItems';

export type CreateBookingInput =
  | {
      source: 'public_wizard';
      selection: WizardSelection[];
      customer: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        address?: string;
      };
      vehicle?: {
        year?: number;
        make?: string;
        model?: string;
        trim?: string;
        vin?: string;
      };
      preferredDate?: string;
      timeWindow?: 'morning' | 'midday' | 'afternoon' | 'late';
      notes?: string;
    }
  | {
      source: 'admin_new_booking';
    }
  | {
      source: 'admin_new_customer';
    }
  | {
      source: 'field_create';
    };

export function createBooking(_input: CreateBookingInput): never {
  throw new Error(
    'createBooking: not implemented in A1. Lands in A3 with refactor of all four current writers.'
  );
}
