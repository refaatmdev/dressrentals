import { z } from 'zod';

// --- Dress Schema ---
export const DressSchema = z.object({
    modelName: z.string().min(2, 'שם הדגם חייב להכיל לפחות 2 תווים'),
    imageUrl: z.string().url('כתובת תמונה לא תקינה'),
    status: z.enum(['available', 'rented', 'cleaning', 'repair']),
    rentalPrice: z.number().positive('מחיר השכרה חייב להיות חיובי').optional(),
    productionCosts: z.object({
        fabricCost: z.number().min(0, 'עלות חייבת להיות חיובית'),
        jewelryCost: z.number().min(0, 'עלות חייבת להיות חיובית'),
        paddingCost: z.number().min(0, 'עלות חייבת להיות חיובית'),
        sewingCost: z.number().min(0, 'עלות חייבת להיות חיובית'),
        additionalCosts: z.array(z.object({
            name: z.string(),
            amount: z.number().min(0)
        })).optional()
    })
});

// --- Client Schema ---
const israeliPhoneRegex = /^05\d-?\d{7}$/;

export const ClientSchema = z.object({
    fullName: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים'),
    phone: z.string().regex(israeliPhoneRegex, 'מספר טלפון לא תקין (חייב להתחיל ב-05)'),
    email: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
    address: z.string().optional(),
    measurements: z.object({
        bust: z.number().min(0).optional(),
        waist: z.number().min(0).optional(),
        hips: z.number().min(0).optional(),
        height: z.number().min(0).optional(),
        shoulderToFloor: z.number().min(0).optional(),
        notes: z.string().optional()
    }).optional()
});

// --- Rental Schema ---
export const RentalSchema = z.object({
    dressId: z.string().min(1, 'חובה לבחור שמלה'),
    clientId: z.string().optional(), // Optional because we might create client inline
    clientName: z.string().min(2, 'שם הלקוחה חובה'),
    clientPhone: z.string().regex(israeliPhoneRegex, 'מספר טלפון לא תקין'),
    eventDate: z.date(),
    returnDate: z.date(),
    finalPrice: z.number().min(0, 'מחיר סופי לא יכול להיות שלילי'),
    status: z.enum(['active', 'completed', 'cancelled', 'pending']).default('active')
}).refine(data => data.returnDate >= data.eventDate, {
    message: "תאריך החזרה חייב להיות אחרי או ביום האירוע",
    path: ["returnDate"]
});

export type DressFormData = z.infer<typeof DressSchema>;
export type ClientFormData = z.infer<typeof ClientSchema>;
export type RentalFormData = z.infer<typeof RentalSchema>;
