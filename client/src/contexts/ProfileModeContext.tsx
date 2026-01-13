import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ProfileMode = 'personal' | 'vendor';

interface ProfileModeContextType {
  mode: ProfileMode;
  setMode: (mode: ProfileMode) => void;
  toggleMode: () => void;
  isVendorMode: boolean;
}

const ProfileModeContext = createContext<ProfileModeContextType | null>(null);

export function ProfileModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ProfileMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('profileMode') as ProfileMode) || 'personal';
    }
    return 'personal';
  });

  const handleSetMode = useCallback((newMode: ProfileMode) => {
    setMode(newMode);
    localStorage.setItem('profileMode', newMode);
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'personal' ? 'vendor' : 'personal';
    handleSetMode(newMode);
  }, [mode, handleSetMode]);

  return (
    <ProfileModeContext.Provider value={{
      mode,
      setMode: handleSetMode,
      toggleMode,
      isVendorMode: mode === 'vendor'
    }}>
      {children}
    </ProfileModeContext.Provider>
  );
}

export function useProfileMode() {
  const context = useContext(ProfileModeContext);
  if (!context) {
    throw new Error('useProfileMode must be used within a ProfileModeProvider');
  }
  return context;
}
