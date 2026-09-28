<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        $query = Pegawai::with('user');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('nama', 'like', "%{$request->search}%")
                  ->orWhere('nip', 'like', "%{$request->search}%")
                  ->orWhere('nik', 'like', "%{$request->search}%")
                  ->orWhere('jabatan', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate(10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'nip' => 'nullable|string|unique:pegawais,nip',
            'nik' => 'nullable|string|max:20|unique:pegawais,nik',
            'jabatan' => 'required|string',
            'departemen' => 'nullable|string',
            'no_telepon' => 'nullable|string',
            'alamat' => 'nullable|string',
            'jenis_kelamin' => 'nullable|in:L,P',
            'tanggal_bergabung' => 'nullable|date',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $user = User::create([
            'name' => $validated['nama'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'pegawai',
        ]);

        $pegawai = Pegawai::create([
            'user_id' => $user->id,
            'nip' => $validated['nip'] ?? null,
            'nik' => $validated['nik'] ?? null,
            'nama' => $validated['nama'],
            'jabatan' => $validated['jabatan'],
            'departemen' => $validated['departemen'] ?? null,
            'no_telepon' => $validated['no_telepon'] ?? null,
            'alamat' => $validated['alamat'] ?? null,
            'jenis_kelamin' => $validated['jenis_kelamin'] ?? null,
            'tanggal_bergabung' => $validated['tanggal_bergabung'] ?? null,
            'status' => $validated['status'] ?? 'aktif',
        ]);

        return response()->json([
            'message' => 'Pegawai berhasil ditambahkan',
            'pegawai' => $pegawai->load('user'),
        ], 201);
    }

    public function show(Pegawai $pegawai)
    {
        return response()->json($pegawai->load(['user', 'absensis' => fn($q) => $q->latest()->take(5), 'pengajuans' => fn($q) => $q->latest()->take(5)]));
    }

    public function update(Request $request, Pegawai $pegawai)
    {
        $validated = $request->validate([
            'nama' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $pegawai->user_id,
            'password' => 'nullable|string|min:6',
            'nip' => 'sometimes|nullable|string|unique:pegawais,nip,' . $pegawai->id,
            'nik' => 'sometimes|nullable|string|max:20|unique:pegawais,nik,' . $pegawai->id,
            'jabatan' => 'sometimes|string',
            'departemen' => 'nullable|string',
            'no_telepon' => 'nullable|string',
            'alamat' => 'nullable|string',
            'jenis_kelamin' => 'nullable|in:L,P',
            'tanggal_bergabung' => 'nullable|date',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $pegawai->update($validated);

        $userData = [];
        if (isset($validated['nama'])) {
            $userData['name'] = $validated['nama'];
        }
        if (isset($validated['email'])) {
            $userData['email'] = $validated['email'];
        }
        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }
        if (!empty($userData)) {
            $pegawai->user->update($userData);
        }

        return response()->json([
            'message' => 'Data pegawai berhasil diupdate',
            'pegawai' => $pegawai->fresh()->load('user'),
        ]);
    }

    public function destroy(Pegawai $pegawai)
    {
        $pegawai->user->delete(); // cascade delete

        return response()->json(['message' => 'Pegawai berhasil dihapus']);
    }
}
