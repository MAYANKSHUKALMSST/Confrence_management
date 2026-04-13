import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, type Department } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { User, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Casper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Willow'
];

interface ProfileSettingsProps {
  trigger?: React.ReactNode;
}

const ProfileSettings = ({ trigger }: ProfileSettingsProps) => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    department: (profile?.department as Department) || 'Technical',
    avatar_url: profile?.avatar_url || AVATARS[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await api.profiles.update(user.id, formData);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Success', description: 'Profile updated successfully' });
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <User className="w-4 h-4" />
            Profile Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border border-white/10">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full border-2 border-primary/20 p-1 bg-muted/50 overflow-hidden">
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {AVATARS.map(url => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar_url: url })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${formData.avatar_url === url ? 'border-primary' : 'border-transparent opacity-60'}`}
                >
                  <img src={url} alt="Avatar Option" className="w-full h-full rounded-full" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input 
              id="full_name" 
              value={formData.full_name} 
              onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              value={formData.department} 
              onValueChange={v => setFormData({ ...formData, department: v as Department })}
            >
              <SelectTrigger id="department"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_custom">Custom Avatar URL (Optional)</Label>
            <div className="flex gap-2">
              <Input 
                id="avatar_custom" 
                placeholder="https://..." 
                value={formData.avatar_url} 
                onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setFormData({ ...formData, avatar_url: '' })}>
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettings;
