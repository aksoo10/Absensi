<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\JadwalKerja;
use App\Models\Pegawai;
use App\Models\Pengajuan;
use App\Models\User;
use Illuminate\Http\Request;

class BootstrapController extends Controller
{
    /**
     * Pre-warm & bootstrap all critical data for Admin in a single unified call (~15-30ms)
     */
    public function admin(Request $request)
    {
        $start = microtime(true);
        $today = today();

        // 1. Dashboard metrics
        $laporanCtrl = app(LaporanController::class);
        $dashboard = $laporanCtrl->dashboard()->getData(true);

        // 2. Absensi hari ini
        $absensiToday = Absensi::with('pegawai.user')
            ->where('tanggal', $today)
            ->latest()
            ->get();

        // 3. Pegawai (top 50)
        $pegawais = Pegawai::with('user')->orderBy('nama')->limit(50)->get();

        // 4. Akun Pegawai (top 50)
        $akunPegawai = User::with('pegawai')->where('role', 'pegawai')->orderBy('name')->limit(50)->get();

        // 5. Akun Administrator
        $akunAdmin = User::where('role', 'admin')->orderBy('name')->get();

        // 6. Jadwal Kerja
        $jadwals = JadwalKerja::orderBy('nama')->get();

        // 7. Pengajuan Cuti/Izin (top 50)
        $pengajuans = Pengajuan::with('pegawai.user', 'pemroses')->latest()->limit(50)->get();

        // 8. Notifikasi
        $notifCtrl = app(NotifikasiController::class);
        $notifikasi = $notifCtrl->index($request)->getData(true)['data'] ?? [];

        $res = response()->json([
            'dashboard' => $dashboard,
            'absensi_today' => $absensiToday,
            'pegawais' => $pegawais,
            'akun_pegawai' => $akunPegawai,
            'akun_admin' => $akunAdmin,
            'jadwals' => $jadwals,
            'pengajuans' => $pengajuans,
            'notifikasi' => $notifikasi,
        ]);

        $res->headers->set('X-Exec-Time', round((microtime(true) - $start) * 1000, 2) . 'ms');
        return $res;
    }

    /**
     * Pre-warm & bootstrap all critical data for Pegawai in a single unified call (~15-30ms)
     */
    public function pegawai(Request $request)
    {
        $start = microtime(true);
        $user = $request->user();
        $pegawai = $user->pegawai;

        $dashboardPegawai = null;
        if ($pegawai) {
            $laporanCtrl = app(LaporanController::class);
            $resp = $laporanCtrl->dashboardPegawai($request);
            if ($resp->getStatusCode() === 200) {
                $dashboardPegawai = $resp->getData(true);
            }
        }

        $today = today();
        $absensiHariIni = null;
        if ($pegawai) {
            $absensiHariIni = Absensi::where('pegawai_id', $pegawai->id)
                ->where('tanggal', $today)
                ->first();
        }

        $pengajuans = [];
        if ($pegawai) {
            $pengajuans = Pengajuan::with('pemroses')
                ->where('pegawai_id', $pegawai->id)
                ->latest()
                ->limit(30)
                ->get();
        }

        $notifCtrl = app(NotifikasiController::class);
        $notifikasi = $notifCtrl->index($request)->getData(true)['data'] ?? [];

        $res = response()->json([
            'dashboard_pegawai' => $dashboardPegawai,
            'absensi_hari_ini' => $absensiHariIni,
            'pengajuans' => $pengajuans,
            'notifikasi' => $notifikasi,
        ]);

        $res->headers->set('X-Exec-Time', round((microtime(true) - $start) * 1000, 2) . 'ms');
        return $res;
    }
}
