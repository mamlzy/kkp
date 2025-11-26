import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

const loginSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(1, 'Password harus diisi'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      toast({
        title: 'Login berhasil!',
        description: 'Selamat datang kembali',
        variant: 'success',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Login gagal',
        description:
          error instanceof Error
            ? error.message
            : 'Username atau password salah',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4'>
      {/* Background pattern */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/5 blur-3xl' />
      </div>

      <Card className='w-full max-w-md relative z-10 bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl'>
        <CardHeader className='space-y-4 text-center pb-2'>
          {/* Logo */}
          <div className='flex justify-center'>
            <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30'>
              <GraduationCap className='h-8 w-8' />
            </div>
          </div>
          <div>
            <CardTitle className='text-2xl font-bold text-white'>
              CART Prediction
            </CardTitle>
            <CardDescription className='text-slate-400 mt-2'>
              Masuk ke sistem prediksi siswa berprestasi
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className='pt-6'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='username' className='text-slate-300'>
                Username
              </Label>
              <Input
                id='username'
                type='text'
                placeholder='Masukkan username'
                className='bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20'
                {...register('username')}
              />
              {errors.username && (
                <p className='text-sm text-red-400'>
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password' className='text-slate-300'>
                Password
              </Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Masukkan password'
                  className='bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 pr-10'
                  {...register('password')}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors'
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='text-sm text-red-400'>
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-600 hover:via-purple-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-300'
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <LogIn className='h-4 w-4 mr-2' />
              )}
              Masuk
            </Button>
          </form>

          <div className='mt-8 pt-6 border-t border-slate-700/50 text-center'>
            <p className='text-sm text-slate-500'>SMP PGRI Tambun Selatan</p>
            <p className='text-xs text-slate-600 mt-1'>
              Metode CART untuk Menentukan Siswa Berprestasi
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
