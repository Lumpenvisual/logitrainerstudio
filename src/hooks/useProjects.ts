import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore, Scene, TimelineState } from '@/store/useProjectStore';
import { useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

export function useProjects() {
  const { user } = useAuth();
  const store = useProjectStore();

  const saveProject = useCallback(async (projectId?: string) => {
    if (!user) return null;

    const projectData = {
      user_id: user.id,
      title: store.projectTitle,
      brief: store.brief,
      scenes: JSON.parse(JSON.stringify(store.scenes)),
      timeline: JSON.parse(JSON.stringify(store.timeline)),
      updated_at: new Date().toISOString(),
    };

    if (projectId) {
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', projectId);
      if (error) { toast.error('Failed to save project'); return null; }
      toast.success('Project saved');
      return projectId;
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select('id')
        .single();
      if (error) { toast.error('Failed to save project'); return null; }
      toast.success('Project saved');
      return data.id;
    }
  }, [user, store.projectTitle, store.brief, store.scenes, store.timeline]);

  const loadProject = useCallback(async (projectId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !data) { toast.error('Failed to load project'); return; }

    useProjectStore.setState({
      projectTitle: data.title,
      brief: data.brief || "",
      scenes: Array.isArray(data.scenes) ? (data.scenes as unknown as Scene[]) : [],
      timeline: (data.timeline as unknown as TimelineState) ?? useProjectStore.getState().timeline,
    });
  }, []);

  const listProjects = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, updated_at, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) return [];
    return data;
  }, [user]);

  const deleteProject = useCallback(async (projectId: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) { toast.error('Failed to delete project'); return false; }
    toast.success('Project deleted');
    return true;
  }, []);

  return { saveProject, loadProject, listProjects, deleteProject };
}
