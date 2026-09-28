<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PengajuanController extends Controller
{
    public function index(Request $request)
    {
        $start = microtime(true);
        $user = $request->user();

        if ($user->role === 'pegawai') {
            if (!$user->pegawai) {
                return response()->json([
                    'data' => [],
                    'total' => 0,
                    'current_page' => 1,
                    'last_page' => 1
                ]);
            }
            $query = Pengajuan::with('pemroses')
                ->where('pegawai_id', $user->pegawai->id);
        } else {
            $query = Pengajuan::with('pegawai.user', 'pemroses');
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->jenis) {
            $query->where('jenis', $request->jenis);
        }

        $res = response()->json($query->latest()->paginate(15));
        $res->headers->set('X-Exec-Time', round((microtime(true) - $start) * 1000, 2) . 'ms');
        return $res;
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
            'alasan' => 'nullable|string|max:1000',
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
            'alasan' => $validated['alasan'] ?? '-',
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

    /**
     * Download dokumen lampiran pengajuan (authenticated)
     */
    public function downloadDokumen(Request $request, $id = null)
    {
        $path = null;
        $namaFile = 'Lampiran_Dokumen';

        if ($id) {
            $pengajuan = Pengajuan::with('pegawai.user')->find($id);
            if ($pengajuan && $pengajuan->dokumen) {
                $path = $pengajuan->dokumen;
                $namaPegawai = $pengajuan->pegawai?->nama ?? ($pengajuan->pegawai?->user?->name ?? 'Pegawai');
                $ext = pathinfo($path, PATHINFO_EXTENSION) ?: 'jpg';
                $namaFile = 'Lampiran_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $namaPegawai) . '.' . $ext;
            }
        }

        if (!$path && $request->path) {
            $path = $request->path;
            $namaFile = basename($path);
        }

        if (!$path || !Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'File lampiran tidak ditemukan di server'], 404);
        }

        return Storage::disk('public')->download($path, $namaFile);
    }

    /**
     * Download dokumen lampiran (fallback direct link)
     */
    public function downloadPublic(Request $request)
    {
        $path = $request->path;
        if (!$path || !Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'File lampiran tidak ditemukan di server'], 404);
        }

        $namaFile = $request->name ?: basename($path);
        return Storage::disk('public')->download($path, $namaFile);
    }

    /**
     * Preview dokumen lampiran (inline view dengan CORS & Cache header)
     */
    public function previewPublic(Request $request)
    {
        $path = $request->path;
        if (!$path || !Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'File lampiran tidak ditemukan di server'], 404);
        }

        $filePath = Storage::disk('public')->path($path);
        $mime = mime_content_type($filePath) ?: 'application/octet-stream';

        return response()->file($filePath, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
            'Access-Control-Allow-Origin' => '*',
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        ]);
    }
}
