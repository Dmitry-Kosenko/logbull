/**
 * Gets the user's preferred short time format based on browser locale
 * @returns Object with use12Hours flag and format string
 * @example
 * // For 12-hour format (US locale):
 * // { use12Hours: true, format: 'DD MMM YYYY h:mm A' }
 * // Output: "08 Oct 2025 1:30 PM"
 *
 * // For 24-hour format (most European locales):
 * // { use12Hours: false, format: 'DD MMM YYYY HH:mm' }
 * // Output: "08 Oct 2025 13:30"
 */
export const getUserShortTimeFormat = (): { use12Hours: boolean; format: string } => {
  const locale = navigator.language || 'en-US';
  const testDate = new Date(2023, 0, 1, 13, 0, 0); // 1 PM
  const timeString = testDate.toLocaleTimeString(locale, { hour: 'numeric' });
  const is12Hour = timeString.includes('PM') || timeString.includes('AM');

  return {
    use12Hours: is12Hour,
    format: is12Hour ? 'DD MMM YYYY h:mm A' : 'DD MMM YYYY HH:mm',
  };
};

/**
 * Gets the user's preferred time format with milliseconds based on browser locale
 * @returns Object with use12Hours flag and format string including milliseconds
 * @example
 * // For 12-hour format (US locale):
 * // { use12Hours: true, format: 'MMM D h:mm:ss.SSS A' }
 * // Output: "Oct 4 2:35:50.463 PM"
 *
 * // For 24-hour format (most European locales):
 * // { use12Hours: false, format: 'MMM D HH:mm:ss.SSS' }
 * // Output: "Oct 4 14:35:50.463"
 */
export const getUserTimeFormatWithMs = (): { use12Hours: boolean; format: string } => {
  const locale = navigator.language || 'en-US';
  const testDate = new Date(2023, 0, 1, 13, 0, 0); // 1 PM
  const timeString = testDate.toLocaleTimeString(locale, { hour: 'numeric' });
  const is12Hour = timeString.includes('PM') || timeString.includes('AM');

  return {
    use12Hours: is12Hour,
    format: is12Hour ? 'MMM D h:mm:ss.SSS A' : 'MMM D HH:mm:ss.SSS',
  };
};
