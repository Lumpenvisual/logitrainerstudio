import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserApiKey {
  id: string;
  provider_id: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // We never expose the full key to the UI
  key_preview: string;
}

export function useApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<UserApiKey[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_api_keys' as any)
      .select('id, provider_id, label, is_active, created_at, updated_at, api_key_encrypted')
      .eq('user_id', user.id);

    if (!error && data) {
      setKeys((data as any[]).map((k) => ({
        id: k.id,
        provider_id: k.provider_id,
        label: k.label,
        is_active: k.is_active,
        created_at: k.created_at,
        updated_at: k.updated_at,
        key_preview: maskKey(k.api_key_encrypted),
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const saveKey = async (providerId: string, apiKey: string, label?: string) => {
    if (!user) return { error: 'Not authenticated' };
    
    // Upsert
    const { error } = await supabase
      .from('user_api_keys' as any)
      .upsert({
        user_id: user.id,
        provider_id: providerId,
        api_key_encrypted: apiKey,
        label: label || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'user_id,provider_id' });

    if (!error) await fetchKeys();
    return { error: error?.message };
  };

  const deleteKey = async (providerId: string) => {
    if (!user) return;
    await supabase
      .from('user_api_keys' as any)
      .delete()
      .eq('user_id', user.id)
      .eq('provider_id', providerId);
    await fetchKeys();
  };

  const toggleKey = async (providerId: string, active: boolean) => {
    if (!user) return;
    await supabase
      .from('user_api_keys' as any)
      .update({ is_active: active, updated_at: new Date().toISOString() } as any)
      .eq('user_id', user.id)
      .eq('provider_id', providerId);
    await fetchKeys();
  };

  const hasKey = (providerId: string) => keys.some((k) => k.provider_id === providerId && k.is_active);

  return { keys, loading, saveKey, deleteKey, toggleKey, hasKey, refetch: fetchKeys };
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}
