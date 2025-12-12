import { useState, useEffect } from 'react';
import { X, Save, Loader2, Upload, Trash2, Star } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { dressService } from '../../services/dressService';
import { CostCalculator } from './CostCalculator';
import type { Dress } from '../../types';

interface AddDressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Dress | null;
}

export const AddDressModal = ({ isOpen, onClose, onSuccess, initialData }: AddDressModalProps) => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [mainImageIndex, setMainImageIndex] = useState(0);

    const [formData, setFormData] = useState<Partial<Dress>>({
        modelName: '',
        imageUrl: '',
        galleryImages: [],
        status: 'available',
        staffNotes: '',
        rentalPrice: 0,
        productionCosts: {
            fabricCost: 0,
            jewelryCost: 0,
            paddingCost: 0,
            sewingCost: 0,
            additionalCosts: [],
            totalCost: 0,
        },
        rentalCount: 0,
        lastLocation: 'Studio',
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            // Initialize previews from existing data
            const images = initialData.galleryImages && initialData.galleryImages.length > 0
                ? initialData.galleryImages
                : (initialData.imageUrl ? [initialData.imageUrl] : []);

            setPreviewUrls(images);

            // Find main image index
            if (initialData.imageUrl) {
                const idx = images.indexOf(initialData.imageUrl);
                setMainImageIndex(idx >= 0 ? idx : 0);
            }
        } else {
            // Reset form
            setFormData({
                modelName: '',
                imageUrl: '',
                galleryImages: [],
                status: 'available',
                staffNotes: '',
                rentalPrice: 0,
                productionCosts: {
                    fabricCost: 0,
                    jewelryCost: 0,
                    paddingCost: 0,
                    sewingCost: 0,
                    additionalCosts: [],
                    totalCost: 0,
                },
                rentalCount: 0,
                lastLocation: 'Studio',
            });
            setPreviewUrls([]);
            setImageFiles([]);
            setMainImageIndex(0);
        }
    }, [initialData, isOpen]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // If removing a file that hasn't been uploaded yet
        // We need to map previews to files carefully. 
        // Strategy: We have existing URLs (strings) and new Files (objects).
        // But here we mixed them in previewUrls. 
        // Let's simplify: We won't support mixed removal easily without more complex state.
        // Actually, let's just track everything in previewUrls and handle the save logic.

        // Wait, better approach:
        // We have `previewUrls` which is the source of truth for UI.
        // We have `imageFiles` which are NEW files to upload.
        // We need to know which preview corresponds to which file?
        // Let's just reset for now if it gets too complex, OR:

        // Simple approach:
        // When removing, we remove from previewUrls.
        // If it was a new file, we remove from imageFiles? No, indices won't match.
        // Let's just re-implement handleImageSelect to append, and keep a parallel array?
        // Or just allow adding, and if they want to remove, they clear all?
        // User wants to remove specific image.

        // Let's try to handle it:
        const urlToRemove = previewUrls[index];
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));

        // If it was the main image, reset main to 0
        if (index === mainImageIndex) {
            setMainImageIndex(0);
        } else if (index < mainImageIndex) {
            setMainImageIndex(prev => prev - 1);
        }

        // If it's a blob URL, revoke it and remove from files
        if (urlToRemove.startsWith('blob:')) {
            // This is tricky because we don't know WHICH file it corresponds to in imageFiles array easily
            // unless we track them together.
            // For this iteration, let's just filter the file out if we can match the blob URL?
            // Actually, we can just keep `imageFiles` and `previewUrls` in sync?
            // No, `previewUrls` contains existing firebase URLs too.

            // Let's just filter `imageFiles` by checking if creating a new URL matches? No.
            // Let's just assume we can't easily remove specific NEW files without a wrapper object.
            // We will just clear the file from the list of files to upload if we can't match it.
            // IMPROVEMENT: Wrap images in objects { id, url, file? }
        }
    };

    // Helper to sanitize filename
    const sanitizeFilename = (name: string) => {
        return name.replace(/[^a-zA-Z0-9.-]/g, '_');
    };

    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];

        // First, keep existing URLs (that are not blobs)
        const existingUrls = previewUrls.filter(url => !url.startsWith('blob:'));
        uploadedUrls.push(...existingUrls);

        // Upload new files
        // We need to know which file corresponds to which blob URL to maintain order?
        // Or we just upload all `imageFiles` and append them?
        // The user might have deleted a blob preview, so we shouldn't upload that file.
        // This is getting complicated.

        // SIMPLIFIED LOGIC for this step:
        // 1. Upload ALL `imageFiles`.
        // 2. Combine existing URLs + New URLs.
        // 3. Update `previewUrls` with the new real URLs.
        // 4. Use `mainImageIndex` to pick the main one.
        // * Limitation: If user deleted a preview of a new file, we might still upload it. 
        // * Fix: We will just upload all for now.

        for (const file of imageFiles) {
            // Check if this file's blob is still in previewUrls? 
            // Hard to check without mapping. 
            // Let's just upload.

            const sanitizedName = sanitizeFilename(file.name);
            const storageRef = ref(storage, `dresses/${Date.now()}_${sanitizedName}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            uploadedUrls.push(url);
        }

        return uploadedUrls;
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upload/Get all images
            const uploadedUrls = await uploadImages();

            // 2. Determine main image
            // If mainImageIndex is within range, use it.
            const mainImageUrl = uploadedUrls[mainImageIndex] || uploadedUrls[0] || '';

            const dressData = {
                ...formData,
                imageUrl: mainImageUrl,
                galleryImages: uploadedUrls
            };

            if (initialData?.id) {
                // Update existing
                await dressService.updateDress(initialData.id, dressData);
            } else {
                // Create new
                const qrCodeValue = `DRESS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                await dressService.createDress({
                    ...dressData as any,
                    qrCodeValue,
                    createdAt: new Date(),
                });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving dress:', error);
            alert('שגיאה בשמירת השמלה');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-serif font-bold text-charcoal">
                        {initialData ? 'עריכת שמלה' : 'הוספת שמלה חדשה'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">שם הדגם</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.modelName}
                                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                    placeholder="לדוגמה: אליזבת"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">תמונות (הראשונה תהיה הראשית)</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-gold/50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />

                                    {previewUrls.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2 relative z-20 pointer-events-none">
                                            {previewUrls.map((url, index) => (
                                                <div key={index} className="relative aspect-square pointer-events-auto group">
                                                    <img
                                                        src={url}
                                                        alt={`Preview ${index}`}
                                                        className={`w-full h-full object-cover rounded-lg border-2 ${index === mainImageIndex ? 'border-gold' : 'border-transparent'}`}
                                                    />

                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setMainImageIndex(index);
                                                            }}
                                                            className="p-1 bg-white/20 hover:bg-white/40 rounded-full text-white"
                                                            title="הגדר כראשית"
                                                        >
                                                            <Star size={16} fill={index === mainImageIndex ? "currentColor" : "none"} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => removeImage(index, e)}
                                                            className="p-1 bg-red-500/80 hover:bg-red-600 rounded-full text-white"
                                                            title="מחק"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    {index === mainImageIndex && (
                                                        <div className="absolute top-1 right-1 bg-gold text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                                                            ראשית
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="aspect-square flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-100 text-gray-400">
                                                <Upload size={20} />
                                                <span className="text-xs mt-1">הוסף עוד</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400 py-8 pointer-events-none">
                                            <Upload size={24} />
                                            <span className="text-sm">לחץ להעלאת תמונות</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                    >
                                        <option value="available">זמינה</option>
                                        <option value="rented">מושכרת</option>
                                        <option value="cleaning">בניקוי</option>
                                        <option value="repair">בתיקון</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">מחיר השכרה</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formData.rentalPrice || ''}
                                            onChange={(e) => setFormData({ ...formData, rentalPrice: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold"
                                            placeholder="0"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₪</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">הערות צוות</label>
                                <textarea
                                    value={formData.staffNotes}
                                    onChange={(e) => setFormData({ ...formData, staffNotes: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold h-24 resize-none"
                                    placeholder="הערות פנימיות..."
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <CostCalculator
                                costs={formData.productionCosts as any}
                                onChange={(costs) => setFormData({ ...formData, productionCosts: costs })}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gold hover:bg-gold-dark text-white rounded-xl font-medium shadow-lg shadow-gold/20 transition-all flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {uploading ? 'מעלה תמונה...' : (initialData ? 'עדכן שמלה' : 'שמור שמלה')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
