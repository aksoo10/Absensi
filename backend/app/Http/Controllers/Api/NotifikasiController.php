<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\Pengajuan;
use Carbon\Carbon;
use Illuminate\Http\Request;

class NotifikasiController extends Controller
{
    /**
     * Dapatkan daftar notifikasi cerdas untuk user (Admin & Pegawai)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $notifikasi = [];

        if ($user->role === 'admin') {
            // ─── 1. Pengajuan Pending (Perlu verifikasi) ───────────────
            $pengajuans = Pengajuan::with('pegawai')
                ->where('status', 'pending')
                ->latest()
                ->take(6)
                ->get();

            foreach ($pengajuans as $p) {
                $nama = $p->pegawai->nama ?? 'Pegawai';
                $jenis = ucfirst(str_replace('_', ' ', $p->jenis));
                $notifikasi[] = [
                    'id' => 'pengajuan-' . $p->id,
                    'type' => 'pengajuan',
                    'category' => 'warning',
                    'title' => "Pengajuan {$jenis}",
                    'message' => "{$nama} mengajukan {$jenis} ({$p->tanggal_mulai} s/d {$p->tanggal_selesai})",
                    'time' => $p->created_at ? $p->created_at->diffForHumans() : 'Baru saja',
                    'timestamp' => $p->created_at ? $p->created_at->timestamp : time(),
                    'link' => '/admin/pengajuan',
                ];
            }

            // ─── 2. Pegawai Terlambat Hari Ini ─────────────────────────
            $terlambat = Absensi::with('pegawai')
                ->where('tanggal', today())
                ->where('status_masuk', 'terlambat')
                ->latest('jam_masuk')
                ->take(5)
                ->get();

            foreach ($terlambat as $t) {
                $nama = $t->pegawai->nama ?? 'Pegawai';
                $notifikasi[] = [
                    'id' => 'terlambat-' . $t->id,
                    'type' => 'absensi_terlambat',
                    'category' => 'danger',
                    'title' => "Pegawai Terlambat",
                    'message' => "{$nama} terlambat masuk pada pukul {$t->jam_masuk}",
                    'time' => "Hari ini, {$t->jam_masuk}",
                    'timestamp' => $t->created_at ? $t->created_at->timestamp : time(),
                    'link' => '/admin/absensi',
                ];
            }

            // ─── 3. Pegawai Tepat Waktu Hari Ini ───────────────────────
            $hadir = Absensi::with('pegawai')
                ->where('tanggal', today())
                ->where('status_masuk', 'tepat_waktu')
                ->latest('jam_masuk')
                ->take(3)
                ->get();

            foreach ($hadir as $h) {
                $nama = $h->pegawai->nama ?? 'Pegawai';
                $notifikasi[] = [
                    'id' => 'hadir-' . $h->id,
                    'type' => 'absensi_hadir',
                    'category' => 'success',
                    'title' => "Absensi Tepat Waktu",
                    'message' => "{$nama} hadir tepat waktu pukul {$h->jam_masuk}",
                    'time' => "Hari ini, {$h->jam_masuk}",
                    'timestamp' => $h->created_at ? $h->created_at->timestamp : time(),
                    'link' => '/admin/absensi',
                ];
            }
        } else {
            // ─── Role Pegawai ──────────────────────────────────────────
            $pegawai = $user->pegawai;

            if ($pegawai) {
                // 1. Status pengajuan yang disetujui / ditolak
                $pengajuans = Pengajuan::where('pegawai_id', $pegawai->id)
                    ->whereIn('status', ['disetujui', 'ditolak'])
                    ->latest('diproses_pada')
                    ->take(5)
                    ->get();

                foreach ($pengajuans as $p) {
                    $jenis = ucfirst(str_replace('_', ' ', $p->jenis));
                    $isApproved = $p->status === 'disetujui';
                    $notifikasi[] = [
                        'id' => 'pengajuan-status-' . $p->id,
                        'type' => 'pengajuan_hasil',
                        'category' => $isApproved ? 'success' : 'danger',
                        'title' => "Pengajuan {$jenis} " . ucfirst($p->status),
                        'message' => "Pengajuan {$jenis} Anda telah {$p->status} oleh Admin." . ($p->catatan_admin ? " Catatan: {$p->catatan_admin}" : ""),
                        'time' => $p->diproses_pada ? Carbon::parse($p->diproses_pada)->diffForHumans() : 'Baru saja',
                        'timestamp' => $p->diproses_pada ? Carbon::parse($p->diproses_pada)->timestamp : time(),
                        'link' => '/pengajuan',
                    ];
                }

                // 2. Status pengajuan yang masih pending
                $pending = Pengajuan::where('pegawai_id', $pegawai->id)
                    ->where('status', 'pending')
                    ->latest()
                    ->take(3)
                    ->get();

                foreach ($pending as $pend) {
                    $jenis = ucfirst(str_replace('_', ' ', $pend->jenis));
                    $notifikasi[] = [
                        'id' => 'pengajuan-pending-' . $pend->id,
                        'type' => 'pengajuan_pending',
                        'category' => 'warning',
                        'title' => "Pengajuan {$jenis} Diproses",
                        'message' => "Pengajuan {$jenis} Anda sedang menunggu verifikasi oleh Admin.",
                        'time' => $pend->created_at ? $pend->created_at->diffForHumans() : 'Baru saja',
                        'timestamp' => $pend->created_at ? $pend->created_at->timestamp : time(),
                        'link' => '/pengajuan',
                    ];
                }

                // 3. Status Absensi Hari Ini
                $absensiHariIni = Absensi::where('pegawai_id', $pegawai->id)
                    ->where('tanggal', today())
                    ->first();

                if (!$absensiHariIni || !$absensiHariIni->jam_masuk) {
                    $notifikasi[] = [
                        'id' => 'pengingat-masuk-' . today()->toDateString(),
                        'type' => 'pengingat',
                        'category' => 'warning',
                        'title' => "Pengingat Absensi Masuk",
                        'message' => "Anda belum melakukan absen masuk hari ini. Silakan absen melalui portal.",
                        'time' => "Hari ini",
                        'timestamp' => time(),
                        'link' => '/absensi',
                    ];
                } else {
                    $notifikasi[] = [
                        'id' => 'absen-masuk-' . $absensiHariIni->id,
                        'type' => 'absen_sukses',
                        'category' => 'success',
                        'title' => "Absensi Masuk Berhasil",
                        'message' => "Absen masuk tercatat pukul {$absensiHariIni->jam_masuk} ({$absensiHariIni->status_masuk}).",
                        'time' => "Hari ini, {$absensiHariIni->jam_masuk}",
                        'timestamp' => time(),
                        'link' => '/absensi',
                    ];

                    if (!$absensiHariIni->jam_pulang) {
                        $notifikasi[] = [
                            'id' => 'pengingat-pulang-' . today()->toDateString(),
                            'type' => 'pengingat',
                            'category' => 'info',
                            'title' => "Pengingat Absensi Pulang",
                            'message' => "Jangan lupa melakukan absen pulang sebelum menyelesaikan jam kerja.",
                            'time' => "Hari ini",
                            'timestamp' => time() - 60,
                            'link' => '/absensi',
                        ];
                    }
                }
            }
        }

        // Urutkan notifikasi berdasarkan timestamp terbaru
        usort($notifikasi, fn($a, $b) => ($b['timestamp'] ?? 0) <=> ($a['timestamp'] ?? 0));

        return response()->json([
            'total' => count($notifikasi),
            'data' => $notifikasi,
        ]);
    }
}
