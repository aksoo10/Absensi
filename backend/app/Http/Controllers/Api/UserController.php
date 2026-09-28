<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('pegawai');

        if ($request->role) {
            $query->where('role', $request->role);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhereHas('pegawai', function ($pq) use ($request) {
                      $pq->where('jabatan', 'like', "%{$request->search}%")
                        ->orWhere('nip', 'like', "%{$request->search}%")
                        ->orWhere('nik', 'like', "%{$request->search}%");
                  });
            });
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:6',
            'role' => 'nullable|in:admin,pegawai',
            'jabatan' => 'nullable|string|max:255',
            'nip' => 'nullable|string|max:50',
            'nik' => 'nullable|string|max:20',
        ]);

        $role = $validated['role'] ?? 'pegawai';
        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            $user->update([
                'name' => $validated['name'],
                'password' => Hash::make($validated['password']),
                'role' => $role,
            ]);
        } else {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $role,
            ]);
        }

        $nip = !empty($validated['nip']) ? $validated['nip'] : null;
        if ($nip) {
            Pegawai::where('nip', $nip)->where('user_id', '!=', $user->id)->update(['nip' => null]);
        }

        $nik = !empty($validated['nik']) ? $validated['nik'] : null;
        if ($nik) {
            Pegawai::where('nik', $nik)->where('user_id', '!=', $user->id)->update(['nik' => null]);
        }

        if ($role === 'pegawai') {
            if ($user->pegawai) {
                $user->pegawai->update([
                    'nama' => $user->name,
                    'nip' => $nip,
                    'nik' => $nik,
                    'jabatan' => !empty($validated['jabatan']) ? $validated['jabatan'] : 'Staf Perangkat Desa',
                    'status' => 'aktif',
                ]);
            } else {
                Pegawai::create([
                    'user_id' => $user->id,
                    'nama' => $user->name,
                    'nip' => $nip,
                    'nik' => $nik,
                    'jabatan' => !empty($validated['jabatan']) ? $validated['jabatan'] : 'Staf Perangkat Desa',
                    'departemen' => 'Pemerintahan Desa',
                    'status' => 'aktif',
                    'tanggal_bergabung' => now()->toDateString(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Akun berhasil disimpan',
            'user' => $user->fresh()->load('pegawai'),
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'role' => 'sometimes|in:admin,pegawai',
            'password' => 'nullable|string|min:6',
            'jabatan' => 'nullable|string|max:255',
            'nip' => 'nullable|string|max:50',
            'nik' => 'nullable|string|max:20',
        ]);

        $userData = [];
        if (isset($validated['name'])) $userData['name'] = $validated['name'];
        if (isset($validated['email'])) {
            if ($validated['email'] !== $user->email) {
                $emailExists = User::where('email', $validated['email'])->where('id', '!=', $user->id)->exists();
                if ($emailExists) {
                    return response()->json([
                        'message' => 'Alamat email ini sudah digunakan oleh akun lain.',
                        'errors' => ['email' => ['Alamat email ini sudah digunakan oleh akun lain.']]
                    ], 422);
                }
            }
            $userData['email'] = $validated['email'];
        }
        if (isset($validated['role'])) $userData['role'] = $validated['role'];
        if (!empty($validated['password'])) $userData['password'] = Hash::make($validated['password']);

        if (!empty($userData)) {
            $user->update($userData);
        }

        if ($user->pegawai) {
            $pegawaiData = [];
            if (isset($validated['name'])) $pegawaiData['nama'] = $validated['name'];
            if (isset($validated['jabatan'])) $pegawaiData['jabatan'] = $validated['jabatan'];
            if (array_key_exists('nip', $validated)) $pegawaiData['nip'] = !empty($validated['nip']) ? $validated['nip'] : null;
            if (array_key_exists('nik', $validated)) $pegawaiData['nik'] = !empty($validated['nik']) ? $validated['nik'] : null;
            if (!empty($pegawaiData)) {
                $user->pegawai->update($pegawaiData);
            }
        } elseif (($validated['role'] ?? $user->role) === 'pegawai') {
            Pegawai::create([
                'user_id' => $user->id,
                'nama' => $user->name,
                'nip' => !empty($validated['nip']) ? $validated['nip'] : null,
                'nik' => !empty($validated['nik']) ? $validated['nik'] : null,
                'jabatan' => $validated['jabatan'] ?? 'Staf Perangkat Desa',
                'status' => 'aktif',
                'tanggal_bergabung' => now()->toDateString(),
            ]);
        }

        return response()->json([
            'message' => 'Data akun berhasil diperbarui',
            'user' => $user->fresh()->load('pegawai'),
        ]);
    }

    public function resetPassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Kata sandi akun ' . $user->email . ' berhasil direset',
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun Anda sendiri.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Akun berhasil dihapus']);
    }
}
