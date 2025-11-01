export const BUCKET_NAME = "parallel-image-library-1";
export const BATCH_IMAGES = 25;
export const MAX_FILESIZE = 10 * 1024 * 1024;
export const SIGNED_URL_EXPIRE = 60 * 60 * 24;
export const USER_TABLE = "userdata";
export const MDATA_TABLE = "image-metadata";
export const USER_ACTIVE_TTL = 60 * 60 * 2; // 2 hours
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;