// Third-party library configurations
export { prisma } from './prisma';
export { auth } from './firebase';
export { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from './validations/auth';
export type { LoginFormValues, RegisterFormValues, UpdateProfileFormValues, ChangePasswordFormValues } from './validations/auth';

// Firebase storage
export { uploadFile, uploadBuffer, deleteFile, storage } from './firebase-storage';
export type { UploadResult } from './firebase-storage';

// Server-side auth (only import in API routes)
export { verifyIdToken } from './firebase-admin';
export { withAuth, getAuthUser } from './auth-middleware';
export type { AuthUser } from './auth-middleware';
