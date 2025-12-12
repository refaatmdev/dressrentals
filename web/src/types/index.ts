export interface User {
    uid: string;
    displayName: string;
    email: string;
    role: 'admin' | 'staff';
    isActive?: boolean; // Enable/Disable access
    photoURL?: string | null; // Avatar
    createdAt: Date;
}

export interface Dress {
    id: string;
    modelName: string; // Hebrew: שם הדגם
    imageUrl: string;
    galleryImages?: string[]; // Multiple images support
    qrCodeValue: string; // The string stored in the QR
    status: 'available' | 'rented' | 'cleaning' | 'repair';
    rentalPrice?: number; // Price per rental

    // Costs (Hidden from clients) - Object structure
    productionCosts: {
        fabricCost: number;     // עלות בדים
        jewelryCost: number;    // עלות תכשיטים/חרוזים
        paddingCost: number;    // עלות פדים/קאפים
        sewingCost: number;     // עלות תפירה
        additionalCosts?: { name: string; amount: number }[]; // Dynamic extra costs
        totalCost: number;      // Calculated automatically
    };

    staffNotes: string; // Internal notes (e.g., "Zipper is fragile")

    // Analytics
    rentalCount: number; // How many times rented
    scanCount?: number; // How many times scanned
    lastLocation: string; // e.g., "Tel Aviv", "Jerusalem"
    isArchived?: boolean; // Soft delete
    createdAt: Date;
}

export interface Client {
    id: string;
    fullName: string;
    phone: string; // Primary key for search
    email?: string;
    address?: string; // City/Street

    // Body Measurements (Critical for bridal shop)
    measurements?: {
        bust: number;
        waist: number;
        hips: number;
        height: number;
        shoulderToFloor?: number;
        notes?: string; // e.g. "Needs high heels"
    };

    createdAt: Date;
}

export interface Rental {
    id: string;
    dressId: string;
    dressName: string; // Denormalized for easy display
    clientId: string; // Foreign key to 'clients'
    clientName: string; // Snapshot for easy display
    clientPhone: string; // Snapshot for easy contact
    eventDate: Date; // Timestamp
    returnDate: Date; // Timestamp
    eventCity: string; // Where is the dress going?
    finalPrice: number; // The closed deal price
    paidAmount?: number; // Amount already paid
    status: 'active' | 'completed' | 'cancelled' | 'pending';
}

export interface TransactionItem {
    description: string;
    amount: number;
    quantity: number;
    rentalId?: string; // Link specific item to a rental for payment tracking
}

export interface Transaction {
    id: string;
    type: 'deposit' | 'final_payment' | 'sale'; // מקדמה / גמר חשבון / מכירה רגילה
    amount: number;
    paymentMethod: 'cash' | 'credit' | 'check' | 'bit';
    customerName: string;
    relatedRentalId?: string; // Optional link to a specific rental
    items?: TransactionItem[]; // For POS receipts
    notes?: string;
    timestamp: Date;
}

export interface Shift {
    id: string;
    employeeId: string;
    employeeName: string;
    startTime: Date;
    endTime?: Date; // Null if currently active
    totalHours?: number; // Calculated on check-out
}

export interface ScanEvent {
    id?: string;
    dressId: string;
    dressName: string;
    scannedAt: Date;
    staffId?: string;
}
