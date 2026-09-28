<?php

use App\Http\Controllers\Api\AbsensiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\JadwalKerjaController;
use App\Http\Controllers\Api\LaporanController;
use App\Http\Controllers\Api\NotifikasiController;
use App\Http\Controllers\Api\PegawaiController;
use App\Http\Controllers\Api\PengajuanController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ─── Public Routes ───────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/public/download-dokumen', [PengajuanController::class, 'downloadPublic']);

// ─── Protected Routes (Sanctum) ──────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth & Notifikasi
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::get('/notifikasi', [NotifikasiController::class, 'index']);

    // Absensi (Pegawai & Admin)
    Route::prefix('absensi')->group(function () {
        Route::get('/', [AbsensiController::class, 'index']);
        Route::get('/hari-ini', [AbsensiController::class, 'hariIni']);
        Route::post('/masuk', [AbsensiController::class, 'absenMasuk']);
        Route::post('/pulang', [AbsensiController::class, 'absenPulang']);
    });

    // Pengajuan (Pegawai & Admin)
    Route::prefix('pengajuan')->group(function () {
        Route::get('/', [PengajuanController::class, 'index']);
        Route::post('/', [PengajuanController::class, 'store']);
        Route::get('/download/dokumen', [PengajuanController::class, 'downloadDokumen']);
        Route::get('/{pengajuan}/download', [PengajuanController::class, 'downloadDokumen']);
        Route::get('/{pengajuan}', [PengajuanController::class, 'show']);
        Route::patch('/{pengajuan}/proses', [PengajuanController::class, 'proses']);
    });

    // Laporan
    Route::prefix('laporan')->group(function () {
        Route::get('/dashboard', [LaporanController::class, 'dashboard']);
        Route::get('/dashboard-pegawai', [LaporanController::class, 'dashboardPegawai']);
        Route::get('/absensi', [LaporanController::class, 'absensi']);
    });

    // ─── Admin Only Routes ────────────────────────────────────────
    Route::middleware('can:admin')->group(function () {
        // Pegawai
        Route::apiResource('pegawai', PegawaiController::class);

        // Jadwal Kerja
        Route::apiResource('jadwal', JadwalKerjaController::class)
             ->except(['show']);

        // Manajemen Akun Pegawai & Admin
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::put('users/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);
    });
});
