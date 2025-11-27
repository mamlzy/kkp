import { useQuery } from '@tanstack/react-query';
import { Brain, Database, Target, TrendingUp } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getDashboardSummary, getModels } from '@/lib/api';
import { formatAccuracy } from '@/lib/utils';

const COLORS = ['#0ea5e9', '#f59e0b'];

export function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: 30000,
  });

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: getModels,
  });

  const pieData = summary?.status_distribution
    ? [
        {
          name: 'Berprestasi',
          value: summary.status_distribution.berprestasi || 0,
        },
        {
          name: 'Tidak Berprestasi',
          value: summary.status_distribution.tidak_berprestasi || 0,
        },
      ]
    : [];

  const hasPieData = pieData.some((d) => d.value > 0);

  const accuracyData = models
    ?.slice(0, 5)
    .reverse()
    .map((m, i) => ({
      name: `Model ${i + 1}`,
      accuracy: (m.accuracy || 0) * 100,
    }));

  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='animate-fade-in'>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground mt-1'>
          Ringkasan sistem prediksi siswa berprestasi
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='animate-fade-in stagger-1 border-none shadow-lg hover:shadow-xl transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Model
            </CardTitle>
            <div className='rounded-lg bg-primary/10 p-2'>
              <Brain className='h-4 w-4 text-primary' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {summaryLoading ? '...' : summary?.total_models || 0}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Model terlatih</p>
          </CardContent>
        </Card>

        <Card className='animate-fade-in stagger-2 border-none shadow-lg hover:shadow-xl transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Dataset
            </CardTitle>
            <div className='rounded-lg bg-cyan-500/10 p-2'>
              <Database className='h-4 w-4 text-cyan-500' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {summaryLoading ? '...' : summary?.total_datasets || 0}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Dataset tersimpan
            </p>
          </CardContent>
        </Card>

        <Card className='animate-fade-in stagger-3 border-none shadow-lg hover:shadow-xl transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Akurasi Model Terbaru
            </CardTitle>
            <div className='rounded-lg bg-green-500/10 p-2'>
              <Target className='h-4 w-4 text-green-500' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {summaryLoading
                ? '...'
                : formatAccuracy(summary?.latest_model_accuracy)}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Tingkat akurasi
            </p>
          </CardContent>
        </Card>

        <Card className='animate-fade-in stagger-4 border-none shadow-lg hover:shadow-xl transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Prediksi
            </CardTitle>
            <div className='rounded-lg bg-amber-500/10 p-2'>
              <TrendingUp className='h-4 w-4 text-amber-500' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {summaryLoading
                ? '...'
                : summary?.prediction_stats?.total_predictions || 0}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Prediksi dilakukan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Status Distribution Chart */}
        <Card className='animate-fade-in border-none shadow-lg'>
          <CardHeader>
            <CardTitle>Distribusi Status Prediksi</CardTitle>
            <CardDescription>
              Perbandingan hasil prediksi siswa berprestasi dan tidak
              berprestasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPieData ? (
              <div className='h-[300px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey='value'
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className='flex h-[300px] items-center justify-center text-muted-foreground'>
                <p>Belum ada data prediksi</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accuracy Trend Chart */}
        <Card className='animate-fade-in border-none shadow-lg'>
          <CardHeader>
            <CardTitle>Akurasi Model</CardTitle>
            <CardDescription>
              Perbandingan akurasi 5 model terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accuracyData && accuracyData.length > 0 ? (
              <div className='space-y-4'>
                {accuracyData.map((item, index) => (
                  <div key={index} className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='font-medium'>{item.name}</span>
                      <span className='text-muted-foreground'>
                        {item.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                      <div
                        className='h-full rounded-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-500'
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex h-[300px] items-center justify-center text-muted-foreground'>
                <p>Belum ada model terlatih</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className='animate-fade-in border-none shadow-lg bg-gradient-to-br from-primary/5 to-cyan-500/5'>
        <CardHeader>
          <CardTitle>Tentang Sistem</CardTitle>
          <CardDescription>
            Informasi mengenai metode CART dan fitur prediksi
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 text-sm text-muted-foreground'>
          <p>
            Sistem ini menggunakan metode{' '}
            <strong>Classification and Regression Tree (CART)</strong> untuk
            memprediksi status prestasi siswa berdasarkan nilai mata pelajaran
            dan kehadiran.
          </p>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='rounded-lg bg-white/50 p-4'>
              <h4 className='font-semibold text-foreground mb-2'>
                Fitur Prediksi
              </h4>
              <ul className='space-y-1 text-xs'>
                <li>• PAI, Pendidikan Pancasila</li>
                <li>• Bahasa Indonesia, Matematika</li>
                <li>• IPA, IPS, Bahasa Inggris</li>
                <li>• Penjas, TIK, SBK</li>
                <li>• Prakarya, Bahasa Sunda, BTQ</li>
                <li>• Jumlah Absen</li>
              </ul>
            </div>
            <div className='rounded-lg bg-white/50 p-4'>
              <h4 className='font-semibold text-foreground mb-2'>
                Cara Penggunaan
              </h4>
              <ul className='space-y-1 text-xs'>
                <li>1. Upload dataset CSV untuk melatih model</li>
                <li>2. Lihat akurasi model pada halaman Model</li>
                <li>3. Lakukan prediksi single atau batch</li>
                <li>4. Download template CSV jika diperlukan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
