<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'nullable|in:pegawai',
            'jabatan' => 'nullable|string|max:255',
            'nip' => 'nullable|string|max:50',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            $user->update([
                'name' => $validated['name'],
                'password' => Hash::make($validated['password']),
                'role' => 'pegawai',
            ]);
        } else {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'pegawai',
            ]);
        }

        $nip = !empty($validated['nip']) ? $validated['nip'] : null;
        if ($nip) {
            Pegawai::where('nip', $nip)->where('user_id', '!=', $user->id)->update(['nip' => null]);
        }
        $jabatan = !empty($validated['jabatan']) ? $validated['jabatan'] : 'Staf Perangkat Desa';

        if ($user->pegawai) {
            $user->pegawai->update([
                'nama' => $user->name,
                'nip' => $nip,
                'jabatan' => $jabatan,
                'status' => 'aktif',
            ]);
        } else {
            Pegawai::create([
                'user_id' => $user->id,
                'nama' => $user->name,
                'nip' => $nip,
                'jabatan' => $jabatan,
                'departemen' => 'Pemerintahan Desa',
                'status' => 'aktif',
                'tanggal_bergabung' => now()->toDateString(),
            ]);
        }

        $user->load('pegawai');
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Pendaftaran akun berhasil',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'pegawai' => $user->pegawai,
            ],
            'token' => $token,
        ], 201);
    }
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $user = $request->user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'pegawai' => $user->pegawai,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        try {
            $request->user()?->currentAccessToken()?->delete();
        } catch (\Throwable $e) {
            // Silently ignore if token is already revoked or missing
        }

        return response()->json(['message' => 'Logout berhasil']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('pegawai');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'pegawai' => $user->pegawai,
        ]);
    }
}
