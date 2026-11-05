import { FirebaseError } from 'firebase/app';

/** The key in the `validation` messages for a Firebase auth error. */
export function firebaseAuthErrorKey(error: unknown): string {
  if (!(error instanceof FirebaseError)) return 'unknownError';

  switch (error.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'popupClosed';
    case 'auth/popup-blocked':
      return 'popupBlocked';
    case 'auth/too-many-requests':
      return 'tooManyRequests';
    case 'auth/account-exists-with-different-credential':
      return 'accountExistsDifferentCredential';
    case 'auth/user-mismatch':
      return 'googleAccountMismatch';
    case 'auth/requires-recent-login':
      return 'requiresRecentLogin';
    case 'auth/weak-password':
      return 'weakPassword';
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
      return 'emailInUse';
    case 'auth/network-request-failed':
      return 'networkError';
    default:
      return 'unknownError';
  }
}
