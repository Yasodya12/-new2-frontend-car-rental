import { useState, useEffect } from "react";

interface ImageUploadProps {
    onUpload: (url: string) => void;
    initialImage?: string | null;
    label?: string;
}

export function ImageUpload({ onUpload, initialImage, label = "Upload Image" }: ImageUploadProps) {
    const [image, setImage] = useState<string | null>(initialImage || null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (initialImage) {
            setImage(initialImage);
        }
    }, [initialImage]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // basic validation
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file");
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "test-transport"); // Using the preset provided
        formData.append("cloud_name", "dr3m455vr"); // Using the cloud name provided

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/dr3m455vr/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (data.secure_url) {
                setImage(data.secure_url);
                onUpload(data.secure_url);
            } else {
                alert("Upload failed: " + (data.error?.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error uploading image");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-gray-700 font-medium mb-1">{label}</label>
            <div className="flex items-center gap-4">
                <div className="relative overflow-hidden w-24 h-24 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center">
                    {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    ) : image ? (
                        <img
                            src={image}
                            alt="Uploaded"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-gray-400 text-2xl">📷</span>
                    )}
                </div>

                <div className="flex-1">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
                        "
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                    </p>
                </div>
            </div>
        </div>
    );
}
