// Boolean toggles to determine which auth types are allowed
const allowOauth = true;
const allowEmail = true;
const allowPassword = true;

// Boolean toggle to determine whether auth interface should route through server or client
// (Currently set to false because screen sometimes flickers with server redirects)
const allowServerRedirect = false;

// Check that at least one of allowPassword and allowEmail is true
if (!allowPassword && !allowEmail)
  throw new Error('At least one of allowPassword and allowEmail must be true');

export const getAuthTypes = () => {
  return { allowOauth, allowEmail, allowPassword };
};

export const getViewTypes = () => {
  // Define the valid view types
  let viewTypes: string[] = [];
  if (allowEmail) {
    viewTypes = [...viewTypes, 'email_signin'];
  }
  if (allowPassword) {
    viewTypes = [
      ...viewTypes,
      'password_signin',
      'forgot_password',
      'update_password',
      'signup'
    ];
  }

  return viewTypes;
};

export const getDefaultSignInView = (preferredSignInView: string | null) => {
  // Define the default sign in view
  let defaultView = allowPassword ? 'password_signin' : 'email_signin';
  if (preferredSignInView && getViewTypes().includes(preferredSignInView)) {
    defaultView = preferredSignInView;
  }

  return defaultView;
};

export const getRedirectMethod = () => {
  return allowServerRedirect ? 'server' : 'client';
};

/** Where a fresh sign-in lands when nothing asked for somewhere specific. */
export const DEFAULT_AFTER_SIGN_IN = '/today';

/**
 * A safe in-app path to return to after signing in. Anything that is not a
 * plain relative path — an absolute URL, a protocol-relative `//host`, an
 * empty value — falls back to the map, so the parameter can never bounce a
 * user off to another site.
 */
export function safeNext(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/signin'))
    return DEFAULT_AFTER_SIGN_IN;
  return value;
}
