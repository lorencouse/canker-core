

export const getURL = (path: string = '') => {
  // SITE_URL is checked first and is deliberately *not* a NEXT_PUBLIC_ variable:
  // Next.js inlines NEXT_PUBLIC_* at build time, so a baked-in value cannot be
  // changed without rebuilding the image. Reading a plain env var lets the
  // server pick up a new domain at cutover with only a restart.
  //
  // Client components fall through to the inlined NEXT_PUBLIC_SITE_URL, since
  // SITE_URL is not exposed to the browser.
  //
  // One caveat on the runtime-switch story above: the marketing pages,
  // robots.txt, sitemap.xml and the OG card are statically prerendered, so
  // the absolute URLs in them are resolved during `next build` and a runtime
  // SITE_URL cannot change them. NEXT_PUBLIC_SITE_URL has to be right at
  // build time. See docs/DEPLOYMENT.md.
  let url =
    process?.env?.SITE_URL && process.env.SITE_URL.trim() !== ''
      ? process.env.SITE_URL
      : process?.env?.NEXT_PUBLIC_SITE_URL &&
          process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
        ? process.env.NEXT_PUBLIC_SITE_URL
        : // Default to localhost for local development.
          'http://localhost:3000/';

  // Trim the URL and remove trailing slash if exists.
  url = url.replace(/\/+$/, '');
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Ensure path starts without a slash to avoid double slashes in the final URL.
  path = path.replace(/^\/+/, '');

  // Concatenate the URL and the path.
  return path ? `${url}/${path}` : url;
};




const toastKeyMap: { [key: string]: string[] } = {
  status: ['status', 'status_description'],
  error: ['error', 'error_description']
};

const getToastRedirect = (
  path: string,
  toastType: string,
  toastName: string,
  toastDescription: string = '',
  disableButton: boolean = false,
  arbitraryParams: string = ''
): string => {
  const [nameKey, descriptionKey] = toastKeyMap[toastType];

  let redirectPath = `${path}?${nameKey}=${encodeURIComponent(toastName)}`;

  if (toastDescription) {
    redirectPath += `&${descriptionKey}=${encodeURIComponent(toastDescription)}`;
  }

  if (disableButton) {
    redirectPath += `&disable_button=true`;
  }

  if (arbitraryParams) {
    redirectPath += `&${arbitraryParams}`;
  }

  return redirectPath;
};

export const getStatusRedirect = (
  path: string,
  statusName: string,
  statusDescription: string = '',
  disableButton: boolean = false,
  arbitraryParams: string = ''
) =>
  getToastRedirect(
    path,
    'status',
    statusName,
    statusDescription,
    disableButton,
    arbitraryParams
  );

export const getErrorRedirect = (
  path: string,
  errorName: string,
  errorDescription: string = '',
  disableButton: boolean = false,
  arbitraryParams: string = ''
) =>
  getToastRedirect(
    path,
    'error',
    errorName,
    errorDescription,
    disableButton,
    arbitraryParams
  );
