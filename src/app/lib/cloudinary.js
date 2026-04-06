import { v2 as cloudinary } from 'cloudinary';

// Check if environment variables are set
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary environment variables');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

export const uploadToCloudinary = async (file, folder) => {
  try {
    // For Next.js API routes, file is a File object
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to base64
    const base64String = buffer.toString('base64');
    
    console.log(`Uploading to Cloudinary folder: ${folder}`);
    
    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(
      `data:${file.type};base64,${base64String}`,
      {
        folder: `helpnow-sl/${folder}`,
        resource_type: 'auto',
      }
    );
    
    console.log('Cloudinary upload successful:', uploadResponse.secure_url);
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const uploadMultipleToCloudinary = async (files, folder) => {
  const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};

export default cloudinary;