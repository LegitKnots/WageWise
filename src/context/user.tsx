import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserData } from 'types/user';

type UserContextValue = {
  user: UserData;
  loading: boolean; // true until we hydrate from storage
  updateFirstName: (firstName: string) => Promise<void>;
  updateLastName: (lastName: string) => Promise<void>;
  updateUser: (patch: Partial<UserData>) => Promise<void>;
  setUser: (next: UserData) => Promise<void>;
  reset: () => Promise<void>;
};

const STORAGE_KEY = '@app:user';
const DEFAULT_USER: UserData = { firstName: '', lastName: '' };

const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<UserData>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);
  const hydratedRef = useRef(false); // avoid writing back immediately after initial load

  // --- Storage helpers ---
  const readFromStorage = useCallback(async (): Promise<UserData> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_USER;
      const parsed = JSON.parse(raw);
      // Defensive: only keep known keys
      return {
        firstName: typeof parsed.firstName === 'string' ? parsed.firstName : '',
        lastName: typeof parsed.lastName === 'string' ? parsed.lastName : '',
      };
    } catch {
      return DEFAULT_USER;
    }
  }, []);

  const writeToStorage = useCallback(async (next: UserData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Swallow errors; you may want to add logging/monitoring here
    }
  }, []);

  // --- Hydrate on mount ---
  useEffect(() => {
    (async () => {
      const initial = await readFromStorage();
      setUserState(initial);
      hydratedRef.current = true;
      setLoading(false);
    })();
  }, [readFromStorage]);

  // --- Persist whenever user changes (after hydration) ---
  useEffect(() => {
    if (!hydratedRef.current) return;
    void writeToStorage(user);
  }, [user, writeToStorage]);

  // --- Public updaters ---
  const setUser = useCallback(
    async (next: UserData) => {
      setUserState(next);
      // writeToStorage will run via effect, but we also await here for immediate durability if needed
      await writeToStorage(next);
    },
    [writeToStorage],
  );

  const updateUser = useCallback(
    async (patch: Partial<UserData>) => {
      setUserState(prev => {
        const merged = { ...prev, ...patch };
        // fire-and-forget write; effect will also persist
        void writeToStorage(merged);
        return merged;
      });
    },
    [writeToStorage],
  );

  const updateFirstName = useCallback(
    async (firstName: string) => {
      await updateUser({ firstName });
    },
    [updateUser],
  );

  const updateLastName = useCallback(
    async (lastName: string) => {
      await updateUser({ lastName });
    },
    [updateUser],
  );

  const reset = useCallback(async () => {
    setUserState(DEFAULT_USER);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      loading,
      updateFirstName,
      updateLastName,
      updateUser,
      setUser,
      reset,
    }),
    [
      user,
      loading,
      updateFirstName,
      updateLastName,
      updateUser,
      setUser,
      reset,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// --- Hook ---
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
