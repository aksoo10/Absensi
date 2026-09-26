<?php

namespace Database\Seeders;

use App\Models\JadwalKerja;
use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Admin ────────────────────────────────────
        $admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@absensi.desa',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        // ─── Jadwal Kerja Default ─────────────────────
        JadwalKerja::create([
            'nama' => 'Jadwal Reguler',
            'hari_kerja' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
            'jam_masuk' => '08:00',
            'jam_pulang' => '16:00',
            'toleransi_menit' => 15,
            'is_default' => true,
        ]);

        // ─── Pegawai Contoh ───────────────────────────
        $pegawaiData = [
            ['nama' => 'Budi Santoso', 'jabatan' => 'Sekretaris Desa', 'nip' => '19850101001'],
            ['nama' => 'Siti Rahayu', 'jabatan' => 'Bendahara Desa', 'nip' => '19900215002'],
            ['nama' => 'Ahmad Fauzi', 'jabatan' => 'Kepala Seksi Pemerintahan', 'nip' => '19881030003'],
            ['nama' => 'Dewi Lestari', 'jabatan' => 'Kepala Seksi Kesejahteraan', 'nip' => '19920520004'],
            ['nama' => 'Rudi Hartono', 'jabatan' => 'Staff Administrasi', 'nip' => '19950712005'],
        ];

        foreach ($pegawaiData as $i => $data) {
            $user = User::create([
                'name' => $data['nama'],
                'email' => strtolower(str_replace(' ', '.', $data['nama'])) . '@absensi.desa',
                'password' => Hash::make('pegawai123'),
                'role' => 'pegawai',
            ]);

            Pegawai::create([
                'user_id' => $user->id,
                'nip' => $data['nip'],
                'nama' => $data['nama'],
                'jabatan' => $data['jabatan'],
                'departemen' => 'Pemerintahan Desa',
                'status' => 'aktif',
                'tanggal_bergabung' => now()->subYears(rand(1, 5))->toDateString(),
            ]);
        }
    }
}
