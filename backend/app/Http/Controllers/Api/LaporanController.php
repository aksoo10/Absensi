<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\JadwalKerja;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LaporanController extends Controller
{
    /**
     * Ringkasan dashboard (Admin)
     */
    public function dashboard()
    {
        $today = today();
        $hariIni = $today->locale('id')->isoFormat('dddd');

        $totalPegawai = Pegawai::where('status', 'aktif')->count();

        $todayStats = Absensi::where('tanggal', $today)
            ->selectRaw("
                COUNT(CASE WHEN jam_masuk IS NOT NULL THEN 1 END) as hadir,
                COUNT(CASE WHEN status_masuk = 'terlambat' THEN 1 END) as terlambat
            ")
            ->first();

        $hadirHariIni = (int) ($todayStats->hadir ?? 0);
        $terlambatHariIni = (int) ($todayStats->terlambat ?? 0);
        $pengajuanPending = Pengajuan::where('status', 'pending')->count();

        // Absensi 7 hari terakhir (1 query agregat teroptimasi)
        $startDate = $today->copy()->subDays(6)->toDateString();
        $endDate = $today->toDateString();

        $absensiAggregates = Absensi::whereBetween('tanggal', [$startDate, $endDate])
            ->selectRaw("
                DATE_FORMAT(tanggal, '%Y-%m-%d') as tgl,
                COUNT(CASE WHEN jam_masuk IS NOT NULL THEN 1 END) as hadir,
                COUNT(CASE WHEN status_masuk = 'terlambat' THEN 1 END) as terlambat,
                COUNT(*) as total_absen
            ")
            ->groupBy('tgl')
            ->get()
            ->keyBy('tgl');

        $grafik = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = $today->copy()->subDays($i);
            $tglKey = $date->toDateString();
            $agg = $absensiAggregates->get($tglKey);

            $hadir = $agg ? (int) $agg->hadir : 0;
            $terlambat = $agg ? (int) $agg->terlambat : 0;
            $totalAbsen = $agg ? (int) $agg->total_absen : 0;

            $grafik[] = [
                'tanggal' => $tglKey,
                'hari' => $date->locale('id')->isoFormat('ddd'),
                'hadir' => $hadir,
                'terlambat' => $terlambat,
                'tidak_hadir' => max(0, $totalPegawai - $totalAbsen),
            ];
        }

        return response()->json([
            'total_pegawai' => $totalPegawai,
            'hadir_hari_ini' => $hadirHariIni,
            'terlambat_hari_ini' => $terlambatHariIni,
            'pengajuan_pending' => $pengajuanPending,
            'tidak_hadir_hari_ini' => $totalPegawai - $hadirHariIni,
            'hari_ini' => $hariIni,
            'tanggal' => $today->toDateString(),
            'grafik_mingguan' => $grafik,
        ]);
    }

    /**
     * Laporan absensi per periode
     */
    public function absensi(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|between:1,12',
            'tahun' => 'required|integer|min:2020|max:2099',
            'pegawai_id' => 'nullable|exists:pegawais,id',
        ]);

        $bulan = (int) $request->bulan;
        $tahun = (int) $request->tahun;
        $pegawaiId = $request->pegawai_id;

        $cacheKey = "laporan_absensi_{$bulan}_{$tahun}" . ($pegawaiId ? "_{$pegawaiId}" : '');

        $laporan = Cache::remember($cacheKey, 60, function () use ($bulan, $tahun, $pegawaiId) {
            $startDate = sprintf('%04d-%02d-01', $tahun, $bulan);
            $endDate = date('Y-m-t', strtotime($startDate));

            $query = Pegawai::select('id', 'nama', 'nip', 'nik', 'jabatan', 'status')
                ->with([
                    'absensis' => function ($q) use ($startDate, $endDate) {
                        $q->select('id', 'pegawai_id', 'tanggal', 'jam_masuk', 'jam_pulang', 'status_masuk')
                          ->whereBetween('tanggal', [$startDate, $endDate]);
                    },
                    'pengajuans' => function ($q) use ($startDate, $endDate) {
                        $q->select('id', 'pegawai_id', 'jenis', 'tanggal_mulai', 'status')
                          ->whereBetween('tanggal_mulai', [$startDate, $endDate])
                          ->where('status', 'disetujui');
                    }
                ])
                ->where('status', 'aktif');

            if ($pegawaiId) {
                $query->where('id', $pegawaiId);
            }

            $pegawais = $query->orderBy('nama')->get();

            return $pegawais->map(function ($pegawai) {
                $absensis = $pegawai->absensis;
                $pengajuans = $pegawai->pengajuans;

                return [
                    'pegawai_id' => $pegawai->id,
                    'nama' => $pegawai->nama,
                    'nip' => $pegawai->nip,
                    'nik' => $pegawai->nik,
                    'jabatan' => $pegawai->jabatan,
                    'hadir' => $absensis->whereNotNull('jam_masuk')->count(),
                    'terlambat' => $absensis->where('status_masuk', 'terlambat')->count(),
                    'tepat_waktu' => $absensis->where('status_masuk', 'tepat_waktu')->count(),
                    'izin' => $pengajuans->where('jenis', 'izin')->count(),
                    'sakit' => $pengajuans->where('jenis', 'sakit')->count(),
                    'dinas_luar' => $pengajuans->where('jenis', 'dinas_luar')->count(),
                    'total_jam_kerja' => (int) round($absensis->sum(function ($a) {
                        if ($a->jam_masuk && $a->jam_pulang) {
                            return max(0, (strtotime($a->jam_pulang) - strtotime($a->jam_masuk)) / 3600);
                        }
                        return 0;
                    })),
                ];
            })->values()->all();
        });

        if ($laporan instanceof \Illuminate\Support\Collection) {
            $laporan = $laporan->values()->all();
        } elseif (!is_array($laporan)) {
            Cache::forget($cacheKey);
            $laporan = [];
        }

        return response()->json([
            'bulan' => $bulan,
            'tahun' => $tahun,
            'laporan' => $laporan,
        ]);
    }

    /**
     * Dashboard ringkasan untuk pegawai
     */
    public function dashboardPegawai(Request $request)
    {
        $pegawai = $request->user()->pegawai;

        if (!$pegawai) {
            return response()->json(['message' => 'Data pegawai tidak ditemukan'], 404);
        }

        $bulan = now()->month;
        $tahun = now()->year;

        // Agregat absensi bulan ini dalam 1 query ringkas
        $absensiStats = Absensi::where('pegawai_id', $pegawai->id)
            ->whereMonth('tanggal', $bulan)
            ->whereYear('tanggal', $tahun)
            ->selectRaw("
                COUNT(CASE WHEN jam_masuk IS NOT NULL THEN 1 END) as hadir,
                COUNT(CASE WHEN status_masuk = 'terlambat' THEN 1 END) as terlambat
            ")
            ->first();

        // Agregat pengajuan bulan ini dalam 1 query ringkas
        $pengajuanStats = Pengajuan::where('pegawai_id', $pegawai->id)
            ->whereMonth('tanggal_mulai', $bulan)
            ->whereYear('tanggal_mulai', $tahun)
            ->selectRaw("
                COUNT(CASE WHEN jenis = 'izin' AND status = 'disetujui' THEN 1 END) as izin,
                COUNT(CASE WHEN jenis = 'sakit' AND status = 'disetujui' THEN 1 END) as sakit,
                COUNT(CASE WHEN jenis = 'dinas_luar' AND status = 'disetujui' THEN 1 END) as dinas_luar
            ")
            ->first();

        $pengajuanPending = Pengajuan::where('pegawai_id', $pegawai->id)
            ->where('status', 'pending')
            ->count();

        $absensiTerbaru = Absensi::where('pegawai_id', $pegawai->id)
            ->latest('tanggal')
            ->take(7)
            ->get();

        // Data absensi hari ini & jadwal agar frontend tidak perlu request ganda
        $absensiHariIni = Absensi::where('pegawai_id', $pegawai->id)
            ->where('tanggal', today())
            ->first();

        $jadwal = Cache::remember('jadwal_default', 3600, function () {
            return JadwalKerja::where('is_default', true)->first();
        });

        return response()->json([
            'pegawai' => $pegawai,
            'bulan_ini' => [
                'hadir' => (int) ($absensiStats->hadir ?? 0),
                'terlambat' => (int) ($absensiStats->terlambat ?? 0),
                'izin' => (int) ($pengajuanStats->izin ?? 0),
                'sakit' => (int) ($pengajuanStats->sakit ?? 0),
                'dinas_luar' => (int) ($pengajuanStats->dinas_luar ?? 0),
                'pengajuan_pending' => (int) $pengajuanPending,
            ],
            'absensi_terbaru' => $absensiTerbaru,
            'hari_ini' => [
                'absensi' => $absensiHariIni,
                'jadwal' => $jadwal,
                'tanggal' => today()->toDateString(),
                'hari' => now()->locale('id')->isoFormat('dddd'),
            ],
        ]);
    }
}
