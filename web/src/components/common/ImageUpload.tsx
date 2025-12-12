import { useState } from 'react';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';

interface ImageUploadProps {
    label: string;
    currentImageUrl: string;
    onImageUploaded: (url: string) => void;
    folder?: string;
}

export const ImageUpload = ({ label, currentImageUrl, onImageUploaded, folder = 'uploads' }: ImageUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImageUrl);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploading(true);

            // Create local preview
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            try {
                // Upload to Firebase
                const timestamp = Date.now();
                const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                const storageRef = ref(storage, `${folder}/${timestamp}_${safeName}`);

                await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(storageRef);

                onImageUploaded(downloadUrl);
                setPreview(downloadUrl); // Update preview with real URL
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("שגיאה בהעלאת התמונה");
                setPreview(currentImageUrl); // Revert on error
            } finally {
                setUploading(false);
            }
        }
    };

    const handleRemove = () => {
        setPreview('');
        onImageUploaded('');
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

            <div className="relative group">
                {preview ? (
                    <div className="relative w-full h-48 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        <img
                            src={preview}
                            alt={label}
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="cursor-pointer p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors">
                                <Upload size={20} />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                            </label>
                            <button
                                onClick={handleRemove}
                                className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        )}
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploading ? (
                                <Loader2 className="animate-spin text-gold" size={24} />
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">לחץ להעלאת תמונה</p>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>
        </div>
    );
};
