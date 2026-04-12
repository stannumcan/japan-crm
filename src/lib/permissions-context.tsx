"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { defaultPermissions, type PageKey, type FieldFormKey } from "@/lib/permissions";

const ADMIN_EMAIL = "wilfred@stannumcan.com";
const STORAGE_KEY = "crm_test_profile_id";

interface Profile { id: string; name: string; }

interface PermissionsContextValue {
  // The resolved permissions (either real or test profile)
  permissions: ReturnType<typeof defaultPermissions>;
  // Whether the current user is the admin (can use switcher)
  isAdmin: boolean;
  // Current user email
  email: string | null;
  // Profile switcher state (null = using real permissions)
  testProfileId: string | null;
  testProfileName: string | null;
  setTestProfile: (id: string | null) => void;
  // All profiles for the switcher dropdown
  allProfiles: Profile[];
  // Helpers
  canView: (page: PageKey) => boolean;
  canCreate: (page: PageKey) => boolean;
  canEdit: (page: PageKey) => boolean;
  canDelete: (page: PageKey) => boolean;
  fieldVisible: (form: FieldFormKey, field: string) => boolean;
  loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: defaultPermissions(),
  isAdmin: false,
  email: null,
  testProfileId: null,
  testProfileName: null,
  setTestProfile: () => {},
  allProfiles: [],
  canView: () => true,
  canCreate: () => true,
  canEdit: () => true,
  canDelete: () => true,
  fieldVisible: () => true,
  loading: true,
});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [realPermissions, setRealPermissions] = useState<ReturnType<typeof defaultPermissions>>(defaultPermissions());
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [testProfileId, setTestProfileId] = useState<string | null>(null);
  const [testProfileName, setTestProfileName] = useState<string | null>(null);
  const [testPermissions, setTestPermissions] = useState<ReturnType<typeof defaultPermissions> | null>(null);
  const [loading, setLoading] = useState(true);

  // Load base data
  useEffect(() => {
    fetch("/api/me/permissions")
      .then((r) => r.json())
      .then((data) => {
        setEmail(data.user?.email ?? null);
        setIsAdmin(data.user?.email === ADMIN_EMAIL);
        setRealPermissions(data.permissions ?? defaultPermissions());
        setAllProfiles(data.allProfiles ?? []);

        // Restore saved test profile (admin only)
        if (data.user?.email === ADMIN_EMAIL) {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved && data.allProfiles?.some((p: Profile) => p.id === saved)) {
            setTestProfileId(saved);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch test profile permissions when testProfileId changes
  useEffect(() => {
    if (!testProfileId) {
      setTestPermissions(null);
      setTestProfileName(null);
      return;
    }
    fetch(`/api/admin/profiles/${testProfileId}`)
      .then((r) => r.json())
      .then((data) => {
        setTestPermissions(data.permissions ?? defaultPermissions());
        setTestProfileName(data.name ?? null);
      });
  }, [testProfileId]);

  const setTestProfile = useCallback((id: string | null) => {
    setTestProfileId(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const permissions = testPermissions ?? realPermissions;

  const pages = (permissions.pages ?? {}) as Record<string, Record<string, boolean>>;
  const fields = (permissions.fields ?? {}) as Record<string, Record<string, boolean>>;

  const canView   = (page: PageKey) => pages[page]?.view   !== false;
  const canCreate = (page: PageKey) => pages[page]?.create !== false;
  const canEdit   = (page: PageKey) => pages[page]?.edit   !== false;
  const canDelete = (page: PageKey) => pages[page]?.delete !== false;
  const fieldVisible = (form: FieldFormKey, field: string) => fields[form]?.[field] !== false;

  return (
    <PermissionsContext.Provider value={{
      permissions, isAdmin, email,
      testProfileId, testProfileName,
      setTestProfile, allProfiles,
      canView, canCreate, canEdit, canDelete, fieldVisible,
      loading,
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
