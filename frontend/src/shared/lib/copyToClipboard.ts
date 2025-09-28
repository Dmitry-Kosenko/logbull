/**
 * Copies the provided text to the clipboard
 * @param text The text to copy to clipboard
 * @returns Promise<boolean> - true if successful, false if failed
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Modern clipboard API failed, trying fallback:', error);
    }
  }

  // Fallback to legacy method
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (successful) {
      return true;
    } else {
      throw new Error('execCommand failed');
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
