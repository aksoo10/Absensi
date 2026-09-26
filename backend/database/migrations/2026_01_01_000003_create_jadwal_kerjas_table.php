<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jadwal_kerjas', function (Blueprint $table) {
            $table->id();
            $table->string('nama'); // e.g. "Jadwal Reguler"
            $table->json('hari_kerja'); // ["Senin","Selasa",...]
            $table->time('jam_masuk');
            $table->time('jam_pulang');
            $table->integer('toleransi_menit')->default(15); // toleransi keterlambatan
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal_kerjas');
    }
};
