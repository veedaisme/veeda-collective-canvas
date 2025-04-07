import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Simple check to see if a string looks like a URL.
 * This is not exhaustive but covers common cases.
 */
export const isUrl = (str: string): boolean => {
    if (!str) return false;
    // Regular expression to match common URL patterns
    // Starts with http://, https://, or www.
    // Allows various characters in domain/path/query
    const urlPattern = new RegExp(
        '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.+[a-z]{2,})|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
        'i' // ignore case
    );
    // Also check for www. at the start if no protocol is present
    const wwwPattern = /^www\./i;

    return !!urlPattern.test(str) || wwwPattern.test(str);
};
