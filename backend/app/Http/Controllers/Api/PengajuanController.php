<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use Illuminate\Http\Request;

class PengajuanController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Pengajuan::with('pegawai.user', 'pemroses');

        if ($user->role === 'pegawai') {
            $query->where('pegawai_id', $user->pegawai->id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->jenis) {
            $query->where('jenis', $request->jenis);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $pegawai = $user->pegawai;

        if (!$pegawai) {
            return response()->json(['message' => 'Data pegawai tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'jenis' => 'required|in:izin,sakit,dinas_luar',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'alasan' => 'required|string|max:1000',
            'dokumen' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $dokumenPath = null;
        if ($request->hasFile('dokumen')) {
            $dokumenPath = $request->file('dokumen')->store('pengajuan-dokumen', 'public');
        }

        $pengajuan = Pengajuan::create([
            'pegawai_id' => $pegawai->id,
            'jenis' => $validated['jenis'],
            'tanggal_mulai' => $validated['tanggal_mulai'],
            'tanggal_selesai' => $validated['tanggal_selesai'],
            'alasan' => $validated['alasan'],
            'dokumen' => $dokumenPath,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Pengajuan berhasil dikirim dan menunggu persetujuan',
            'pengajuan' => $pengajuan->load('pegawai.user'),
        ], 201);
    }

    public function show(Pengajuan $pengajuan)
    {
        return response()->json($pengajuan->load('pegawai.user', 'pemroses'));
    }

    /**
     * Admin: Setujui atau tolak pengajuan
     */
    public function proses(Request $request, Pengajuan $pengajuan)
    {
        $request->validate([
            'status' => 'required|in:disetujui,ditolak',
            'catatan_admin' => 'nullable|string',
        ]);

        if ($pengajuan->status !== 'pending') {
            return response()->json(['message' => 'Pengajuan sudah diproses sebelumnya'], 422);
        }

        $pengajuan->update([
            'status' => $request->status,
            'catatan_admin' => $request->catatan_admin,
            'diproses_oleh' => $request->user()->id,
            'diproses_pada' => now(),
        ]);

        return response()->json([
            'message' => 'Pengajuan berhasil ' . ($request->status === 'disetujui' ? 'disetujui' : 'ditolak'),
            'pengajuan' => $pengajuan->fresh()->load('pegawai.user', 'pemroses'),
        ]);
    }
}
