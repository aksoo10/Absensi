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
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'idx_users_role');
        });

        Schema::table('pegawais', function (Blueprint $table) {
            $table->index('status', 'idx_pegawais_status');
            $table->index('nama', 'idx_pegawais_nama');
        });

        Schema::table('jadwal_kerjas', function (Blueprint $table) {
            $table->index('is_default', 'idx_jadwal_kerjas_is_default');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role');
        });

        Schema::table('pegawais', function (Blueprint $table) {
            $table->dropIndex('idx_pegawais_status');
            $table->dropIndex('idx_pegawais_nama');
        });

        Schema::table('jadwal_kerjas', function (Blueprint $table) {
            $table->dropIndex('idx_jadwal_kerjas_is_default');
        });
    }
};
