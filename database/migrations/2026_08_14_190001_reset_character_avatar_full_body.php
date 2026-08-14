<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Karakter player gak pakai upload avatar/full body sendiri lagi - dipakein
     * art default dari subclass-nya. Reset data yang udah terlanjur diupload.
     */
    public function up(): void
    {
        DB::table('characters')->update([
            'avatar_path' => null,
            'full_body_path' => null,
        ]);
    }

    public function down(): void
    {
        // Data yang direset gak bisa dikembalikan, migration ini one-way.
    }
};
