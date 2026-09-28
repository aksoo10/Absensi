<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

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
        $hadirHariIni = Absensi::where('tanggal', $today)->whereNotNull('jam_masuk')->count();
        $terlambatHariIni = Absensi::where('tanggal', $today)->where('status_masuk', 'terlambat')->count();
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

        $bulan = $request->bulan;
        $tahun = $request->tahun;

        $query = Pegawai::with(['absensis' => function ($q) use ($bulan, $tahun) {
            $q->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun);
        }, 'pengajuans' => function ($q) use ($bulan, $tahun) {
            $q->whereMonth('tanggal_mulai', $bulan)->whereYear('tanggal_mulai', $tahun)->where('status', 'disetujui');
        }])->where('status', 'aktif');

        if ($request->pegawai_id) {
            $query->where('id', $request->pegawai_id);
        }

        $pegawais = $query->get();

        $laporan = $pegawais->map(function ($pegawai) {
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
                'total_jam_kerja' => $absensis->sum(function ($a) {
                    if ($a->jam_masuk && $a->jam_pulang) {
                        return Carbon::parse($a->jam_masuk)->diffInHours(Carbon::parse($a->jam_pulang));
                    }
                    return 0;
                }),
            ];
        });

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

        $absensiBulanIni = Absensi::where('pegawai_id', $pegawai->id)
            ->whereMonth('tanggal', $bulan)->whereYear('tanggal', $tahun)->get();

        $pengajuanBulanIni = Pengajuan::where('pegawai_id', $pegawai->id)
            ->whereMonth('tanggal_mulai', $bulan)->whereYear('tanggal_mulai', $tahun)->get();

        $absensiTerbaru = Absensi::where('pegawai_id', $pegawai->id)
            ->latest('tanggal')->take(7)->get();

        return response()->json([
            'pegawai' => $pegawai,
            'bulan_ini' => [
                'hadir' => $absensiBulanIni->whereNotNull('jam_masuk')->count(),
                'terlambat' => $absensiBulanIni->where('status_masuk', 'terlambat')->count(),
                'izin' => $pengajuanBulanIni->where('jenis', 'izin')->where('status', 'disetujui')->count(),
                'sakit' => $pengajuanBulanIni->where('jenis', 'sakit')->where('status', 'disetujui')->count(),
                'dinas_luar' => $pengajuanBulanIni->where('jenis', 'dinas_luar')->where('status', 'disetujui')->count(),
                'pengajuan_pending' => Pengajuan::where('pegawai_id', $pegawai->id)->where('status', 'pending')->count(),
            ],
            'absensi_terbaru' => $absensiTerbaru,
        ]);
    }
}
