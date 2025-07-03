// This file is a central place for all server actions.
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod';
import { type Customer, type MeasurementSet, type OrderStatus, type PaymentStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// --- In-Memory Database ---
// This is a simple in-memory database. Data will be reset on server restart.
let customers: Customer[] = [];
let nextCustomerId = 1;
let nextMeasurementSetId = 1;

// Seed with some initial data for demonstration
if (customers.length === 0) {
    customers.push({
        id: String(nextCustomerId++),
        createdAt: new Date('2023-10-26T10:00:00Z').toISOString(),
        name: 'Jane Doe',
        nic: '199012345V',
        contact: 'jane.doe@example.com',
        orderHistory: '2 slim-fit shirts (blue, white), 1 pair of trousers (grey)',
        preferences: 'Prefers classic colors, comfortable fit, and natural fabrics like cotton and linen.',
        measurementSets: [
            {
                id: String(nextMeasurementSetId++),
                date: new Date('2023-11-15T11:00:00Z').toISOString(),
                measurements: [
                    { label: "Chest", value: 36 },
                    { label: "Waist", value: 28 },
                    { label: "Hips", value: 38 },
                    { label: "Sleeve Length", value: 23 },
                ],
                jobNumber: 'A-101',
                requestDate: new Date('2023-11-10T09:00:00Z').toISOString(),
                paymentStatus: 'Paid',
                orderStatus: 'Handed Over',
                completionDate: new Date('2023-11-25T17:00:00Z').toISOString(),
                handoverDate: new Date('2023-11-26T12:00:00Z').toISOString(),
            }
        ]
    });
}
// --- End of In-Memory Database ---


// Auth Actions (Simplified for local development)
const adminUser = { email: 'admin@example.com', password: 'password' };

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});


export async function login(formData: FormData) {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }
  
  const { email, password } = validatedFields.data;

  // In a real app, use a secure auth provider. This is for demonstration only.
  if (email === adminUser.email && password === adminUser.password) {
    cookies().set('session', 'true', { httpOnly: true, path: '/' });
    return redirect('/dashboard');
  }

  return { error: 'Invalid email or password. Hint: admin@example.com / password' };
}

export async function signup(formData: FormData) {
  // This is a mock signup. In this local version, there's only one admin.
  // We'll treat signup as a login attempt. The form suggests creating an account
  // but for local dev, we just have one.
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }
  return { error: "This is a local version with one admin account. Please use the login form." };
}

export async function logout() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
  return redirect('/login');
}

export async function checkAuth() {
    const session = cookies().get('session');
    if (!session?.value) {
        redirect('/login');
    }
}

export async function isLoggedIn() {
    const session = cookies().get('session');
    return !!session?.value;
}


// Customer Actions
const customerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  nic: z.string().min(5, "NIC must be at least 5 characters."),
  contact: z.string().min(5, "Contact information is required."),
  orderHistory: z.string().optional(),
  preferences: z.string().optional(),
});

export async function createCustomer(formData: FormData) {
    const validatedFields = customerFormSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { error: 'Invalid fields', fields: validatedFields.error.flatten().fieldErrors };
    }
    
    const newCustomerData = validatedFields.data;

    const newCustomer: Customer = {
        ...newCustomerData,
        id: String(nextCustomerId++),
        createdAt: new Date().toISOString(),
        measurementSets: [],
    };
    customers.push(newCustomer);
    
    revalidatePath('/dashboard');
    return redirect(`/dashboard/customer/${newCustomer.id}`);
}

export async function updateCustomer(customerId: string, formData: FormData) {
    const validatedFields = customerFormSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { error: 'Invalid fields', fields: validatedFields.error.flatten().fieldErrors };
    }

    const customerIndex = customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) {
        return { error: 'Customer not found.' };
    }
    
    customers[customerIndex] = { ...customers[customerIndex], ...validatedFields.data };

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/customer/${customerId}`);
    return { success: true };
}

export async function deleteCustomer(customerId: string) {
    const initialLength = customers.length;
    customers = customers.filter(c => c.id !== customerId);

    if (customers.length === initialLength) {
        return { error: 'Failed to delete customer.' };
    }

    revalidatePath('/dashboard');
    return redirect('/dashboard');
}


// Measurement Actions
export async function addMeasurementSet(customerId: string, measurementSet: Omit<MeasurementSet, 'id' | 'date'>) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        return { error: 'Customer not found.' };
    }

    const newSet: MeasurementSet = {
        ...measurementSet,
        id: String(nextMeasurementSetId++),
        date: new Date().toISOString(),
    };
    customer.measurementSets.push(newSet);
    
    revalidatePath(`/dashboard/customer/${customerId}`);
    return { success: true };
}

export async function updateOrderStatus(setId: string, customerId: string, newStatus: OrderStatus) {
    for (const customer of customers) {
        const set = customer.measurementSets.find(s => s.id === setId);
        if (set) {
            set.orderStatus = newStatus;
            if (newStatus === 'Completed') {
                set.completionDate = new Date().toISOString();
            } else if (newStatus === 'Handed Over') {
                set.handoverDate = new Date().toISOString();
            }
            revalidatePath(`/dashboard/customer/${customerId}`);
            return { success: true };
        }
    }
    return { error: 'Failed to update order status.' };
}

export async function updatePaymentStatus(setId: string, customerId: string, newStatus: PaymentStatus) {
    for (const customer of customers) {
        const set = customer.measurementSets.find(s => s.id === setId);
        if (set) {
            set.paymentStatus = newStatus;
            revalidatePath(`/dashboard/customer/${customerId}`);
            return { success: true };
        }
    }
    return { error: 'Failed to update payment status.' };
}


// Data Fetching
export async function getCustomers() {
    // Return a deep copy to prevent direct mutation of the in-memory data
    return JSON.parse(JSON.stringify(customers)) as Customer[];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        return null;
    }
    // Return a deep copy
    return JSON.parse(JSON.stringify(customer));
}
