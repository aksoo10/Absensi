<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Absensi;
use App\Models\JadwalKerja;
use App\Models\Pegawai;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AbsensiController extends Controller
{
    /**
     * Daftar absensi (Admin: semua, Pegawai: milik sendiri)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Absensi::with('pegawai.user');

        if ($user->role === 'pegawai') {
            $query->where('pegawai_id', $user->pegawai->id);
        }

        if ($request->tanggal) {
            $query->whereDate('tanggal', $request->tanggal);
        }

        if ($request->bulan && $request->tahun) {
            $query->whereMonth('tanggal', $request->bulan)
                  ->whereYear('tanggal', $request->tahun);
        }

        if ($request->pegawai_id && $user->role === 'admin') {
            $query->where('pegawai_id', $request->pegawai_id);
        }

        return response()->json($query->orderByDesc('tanggal')->paginate(20));
    }

    /**
     * Absen masuk
     */
    public function absenMasuk(Request $request)
    {
        $user = $request->user();
        $pegawai = $user->pegawai;

        if (!$pegawai) {
            return response()->json(['message' => 'Data pegawai tidak ditemukan'], 404);
        }

        $today = today();
        $existing = Absensi::where('pegawai_id', $pegawai->id)
                           ->where('tanggal', $today)
                           ->first();

        if ($existing && $existing->jam_masuk) {
            return response()->json(['message' => 'Anda sudah absen masuk hari ini'], 422);
        }

        // Tentukan status berdasarkan jadwal
        $jadwal = Cache::remember('jadwal_default', 3600, fn() => JadwalKerja::where('is_default', true)->first());
        $sekarang = Carbon::now();
        $statusMasuk = 'tepat_waktu';
        $menitTerlambat = 0;

        if ($jadwal) {
            $jamMasukJadwal = Carbon::parse($today->toDateString() . ' ' . $jadwal->jam_masuk);
            $batasTerlambat = $jamMasukJadwal->copy()->addMinutes($jadwal->toleransi_menit);

            if ($sekarang->gt($batasTerlambat)) {
                $statusMasuk = 'terlambat';
                $menitTerlambat = $sekarang->diffInMinutes($jamMasukJadwal);
            }
        }

        $absensi = Absensi::updateOrCreate(
            ['pegawai_id' => $pegawai->id, 'tanggal' => $today],
            [
                'jam_masuk' => $sekarang->format('H:i:s'),
                'status_masuk' => $statusMasuk,
                'menit_terlambat' => $menitTerlambat,
                'lokasi_masuk' => $request->lokasi,
                'keterangan' => $request->keterangan,
            ]
        );

        return response()->json([
            'message' => 'Absen masuk berhasil dicatat',
            'absensi' => $absensi,
            'status_masuk' => $statusMasuk,
            'menit_terlambat' => $menitTerlambat,
        ]);
    }

    /**
     * Absen pulang
     */
    public function absenPulang(Request $request)
    {
        $user = $request->user();
        $pegawai = $user->pegawai;

        if (!$pegawai) {
            return response()->json(['message' => 'Data pegawai tidak ditemukan'], 404);
        }

        $absensi = Absensi::where('pegawai_id', $pegawai->id)
                         ->where('tanggal', today())
                         ->first();

        if (!$absensi || !$absensi->jam_masuk) {
            return response()->json(['message' => 'Anda belum absen masuk hari ini'], 422);
        }

        if ($absensi->jam_pulang) {
            return response()->json(['message' => 'Anda sudah absen pulang hari ini'], 422);
        }

        $absensi->update([
            'jam_pulang' => now()->format('H:i:s'),
            'lokasi_pulang' => $request->lokasi,
        ]);

        return response()->json([
            'message' => 'Absen pulang berhasil dicatat',
            'absensi' => $absensi->fresh(),
        ]);
    }

    /**
     * Status absensi hari ini (untuk pegawai)
     */
    public function hariIni(Request $request)
    {
        $user = $request->user();
        $pegawai = $user->pegawai;

        if (!$pegawai) {
            return response()->json(['absensi' => null, 'jadwal' => null]);
        }

        $absensi = Absensi::where('pegawai_id', $pegawai->id)
                         ->where('tanggal', today())
                         ->first();

        $jadwal = Cache::remember('jadwal_default', 3600, fn() => JadwalKerja::where('is_default', true)->first());

        return response()->json([
            'absensi' => $absensi,
            'jadwal' => $jadwal,
            'tanggal' => today()->toDateString(),
            'hari' => now()->locale('id')->isoFormat('dddd'),
        ]);
    }
}
