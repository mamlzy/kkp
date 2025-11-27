import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Users,
  FileUp,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  predictSingle,
  predictBatch,
  downloadBatchResults,
  getTemplateUrl,
} from '@/lib/api';
import { formatProbability } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type {
  PredictionRequest,
  PredictionResponse,
  BatchPredictResponse,
} from '@/types';
import { FEATURE_LABELS, FEATURE_ORDER } from '@/types';

const predictionSchema = z.object({
  model_id: z.number().min(1, 'Pilih model terlebih dahulu'),
  nama: z.string().optional(),
  pai: z.number().min(0).max(100),
  pendidikan_pancasila: z.number().min(0).max(100),
  bahasa_indonesia: z.number().min(0).max(100),
  matematika: z.number().min(0).max(100),
  ipa: z.number().min(0).max(100),
  ips: z.number().min(0).max(100),
  bahasa_inggris: z.number().min(0).max(100),
  penjas: z.number().min(0).max(100),
  tik: z.number().min(0).max(100),
  sbk: z.number().min(0).max(100),
  prakarya: z.number().min(0).max(100),
  bahasa_sunda: z.number().min(0).max(100),
  btq: z.number().min(0),
  absen: z.number().min(0),
});

type PredictionFormData = z.infer<typeof predictionSchema>;

