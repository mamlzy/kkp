import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  FileUp,
  Loader2,
  AlertCircle,
  Lock,
  Pencil,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getModels,
  deleteModel,
  trainModel,
  updateModel,
  getTemplateUrl,
} from '@/lib/api';
import { formatDate, formatAccuracy } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import type { ModelMeta } from '@/types';

export function Model() {
  const [isTrainDialogOpen, setIsTrainDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [modelName, setModelName] = useState('');
  const [editingModel, setEditingModel] = useState<ModelMeta | null>(null);
  const [editModelName, setEditModelName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canCreateModel, canDeleteModel } = useAuth();

  const { data: models, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getModels,
  });

  const trainMutation = useMutation({
    mutationFn: ({ file, name }: { file: File; name?: string }) =>
      trainModel(file, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsTrainDialogOpen(false);
      setModelName('');
      setSelectedFile(null);
      toast({
        title: 'Model berhasil dibuat!',
        description: `Model "${
          data.name
        }" telah dilatih dengan akurasi ${formatAccuracy(data.accuracy)}`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal membuat model',
        description: error.message || 'Terjadi kesalahan saat melatih model',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast({
        title: 'Model dihapus',
        description: 'Model berhasil dihapus dari sistem',
      });
    },
    onError: () => {
      toast({
        title: 'Gagal menghapus model',
        description: 'Terjadi kesalahan saat menghapus model',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateModel(id, { name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      setIsEditDialogOpen(false);
      setEditingModel(null);
      setEditModelName('');
      toast({
        title: 'Model berhasil diperbarui',
        description: `Nama model diubah menjadi "${data.name}"`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal memperbarui model',
        description:
          error.message || 'Terjadi kesalahan saat memperbarui model',
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Format file tidak valid',
          description: 'Silakan upload file dengan format CSV',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleTrainModel = () => {
    if (!selectedFile) {
      toast({
        title: 'File belum dipilih',
        description: 'Silakan pilih file CSV terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }
    trainMutation.mutate({ file: selectedFile, name: modelName || undefined });
  };

  const handleDeleteModel = (model: ModelMeta) => {
    if (
      window.confirm(`Apakah Anda yakin ingin menghapus model "${model.name}"?`)
    ) {
      deleteMutation.mutate(model.id);
    }
  };

  const handleEditModel = (model: ModelMeta) => {
    setEditingModel(model);
    setEditModelName(model.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateModel = () => {
    if (!editingModel) return;

    if (!editModelName.trim()) {
      toast({
        title: 'Nama model tidak boleh kosong',
        description: 'Silakan masukkan nama model',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate({ id: editingModel.id, name: editModelName.trim() });
  };

  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='flex md:items-center gap-4 flex-col md:flex-row justify-between animate-fade-in'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Manajemen Model</h1>
          <p className='text-muted-foreground mt-1'>
            Kelola model untuk prediksi siswa berprestasi
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' asChild>
            <a href={getTemplateUrl()} download>
              <FileUp className='h-4 w-4 mr-2' />
              Download Template
            </a>
          </Button>
          <Dialog open={isTrainDialogOpen} onOpenChange={setIsTrainDialogOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={!canCreateModel}
                title={
                  !canCreateModel
                    ? 'Anda tidak memiliki akses untuk membuat model'
                    : undefined
                }
              >
                {!canCreateModel ? (
                  <Lock className='h-4 w-4 mr-2' />
                ) : (
                  <Plus className='h-4 w-4 mr-2' />
                )}
                Buat Model
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle>Buat Model Baru</DialogTitle>
                <DialogDescription>
                  Upload file CSV dataset untuk melatih model baru
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='model-name'>Nama Model (Opsional)</Label>
                  <Input
                    id='model-name'
                    placeholder='Masukkan nama model'
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='csv-file'>File Dataset (CSV)</Label>
                  <div className='flex gap-2'>
                    <Input
                      id='csv-file'
                      type='file'
                      accept='.csv'
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className='flex-1'
                    />
                  </div>
                  {selectedFile && (
                    <p className='text-sm text-muted-foreground'>
                      File terpilih: {selectedFile.name}
                    </p>
                  )}
                </div>
                <div className='rounded-lg bg-muted p-3 text-sm'>
                  <div className='flex items-start gap-2'>
                    <AlertCircle className='h-4 w-4 mt-0.5 text-amber-500' />
                    <div>
                      <p className='font-medium'>Format CSV yang dibutuhkan:</p>
                      <p className='text-muted-foreground text-xs mt-1'>
                        pai, pendidikan_pancasila, bahasa_indonesia, matematika,
                        ipa, ips, bahasa_inggris, penjas, tik, sbk, prakarya,
                        bahasa_sunda, btq, absen, status
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setIsTrainDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleTrainModel}
                  disabled={!selectedFile || trainMutation.isPending}
                >
                  {trainMutation.isPending && (
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  )}
                  Latih Model
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Model Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Nama Model</DialogTitle>
            <DialogDescription>
              Ubah nama model "{editingModel?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-model-name'>Nama Model</Label>
              <Input
                id='edit-model-name'
                placeholder='Masukkan nama model'
                value={editModelName}
                onChange={(e) => setEditModelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editModelName.trim()) {
                    handleUpdateModel();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdateModel}
              disabled={!editModelName.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Models Table */}
      <Card className='animate-fade-in border-none shadow-lg'>
        <CardHeader>
          <CardTitle>Daftar Model</CardTitle>
          <CardDescription>Semua model yang telah dilatih</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : models && models.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className='hidden md:block'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Model</TableHead>
                      <TableHead>Akurasi</TableHead>
                      <TableHead>Dataset</TableHead>
                      <TableHead>Tanggal Dibuat</TableHead>
                      <TableHead className='text-right'>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell className='font-medium'>
                          {model.name}
                        </TableCell>
                        <TableCell>
                          <span className='inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700'>
                            {formatAccuracy(model.accuracy)}
                          </span>
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {model.dataset_path || '-'}
                        </TableCell>
                        <TableCell className='text-muted-foreground'>
                          {formatDate(model.created_at)}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-2'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleEditModel(model)}
                              disabled={
                                updateMutation.isPending || !canCreateModel
                              }
                              title={
                                !canCreateModel
                                  ? 'Anda tidak memiliki akses untuk mengedit model'
                                  : 'Edit nama model'
                              }
                              className='group'
                            >
                              {!canCreateModel ? (
                                <Lock className='h-4 w-4 text-muted-foreground' />
                              ) : (
                                <Pencil className='h-4 w-4 text-primary group-hover:text-primary-foreground' />
                              )}
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => handleDeleteModel(model)}
                              disabled={
                                deleteMutation.isPending || !canDeleteModel
                              }
                              title={
                                !canDeleteModel
                                  ? 'Anda tidak memiliki akses untuk menghapus model'
                                  : 'Hapus model'
                              }
                            >
                              {!canDeleteModel ? (
                                <Lock className='h-4 w-4 text-muted-foreground' />
                              ) : (
                                <Trash2 className='h-4 w-4 text-destructive' />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className='md:hidden space-y-4'>
                {models.map((model) => (
                  <Card key={model.id} className='border shadow-sm'>
                    <CardContent className='p-4 space-y-3'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-semibold text-base truncate'>
                            {model.name}
                          </h3>
                          <p className='text-xs text-muted-foreground mt-1'>
                            {formatDate(model.created_at)}
                          </p>
                        </div>
                        <span className='inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 whitespace-nowrap'>
                          {formatAccuracy(model.accuracy)}
                        </span>
                      </div>

                      <div className='space-y-1.5'>
                        <div className='flex items-center gap-2 text-sm'>
                          <span className='text-muted-foreground text-xs'>
                            Dataset:
                          </span>
                          <span className='text-xs truncate'>
                            {model.dataset_path || '-'}
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center gap-2 pt-2 border-t'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleEditModel(model)}
                          disabled={updateMutation.isPending || !canCreateModel}
                          className='flex-1'
                        >
                          {!canCreateModel ? (
                            <>
                              <Lock className='h-3.5 w-3.5 mr-1.5' />
                              Edit
                            </>
                          ) : (
                            <>
                              <Pencil className='h-3.5 w-3.5 mr-1.5' />
                              Edit
                            </>
                          )}
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleDeleteModel(model)}
                          disabled={deleteMutation.isPending || !canDeleteModel}
                          className='flex-1 text-destructive hover:text-destructive'
                        >
                          {!canDeleteModel ? (
                            <>
                              <Lock className='h-3.5 w-3.5 mr-1.5' />
                              Hapus
                            </>
                          ) : (
                            <>
                              <Trash2 className='h-3.5 w-3.5 mr-1.5' />
                              Hapus
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <div className='rounded-full bg-muted p-4 mb-4'>
                <AlertCircle className='h-8 w-8 text-muted-foreground' />
              </div>
              <h3 className='font-semibold mb-1'>Belum ada model</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                {canCreateModel
                  ? 'Buat model pertama Anda dengan mengupload dataset CSV'
                  : 'Belum ada model yang tersedia. Hubungi admin untuk membuat model.'}
              </p>
              {canCreateModel && (
                <Button onClick={() => setIsTrainDialogOpen(true)}>
                  <Plus className='h-4 w-4 mr-2' />
                  Buat Model
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
