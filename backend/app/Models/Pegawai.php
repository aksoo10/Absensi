<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pegawai extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nip',
        'nik',
        'nama',
        'jabatan',
        'departemen',
        'no_telepon',
        'alamat',
        'jenis_kelamin',
        'tanggal_bergabung',
        'status',
        'foto',
    ];

    protected $casts = [
        'tanggal_bergabung' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function absensis()
    {
        return $this->hasMany(Absensi::class);
    }

    public function pengajuans()
    {
        return $this->hasMany(Pengajuan::class);
    }

    public function absensiHariIni()
    {
        return $this->hasOne(Absensi::class)->where('tanggal', today());
    }
}
