-- Fix missing triggers for auto-creating profiles and approvals on signup
-- These triggers existed as functions but were never attached to auth.users

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for auto-creating approval record on signup  
CREATE OR REPLACE TRIGGER on_auth_user_created_approval
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_approval();