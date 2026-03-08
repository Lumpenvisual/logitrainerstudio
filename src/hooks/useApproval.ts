import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useApproval() {
  const { user } = useAuth();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsApproved(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      setLoading(true);
      try {
        // Check approval status
        const { data: approval } = await supabase
          .from('user_approvals')
          .select('status')
          .eq('user_id', user.id)
          .single();

        setIsApproved(approval?.status === 'approved');

        // Check admin role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        setIsAdmin(roles?.some((r: any) => r.role === 'admin') ?? false);
      } catch {
        setIsApproved(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [user]);

  return { isApproved, isAdmin, loading };
}
