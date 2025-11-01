const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/**
 * Uploads an image to ImgBB
 * @param {File|string} image - File object or base64 string
 * @param {string} name - Optional name for the image
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadToImgBB = async (image, name = null) => {
    if (!IMGBB_API_KEY) {
        console.error('ImgBB API key is missing');
        return { success: false, error: 'ImgBB API key not configured' };
    }

    try {
        const formData = new FormData();

        if (image instanceof File) {
            formData.append('image', image);
        } else if (typeof image === 'string') {
            // If it's a base64 string or URL
            formData.append('image', image);
        } else {
            throw new Error('Invalid image format');
        }

        if (name) {
            formData.append('name', name);
        }

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return {
                success: true,
                url: data.data.url,
                displayUrl: data.data.display_url,
                thumbnailUrl: data.data.thumb.url,
                deleteUrl: data.data.delete_url
            };
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('ImgBB upload error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload image'
        };
    }
};

export const imgbbApiKey = IMGBB_API_KEY;