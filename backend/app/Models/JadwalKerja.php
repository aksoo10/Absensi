<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JadwalKerja extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'hari_kerja',
        'jam_masuk',
        'jam_pulang',
        'toleransi_menit',
        'is_default',
    ];

    protected $casts = [
        'hari_kerja' => 'array',
        'is_default' => 'boolean',
        'jam_masuk' => 'string',
        'jam_pulang' => 'string',
    ];
}
