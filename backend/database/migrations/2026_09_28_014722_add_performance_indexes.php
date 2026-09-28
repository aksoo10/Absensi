<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('absensis', function (Blueprint $table) {
            $table->index('tanggal', 'idx_absensis_tanggal');
            $table->index('status_masuk', 'idx_absensis_status_masuk');
        });

        Schema::table('pengajuans', function (Blueprint $table) {
            $table->index('status', 'idx_pengajuans_status');
            $table->index('tanggal_mulai', 'idx_pengajuans_tanggal_mulai');
            $table->index(['pegawai_id', 'status'], 'idx_pengajuans_pegawai_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('absensis', function (Blueprint $table) {
            $table->dropIndex('idx_absensis_tanggal');
            $table->dropIndex('idx_absensis_status_masuk');
        });

        Schema::table('pengajuans', function (Blueprint $table) {
            $table->dropIndex('idx_pengajuans_status');
            $table->dropIndex('idx_pengajuans_tanggal_mulai');
            $table->dropIndex('idx_pengajuans_pegawai_status');
        });
    }
};
