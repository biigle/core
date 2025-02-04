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
        // When a metadata file was deleted, the file path was set to null but not the
        // parser. This lead to inconsistent data.
        Biigle\Volume::wherenotNull('metadata_parser')
            ->whereNull('metadata_file_path')
            ->update(['metadata_parser' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
