import { useState } from 'react';
import { api, setToken } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, type Department } from '@/lib/types';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Building2 } from 'lucide-react';

const Auth = () => {
  const { user, loading, refreshSession } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState<Department>('Technical');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { data, error } = await api.auth.signUp({
          email,
          password,
          full_name: fullName,
          department,
        });
        if (error) throw new Error(error);
        const session = data as any;
        setToken(session.token);
        await refreshSession();
        toast.success('Account created successfully!');
      } else {
        const { data, error } = await api.auth.signIn({ email, password });
        if (error) throw new Error(error);
        const session = data as any;
        setToken(session.token);
        await refreshSession();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed bg-no-repeat relative"
      style={{ backgroundImage: 'url("/bg.png")' }}
    >
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-0"></div>
      
      <div className="w-full max-w-md animate-fade-in relative z-10 p-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-4">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Conference Room Booking</h1>
          <p className="text-muted-foreground mt-1">Management System</p>
        </div>

        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <h2 className="text-lg font-heading font-semibold mb-4">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={v => setDepartment(v as Department)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
