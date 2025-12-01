import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UseExitConfirmationOptions {
  enabled?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const useExitConfirmation = (options: UseExitConfirmationOptions = {}) => {
  const { enabled = true, onConfirm, onCancel } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const navigationBlocked = useRef(false);

  // Handle browser refresh/close
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
      return ''; // Required for some browsers
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);

  // Intercept browser back/forward buttons
  useEffect(() => {
    if (!enabled) return;

    // Push initial state to create a history entry
    window.history.pushState(null, '', location.pathname);

    const handlePopState = () => {
      if (navigationBlocked.current) {
        // Show modal and push state back
        setShowModal(true);
        window.history.pushState(null, '', location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, location.pathname]);

  // Block navigation when enabled
  useEffect(() => {
    navigationBlocked.current = enabled;
  }, [enabled]);

  const handleConfirm = () => {
    setShowModal(false);
    navigationBlocked.current = false;
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    } else {
      // Navigate to dashboard if authenticated, otherwise home
      // Check both token and user in localStorage, or useAuth context
      const hasToken = localStorage.getItem('phishhunt_token');
      const hasUser = localStorage.getItem('phishhunt_user');
      const authenticated = isAuthenticated || hasToken || hasUser;
      navigate(authenticated ? '/dashboard' : '/home');
    }
    onConfirm?.();
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingNavigation(null);
    onCancel?.();
  };

  // Custom navigation function that shows modal
  const attemptNavigation = (path: string) => {
    if (enabled && navigationBlocked.current) {
      setPendingNavigation(path);
      setShowModal(true);
    } else {
      navigate(path);
    }
  };

  return {
    showModal,
    handleConfirm,
    handleCancel,
    pendingNavigation,
    attemptNavigation
  };
};