export function Prediction() {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [singleResult, setSingleResult] = useState<PredictionResponse | null>(
    null,
  );
  const [batchResult, setBatchResult] = useState<BatchPredictResponse | null>(
    null,
  );
  const [selectedBatchFile, setSelectedBatchFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getModels,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PredictionFormData>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      nama: '',
      pai: 0,
      pendidikan_pancasila: 0,
      bahasa_indonesia: 0,
      matematika: 0,
      ipa: 0,
      ips: 0,
      bahasa_inggris: 0,
      penjas: 0,
      tik: 0,
      sbk: 0,
      prakarya: 0,
      bahasa_sunda: 0,
      btq: 0,
      absen: 0,
    },
  });

  const singlePredictionMutation = useMutation({
    mutationFn: (data: PredictionRequest) => predictSingle(data),
    onSuccess: (result) => {
      setSingleResult(result);
      toast({
        title: 'Prediksi berhasil',
        description: `Hasil: ${
          result.prediction === 'berprestasi'
            ? 'Berprestasi'
            : 'Tidak Berprestasi'
        }`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal melakukan prediksi',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const batchPredictionMutation = useMutation({
    mutationFn: ({ file, modelId }: { file: File; modelId: number }) =>
      predictBatch(file, modelId),
    onSuccess: (result) => {
      setBatchResult(result);
      toast({
        title: 'Prediksi batch berhasil',
        description: `${result.total_count} data berhasil diprediksi`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal melakukan prediksi batch',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: ({ file, modelId }: { file: File; modelId: number }) =>
      downloadBatchResults(file, modelId),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hasil_prediksi.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Download berhasil',
        description: 'File hasil prediksi telah diunduh',
      });
    },
    onError: () => {
      toast({
        title: 'Gagal mengunduh',
        description: 'Terjadi kesalahan saat mengunduh file',
        variant: 'destructive',
      });
    },
  });

  const onSingleSubmit = (data: PredictionFormData) => {
    singlePredictionMutation.mutate(data as PredictionRequest);
  };

  const handleModelChange = (value: string) => {
    setSelectedModelId(value);
    setValue('model_id', parseInt(value, 10));
  };

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setSelectedBatchFile(file);
      setBatchResult(null);
    }
  };

  const handleBatchPredict = () => {
    if (!selectedBatchFile) {
      toast({
        title: 'File belum dipilih',
        description: 'Silakan pilih file CSV terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedModelId) {
      toast({
        title: 'Model belum dipilih',
        description: 'Silakan pilih model terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }
    batchPredictionMutation.mutate({
      file: selectedBatchFile,
      modelId: parseInt(selectedModelId, 10),
    });
  };

  const handleDownloadResults = () => {
    if (!selectedBatchFile || !selectedModelId) return;
    downloadMutation.mutate({
      file: selectedBatchFile,
      modelId: parseInt(selectedModelId, 10),
    });
  };

  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='animate-fade-in'>
        <h1 className='text-3xl font-bold tracking-tight'>Prediksi Siswa</h1>
        <p className='text-muted-foreground mt-1'>
          Prediksi status prestasi siswa menggunakan model
        </p>
      </div>

      {/* Model Selection */}
      <Card className='animate-fade-in border-none shadow-lg'>
        <CardHeader>
          <CardTitle>Pilih Model</CardTitle>
          <CardDescription>
            Pilih model yang akan digunakan untuk prediksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='max-w-md'>
            <Select value={selectedModelId} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder='Pilih model...' />
              </SelectTrigger>
              <SelectContent>
                {modelsLoading ? (
                  <SelectItem value='loading' disabled>
                    Memuat model...
                  </SelectItem>
                ) : models && models.length > 0 ? (
                  models.map((model) => (
                    <SelectItem key={model.id} value={model.id.toString()}>
                      {model.name} (Akurasi:{' '}
                      {((model.accuracy || 0) * 100).toFixed(1)}%)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value='empty' disabled>
                    Belum ada model tersedia
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Tabs */}
      <Tabs defaultValue='single' className='animate-fade-in'>
        <TabsList className='grid w-full max-w-md grid-cols-2'>
          <TabsTrigger value='single' className='gap-2'>
            <User className='h-4 w-4' />
            Satu Siswa
          </TabsTrigger>
          <TabsTrigger value='batch' className='gap-2'>
            <Users className='h-4 w-4' />
            Banyak Siswa
          </TabsTrigger>
        </TabsList>

        {/* Single Prediction */}
        <TabsContent value='single'>
          <Card className='border-none shadow-lg'>
            <CardHeader>
              <CardTitle>Prediksi Satu Siswa</CardTitle>
              <CardDescription>
                Masukkan nilai siswa untuk mendapatkan prediksi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSingleSubmit)}
                className='space-y-6'
              >
                {/* Nama Siswa (Opsional) */}
                <div className='space-y-2 max-w-md'>
                  <Label htmlFor='nama'>Nama Siswa (Opsional)</Label>
                  <Input
                    id='nama'
                    type='text'
                    placeholder='Masukkan nama siswa...'
                    {...register('nama')}
                  />
                </div>

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                  {FEATURE_ORDER.map((key) => (
                    <div key={key} className='space-y-2'>
                      <Label htmlFor={key}>{FEATURE_LABELS[key]}</Label>
                      <Input
                        id={key}
                        type='number'
                        min={0}
                        max={key === 'btq' || key === 'absen' ? undefined : 100}
                        step='0.01'
                        {...register(key, { valueAsNumber: true })}
                        className={errors[key] ? 'border-destructive' : ''}
                      />
                      {errors[key] && (
                        <p className='text-xs text-destructive'>
                          {errors[key]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className='flex justify-end'>
                  <Button
                    type='submit'
                    disabled={
                      !selectedModelId || singlePredictionMutation.isPending
                    }
                  >
                    {singlePredictionMutation.isPending && (
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    )}
                    Prediksi
                  </Button>
                </div>
              </form>

              {/* Single Result */}
              {singleResult && (
                <div className='mt-6 rounded-lg border p-6 bg-gradient-to-br from-primary/5 to-cyan-500/5'>
                  <h4 className='font-semibold mb-4'>Hasil Prediksi</h4>
                  {singleResult.nama && (
                    <p className='text-sm text-muted-foreground mb-3'>
                      Nama Siswa:{' '}
                      <span className='font-medium text-foreground'>
                        {singleResult.nama}
                      </span>
                    </p>
                  )}
                  <div className='flex items-center gap-4'>
                    <div
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                        singleResult.prediction === 'berprestasi'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {singleResult.prediction === 'berprestasi' ? (
                        <CheckCircle className='h-4 w-4' />
                      ) : (
                        <XCircle className='h-4 w-4' />
                      )}
                      {singleResult.prediction === 'berprestasi'
                        ? 'Berprestasi'
                        : 'Tidak Berprestasi'}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Probabilitas:{' '}
                      <span className='font-medium'>
                        {formatProbability(
                          singleResult.probability[singleResult.prediction] ||
                            0,
                        )}
                      </span>
                    </div>
                  </div>
                  <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                    <div className='rounded-lg bg-white/50 p-3'>
                      <p className='text-xs text-muted-foreground'>
                        Berprestasi
                      </p>
                      <p className='text-lg font-semibold text-green-600'>
                        {formatProbability(
                          singleResult.probability.berprestasi || 0,
                        )}
                      </p>
                    </div>
                    <div className='rounded-lg bg-white/50 p-3'>
                      <p className='text-xs text-muted-foreground'>
                        Tidak Berprestasi
                      </p>
                      <p className='text-lg font-semibold text-amber-600'>
                        {formatProbability(
                          singleResult.probability.tidak_berprestasi || 0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Prediction */}
        <TabsContent value='batch'>
          <Card className='border-none shadow-lg'>
            <CardHeader>
              <CardTitle>Prediksi Banyak Siswa</CardTitle>
              <CardDescription>
                Upload file CSV berisi data siswa untuk prediksi massal
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex flex-wrap items-end gap-4'>
                <div className='flex-1 min-w-[200px] space-y-2'>
                  <Label htmlFor='batch-file'>File Dataset (CSV)</Label>
                  <Input
                    id='batch-file'
                    type='file'
                    accept='.csv'
                    ref={fileInputRef}
                    onChange={handleBatchFileChange}
                  />
                </div>
                <Button variant='outline' asChild>
                  <a href={getTemplateUrl()} download>
                    <Download className='h-4 w-4 mr-2' />
                    Download Template
                  </a>
                </Button>
                <Button
                  onClick={handleBatchPredict}
                  disabled={
                    !selectedModelId ||
                    !selectedBatchFile ||
                    batchPredictionMutation.isPending
                  }
                >
                  {batchPredictionMutation.isPending && (
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  )}
                  <FileUp className='h-4 w-4 mr-2' />
                  Prediksi
                </Button>
              </div>

              {selectedBatchFile && (
                <p className='text-sm text-muted-foreground'>
                  File terpilih: {selectedBatchFile.name}
                </p>
              )}

              <div className='rounded-lg bg-muted p-3 text-sm'>
                <div className='flex items-start gap-2'>
                  <AlertCircle className='h-4 w-4 mt-0.5 text-amber-500' />
                  <div>
                    <p className='font-medium'>Format CSV yang dibutuhkan:</p>
                    <p className='text-muted-foreground text-xs mt-1'>
                      <span className='font-medium text-foreground'>nama</span>{' '}
                      (wajib),
                      <span className='font-medium text-foreground'>
                        {' '}
                        kode_unik
                      </span>{' '}
                      (opsional, bisa diisi NIS), pai, pendidikan_pancasila,
                      bahasa_indonesia, matematika, ipa, ips, bahasa_inggris,
                      penjas, tik, sbk, prakarya, bahasa_sunda, btq, absen
                    </p>
                    <p className='text-muted-foreground text-xs mt-1'>
                      Kolom status bersifat opsional untuk prediksi
                    </p>
                  </div>
                </div>
              </div>

              {/* Batch Results */}
              {batchResult && (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h4 className='font-semibold'>Hasil Prediksi</h4>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleDownloadResults}
                    >
                      <Download className='h-4 w-4 mr-2' />
                      Download Hasil
                    </Button>
                  </div>

                  <div className='grid gap-4 sm:grid-cols-3'>
                    <div className='rounded-lg bg-muted p-4 text-center'>
                      <p className='text-2xl font-bold'>
                        {batchResult.total_count}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Total Data
                      </p>
                    </div>
                    <div className='rounded-lg bg-green-50 p-4 text-center'>
                      <p className='text-2xl font-bold text-green-600'>
                        {batchResult.berprestasi_count}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Berprestasi
                      </p>
                    </div>
                    <div className='rounded-lg bg-amber-50 p-4 text-center'>
                      <p className='text-2xl font-bold text-amber-600'>
                        {batchResult.tidak_berprestasi_count}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Tidak Berprestasi
                      </p>
                    </div>
                  </div>

                  <div className='rounded-lg border overflow-hidden'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-16'>No</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Kode Unik</TableHead>
                          <TableHead>Prediksi</TableHead>
                          <TableHead>Prob. Berprestasi</TableHead>
                          <TableHead>Prob. Tidak Berprestasi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchResult.results.slice(0, 10).map((result) => (
                          <TableRow key={result.row_index}>
                            <TableCell className='font-medium'>
                              {result.row_index + 1}
                            </TableCell>
                            <TableCell className='font-medium'>
                              {result.nama || '-'}
                            </TableCell>
                            <TableCell className='text-muted-foreground'>
                              {result.kode_unik || '-'}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                  result.prediction === 'berprestasi'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {result.prediction === 'berprestasi' ? (
                                  <CheckCircle className='h-3 w-3' />
                                ) : (
                                  <XCircle className='h-3 w-3' />
                                )}
                                {result.prediction === 'berprestasi'
                                  ? 'Berprestasi'
                                  : 'Tidak Berprestasi'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {formatProbability(
                                result.probability.berprestasi || 0,
                              )}
                            </TableCell>
                            <TableCell>
                              {formatProbability(
                                result.probability.tidak_berprestasi || 0,
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {batchResult.results.length > 10 && (
                      <div className='p-3 text-center text-sm text-muted-foreground bg-muted'>
                        Menampilkan 10 dari {batchResult.results.length} data.
                        Download hasil untuk melihat semua data.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
