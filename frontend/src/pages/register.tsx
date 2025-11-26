import { useState } from 'react';
import { useForm, Watch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  Users,
  Shield,
  ShieldAlert,
  User,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  register as apiRegister,
  getUsers,
  updateUser as apiUpdateUser,
  deleteUser as apiDeleteUser,
} from '@/lib/api';
import { UserRole } from '@/types';
import type { User as UserType, UpdateUserRequest } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username minimal 3 karakter'),
    name: z.string().min(1, 'Nama harus diisi'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const editUserSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username minimal 3 karakter')
      .optional()
      .or(z.literal('')),
    name: z.string().min(1, 'Nama harus diisi').optional().or(z.literal('')),
    password: z
      .string()
      .min(6, 'Password minimal 6 karakter')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    role: z.nativeEnum(UserRole).optional(),
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

type EditUserFormData = z.infer<typeof editUserSchema>;

const roleLabels: Record<
  UserRole,
  { label: string; icon: React.ReactNode; color: string }
> = {
  [UserRole.SUPER_ADMIN]: {
    label: 'Super Admin',
    icon: <ShieldAlert className='h-4 w-4' />,
    color: 'text-red-400 bg-red-500/10',
  },
  [UserRole.ADMIN]: {
    label: 'Admin',
    icon: <Shield className='h-4 w-4' />,
    color: 'text-amber-400 bg-amber-500/10',
  },
  [UserRole.USER]: {
    label: 'User',
    icon: <User className='h-4 w-4' />,
    color: 'text-blue-400 bg-blue-500/10',
  },
};

export function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    control,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.USER,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    setValue: setValueEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit },
    control: editControl,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const registerMutation = useMutation({
    mutationFn: apiRegister,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDialogOpen(false);
      reset();
      toast({
        title: 'User berhasil dibuat!',
        description: `User "${data.name}" telah ditambahkan`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal membuat user',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserRequest;
    }) => apiUpdateUser(userId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetEdit();
      toast({
        title: 'User berhasil diperbarui!',
        description: `User "${data.name}" telah diperbarui`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal memperbarui user',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User berhasil dihapus!',
        description: 'User telah dihapus dari sistem',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal menghapus user',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate({
      username: data.username,
      name: data.name,
      password: data.password,
      role: data.role,
    });
  };

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    resetEdit({
      username: user.username,
      name: user.name,
      password: '',
      confirmPassword: '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmitEdit = (data: EditUserFormData) => {
    if (!editingUser) return;

    const updateData: UpdateUserRequest = {};
    const isSuperadminAccount = editingUser.username === 'superadmin';

    // For superadmin account, only password can be changed
    if (isSuperadminAccount) {
      if (data.password) {
        updateData.password = data.password;
      }
    } else {
      if (data.username && data.username !== editingUser.username) {
        updateData.username = data.username;
      }
      if (data.name && data.name !== editingUser.name) {
        updateData.name = data.name;
      }
      if (data.password) {
        updateData.password = data.password;
      }
      if (data.role && data.role !== editingUser.role) {
        updateData.role = data.role;
      }
    }

    if (Object.keys(updateData).length === 0) {
      toast({
        title: 'Tidak ada perubahan',
        description: 'Tidak ada data yang diubah',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate({ userId: editingUser.id, data: updateData });
  };

  const handleDeleteUser = (user: UserType) => {
    if (
      window.confirm(`Apakah Anda yakin ingin menghapus user "${user.name}"?`)
    ) {
      deleteMutation.mutate(user.id);
    }
  };

  // Check if current user can edit the target user
  const canEditUser = (targetUser: UserType): boolean => {
    // Only superadmin username can edit superadmin account
    if (targetUser.username === 'superadmin') {
      return currentUser?.username === 'superadmin';
    }
    return true;
  };

  // Check if delete button should be shown
  const canDeleteUser = (targetUser: UserType): boolean => {
    // Cannot delete superadmin account
    if (targetUser.username === 'superadmin') return false;
    // Cannot delete yourself
    if (targetUser.id === currentUser?.id) return false;
    return true;
  };

  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='flex items-center justify-between animate-fade-in'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Manajemen User</h1>
          <p className='text-muted-foreground mt-1'>
            Kelola pengguna sistem prediksi siswa berprestasi
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className='h-4 w-4 mr-2' />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Buat akun pengguna baru untuk mengakses sistem
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='username'>Username</Label>
                <Input
                  id='username'
                  placeholder='Masukkan username'
                  {...register('username')}
                />
                {errors.username && (
                  <p className='text-sm text-destructive'>
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='name'>Nama Lengkap</Label>
                <Input
                  id='name'
                  placeholder='Masukkan nama lengkap'
                  {...register('name')}
                />
                {errors.name && (
                  <p className='text-sm text-destructive'>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='role'>Role</Label>
                <Watch
                  control={control}
                  names={['role']}
                  render={([selectedRole]) => (
                    <Select
                      value={selectedRole}
                      onValueChange={(value: UserRole) =>
                        setValue('role', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Pilih role' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.USER}>
                          <div className='flex items-center gap-2'>
                            <User className='h-4 w-4' />
                            User
                          </div>
                        </SelectItem>
                        <SelectItem value={UserRole.ADMIN}>
                          <div className='flex items-center gap-2'>
                            <Shield className='h-4 w-4' />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value={UserRole.SUPER_ADMIN}>
                          <div className='flex items-center gap-2'>
                            <ShieldAlert className='h-4 w-4' />
                            Super Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                {errors.role && (
                  <p className='text-sm text-destructive'>
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Masukkan password'
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
                <Label htmlFor='confirmPassword'>Konfirmasi Password</Label>
                <div className='relative'>
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Ulangi password'
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
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type='submit' disabled={registerMutation.isPending}>
                  {registerMutation.isPending && (
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  )}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card className='animate-fade-in border-none shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Daftar User
          </CardTitle>
          <CardDescription>
            Semua pengguna yang terdaftar dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className='text-right'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roleInfo = roleLabels[user.role];
                  const canEdit = canEditUser(user);
                  const canDelete = canDeleteUser(user);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className='font-medium'>
                        {user.username}
                      </TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${roleInfo.color}`}
                        >
                          {roleInfo.icon}
                          {roleInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          {canEdit && (
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleEditUser(user)}
                              title='Edit user'
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleDeleteUser(user)}
                              disabled={deleteMutation.isPending}
                              title='Hapus user'
                            >
                              <Trash2 className='h-4 w-4 text-destructive' />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='rounded-full bg-muted p-4 mb-4'>
                <Users className='h-8 w-8 text-muted-foreground' />
              </div>
              <h3 className='font-semibold mb-1'>Belum ada user</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Tambahkan user pertama dengan menekan tombol di atas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
            resetEdit();
          }
          setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              {editingUser?.username === 'superadmin'
                ? 'Untuk akun superadmin, hanya password yang dapat diubah'
                : 'Ubah informasi user. Kosongkan password jika tidak ingin mengubahnya.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmitEdit(onSubmitEdit)}
            className='space-y-4 py-4'
          >
            {editingUser?.username !== 'superadmin' && (
              <>
                <div className='space-y-2'>
                  <Label htmlFor='edit-username'>Username</Label>
                  <Input
                    id='edit-username'
                    placeholder='Masukkan username'
                    {...registerEdit('username')}
                  />
                  {errorsEdit.username && (
                    <p className='text-sm text-destructive'>
                      {errorsEdit.username.message}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-name'>Nama Lengkap</Label>
                  <Input
                    id='edit-name'
                    placeholder='Masukkan nama lengkap'
                    {...registerEdit('name')}
                  />
                  {errorsEdit.name && (
                    <p className='text-sm text-destructive'>
                      {errorsEdit.name.message}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-role'>Role</Label>
                  <Watch
                    control={editControl}
                    names={['role']}
                    render={([editSelectedRole]) => (
                      <Select
                        value={editSelectedRole}
                        onValueChange={(value: UserRole) =>
                          setValueEdit('role', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Pilih role' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.USER}>
                            <div className='flex items-center gap-2'>
                              <User className='h-4 w-4' />
                              User
                            </div>
                          </SelectItem>
                          <SelectItem value={UserRole.ADMIN}>
                            <div className='flex items-center gap-2'>
                              <Shield className='h-4 w-4' />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value={UserRole.SUPER_ADMIN}>
                            <div className='flex items-center gap-2'>
                              <ShieldAlert className='h-4 w-4' />
                              Super Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  {errorsEdit.role && (
                    <p className='text-sm text-destructive'>
                      {errorsEdit.role.message}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className='space-y-2'>
              <Label htmlFor='edit-user-password'>
                Password Baru (opsional)
              </Label>
              <div className='relative'>
                <Input
                  id='edit-user-password'
                  type={showEditPassword ? 'text' : 'password'}
                  placeholder='Kosongkan jika tidak ingin mengubah'
                  className='pr-10'
                  {...registerEdit('password')}
                />
                <button
                  type='button'
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                >
                  {showEditPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {errorsEdit.password && (
                <p className='text-sm text-destructive'>
                  {errorsEdit.password.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-user-confirmPassword'>
                Konfirmasi Password Baru
              </Label>
              <div className='relative'>
                <Input
                  id='edit-user-confirmPassword'
                  type={showEditConfirmPassword ? 'text' : 'password'}
                  placeholder='Ulangi password baru'
                  className='pr-10'
                  {...registerEdit('confirmPassword')}
                />
                <button
                  type='button'
                  onClick={() =>
                    setShowEditConfirmPassword(!showEditConfirmPassword)
                  }
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                >
                  {showEditConfirmPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {errorsEdit.confirmPassword && (
                <p className='text-sm text-destructive'>
                  {errorsEdit.confirmPassword.message}
                </p>
              )}
            </div>

            <DialogFooter className='pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingUser(null);
                  resetEdit();
                }}
              >
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
    </div>
  );
}
