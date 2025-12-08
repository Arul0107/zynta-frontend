// src/utils/fileStorage.js
import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid'; 

const BUCKET_NAME = 'vrism'; // Your Supabase bucket name

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param {File} file The native File object to upload.
 * @returns {Promise<{url: string, filename: string} | null>} 
 */
export async function uploadFile(file) {
    if (!file) return null;

    try {
        const fileExtension = file.name.split('.').pop();
        // Create a unique file path 
        const filePath = `chat/${uuidv4()}.${fileExtension}`; 
        
        // 1. Upload the file - THIS IS WHERE YOUR CODE GOES
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600', // 👈 You put it here
                upsert: false,
                contentType: file.type 
            });

        if (error) {
            console.error("Supabase Upload Error:", error);
            throw new Error(`File upload failed: ${error.message}`);
        }

        // 2. Get the public URL
        const { data: publicURLData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        if (!publicURLData?.publicUrl) {
            throw new Error("Could not retrieve public URL after successful upload.");
        }

        // Return the required structure
        return {
            url: publicURLData.publicUrl,
            filename: file.name,
        };

    } catch (error) {
        console.error("Error in uploadFile:", error);
        return null;
    }
}