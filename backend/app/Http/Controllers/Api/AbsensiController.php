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

        $query = Absensi::query();

        if ($user->role === 'pegawai') {
            $pegawai = $user->pegawai;
            if (!$pegawai) {
                return response()->json([
                    'current_page' => 1,
                    'data' => [],
                    'total' => 0,
                    'last_page' => 1,
                    'per_page' => 50,
                ]);
            }
            $query->where('pegawai_id', $pegawai->id);
        } else {
            $query->with('pegawai.user');
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

        $perPage = min((int) ($request->per_page ?? 50), 100);
        return response()->json($query->orderByDesc('tanggal')->paginate($perPage));
    }

    /**
     * Ambil jadwal default secara aman dan terhindar dari serialisasi bermasalah
     */
    private function getDefaultJadwal()
    {
        $cached = Cache::get('jadwal_default');
        if (is_array($cached) && !empty($cached['jam_masuk'])) {
            return $cached;
        }

        $jadwal = JadwalKerja::where('is_default', true)->first();
        if ($jadwal) {
            $data = $jadwal->toArray();
            Cache::put('jadwal_default', $data, 3600);
            return $data;
        }

        return [
            'nama' => 'Jadwal Reguler',
            'jam_masuk' => '08:00:00',
            'jam_pulang' => '16:00:00',
            'toleransi_menit' => 15,
            'hari_kerja' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
        ];
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

        $sekarang = Carbon::now('Asia/Jakarta');
        $today = $sekarang->toDateString();

        $existing = Absensi::where('pegawai_id', $pegawai->id)
                           ->where('tanggal', $today)
                           ->first();

        if ($existing && $existing->jam_masuk) {
            return response()->json(['message' => 'Anda sudah absen masuk hari ini'], 422);
        }

        // Tentukan status keterlambatan berdasarkan jadwal kerja
        $jadwal = $this->getDefaultJadwal();
        $statusMasuk = 'tepat_waktu';
        $menitTerlambat = 0;

        if ($jadwal && !empty($jadwal['jam_masuk'])) {
            $jamMasukJadwal = Carbon::parse($today . ' ' . $jadwal['jam_masuk'], 'Asia/Jakarta');
            $toleransiMenit = (int) ($jadwal['toleransi_menit'] ?? 0);
            $batasTerlambat = $jamMasukJadwal->copy()->addMinutes($toleransiMenit);

            // 1. Tidak bisa absen masuk sebelum jam masuk kerja (08:00 WIB)
            if ($sekarang->lt($jamMasukJadwal)) {
                $formatJamMasuk = substr($jadwal['jam_masuk'], 0, 5);
                return response()->json([
                    'message' => "Presensi masuk belum dibuka. Anda hanya dapat melakukan presensi masuk mulai pukul {$formatJamMasuk} WIB.",
                    'jam_masuk_jadwal' => $formatJamMasuk,
                ], 422);
            }

            // 2. Tidak boleh lewat dari batas toleransi (08:15 WIB)
            if ($sekarang->gt($batasTerlambat)) {
                $formatBatas = $batasTerlambat->format('H:i');
                return response()->json([
                    'message' => "Waktu presensi masuk telah berakhir. Batas maksimal toleransi kehadiran adalah pukul {$formatBatas} WIB. Anda tidak dapat melakukan absen masuk.",
                    'batas_toleransi' => $formatBatas,
                    'lewat_toleransi' => true,
                ], 422);
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

        $sekarang = Carbon::now('Asia/Jakarta');
        $today = $sekarang->toDateString();

        $absensi = Absensi::where('pegawai_id', $pegawai->id)
                         ->where('tanggal', $today)
                         ->first();

        if (!$absensi || !$absensi->jam_masuk) {
            return response()->json(['message' => 'Anda belum melakukan absen masuk hari ini'], 422);
        }

        if ($absensi->jam_pulang) {
            return response()->json(['message' => 'Anda sudah melakukan absen pulang hari ini'], 422);
        }

        $jadwal = $this->getDefaultJadwal();

        // Validasi mutlak: Presensi pulang hanya bisa dilakukan pada atau setelah jam pulang kerja
        if ($jadwal && !empty($jadwal['jam_pulang'])) {
            $jamPulangJadwal = Carbon::parse($today . ' ' . $jadwal['jam_pulang'], 'Asia/Jakarta');
            
            if ($sekarang->lt($jamPulangJadwal)) {
                $formatJamPulang = substr($jadwal['jam_pulang'], 0, 5);
                return response()->json([
                    'message' => "Presensi pulang belum dibuka. Anda hanya dapat melakukan presensi pulang mulai pukul {$formatJamPulang} WIB.",
                    'jam_pulang_jadwal' => $formatJamPulang,
                ], 422);
            }
        }

        $absensi->update([
            'jam_pulang' => $sekarang->format('H:i:s'),
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

        $sekarang = Carbon::now('Asia/Jakarta');
        $today = $sekarang->toDateString();

        $absensi = Absensi::where('pegawai_id', $pegawai->id)
                         ->where('tanggal', $today)
                         ->first();

        $jadwal = $this->getDefaultJadwal();

        return response()->json([
            'absensi' => $absensi,
            'jadwal' => $jadwal,
            'tanggal' => $today,
            'hari' => $sekarang->locale('id')->isoFormat('dddd'),
        ]);
    }
}
