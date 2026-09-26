<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JadwalKerja;
use Illuminate\Http\Request;

class JadwalKerjaController extends Controller
{
    public function index()
    {
        return response()->json(JadwalKerja::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string',
            'hari_kerja' => 'required|array|min:1',
            'hari_kerja.*' => 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_masuk' => 'required|date_format:H:i',
            'jam_pulang' => 'required|date_format:H:i',
            'toleransi_menit' => 'integer|min:0|max:120',
            'is_default' => 'boolean',
        ]);

        if (!empty($validated['is_default'])) {
            JadwalKerja::where('is_default', true)->update(['is_default' => false]);
        }

        $jadwal = JadwalKerja::create($validated);

        return response()->json(['message' => 'Jadwal berhasil ditambahkan', 'jadwal' => $jadwal], 201);
    }

    public function update(Request $request, JadwalKerja $jadwalKerja)
    {
        $validated = $request->validate([
            'nama' => 'sometimes|string',
            'hari_kerja' => 'sometimes|array',
            'hari_kerja.*' => 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_masuk' => 'sometimes|date_format:H:i',
            'jam_pulang' => 'sometimes|date_format:H:i',
            'toleransi_menit' => 'integer|min:0|max:120',
            'is_default' => 'boolean',
        ]);

        if (!empty($validated['is_default'])) {
            JadwalKerja::where('is_default', true)->update(['is_default' => false]);
        }

        $jadwalKerja->update($validated);

        return response()->json(['message' => 'Jadwal berhasil diupdate', 'jadwal' => $jadwalKerja]);
    }

    public function destroy(JadwalKerja $jadwalKerja)
    {
        $jadwalKerja->delete();
        return response()->json(['message' => 'Jadwal berhasil dihapus']);
    }
}
