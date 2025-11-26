import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { updateMyProfile, verifyToken } from '@/lib/api';

const editProfileSchema = z
  .object({
    name: z.string().min(1, 'Nama harus diisi').optional().or(z.literal('')),
    password: z
      .string()
      .min(6, 'Password minimal 6 karakter')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.password && data.password !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Password tidak cocok',
      path: ['confirmPassword'],
    },
  );

type EditProfileFormData = z.infer<typeof editProfileSchema>;

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProfileDialog({
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || '',
      password: '',
      confirmPassword: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: async () => {
      // Refresh user data
      try {
        await verifyToken();
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } catch {
        // Ignore error, user data will be refreshed on next page load
      }
      onOpenChange(false);
      reset();
      toast({
        title: 'Profil berhasil diperbarui!',
        description: 'Perubahan telah disimpan',
        variant: 'success',
      });
      // Reload the page to update user info
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal memperbarui profil',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EditProfileFormData) => {
    const updateData: { name?: string; password?: string } = {};

    if (data.name && data.name !== user?.name) {
      updateData.name = data.name;
    }
    if (data.password) {
      updateData.password = data.password;
    }

    if (Object.keys(updateData).length === 0) {
      toast({
        title: 'Tidak ada perubahan',
        description: 'Tidak ada data yang diubah',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate(updateData);
  };

  const handleClose = () => {
    reset({
      name: user?.name || '',
      password: '',
      confirmPassword: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>
            Ubah nama atau password Anda. Kosongkan password jika tidak ingin
            mengubahnya.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit-name'>Nama Lengkap</Label>
            <Input
              id='edit-name'
              placeholder='Masukkan nama lengkap'
              defaultValue={user?.name}
              {...register('name')}
            />
            {errors.name && (
              <p className='text-sm text-destructive'>{errors.name.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-password'>Password Baru (opsional)</Label>
            <div className='relative'>
              <Input
                id='edit-password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Kosongkan jika tidak ingin mengubah'
                className='pr-10'
                {...register('password')}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </button>
            </div>
            {errors.password && (
              <p className='text-sm text-destructive'>
                {errors.password.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-confirmPassword'>
              Konfirmasi Password Baru
            </Label>
            <div className='relative'>
              <Input
                id='edit-confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='Ulangi password baru'
                className='pr-10'
                {...register('confirmPassword')}
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className='text-sm text-destructive'>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <DialogFooter className='pt-4'>
            <Button type='button' variant='outline' onClick={handleClose}>
              Batal
            </Button>
            <Button type='submit' disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
