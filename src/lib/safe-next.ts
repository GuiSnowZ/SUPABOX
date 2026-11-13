/**
 * Only allow redirects to paths on this site (prevents open redirects).
 * Browsers treat a backslash like "/", so a path starting with "/" plus a backslash would leave the site too.
 */
export function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || /^\/[\/\\]/.test(value) || /[\\\u0000-\u001f]/.test(value)) return "/";
  return value;
}
