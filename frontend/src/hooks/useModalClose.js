import { useEffect } from 'react';

/**
 * Custom hook to handle closing modals on Escape key press.
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback function to close the modal
 */
export function useModalClose(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen || !onClose) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
}
