<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    public function up(): void
    {
        // The files of a volume are often listed ordered by filename (e.g. in the volume
        // overview and the video annotation tool). With this index, the list can be
        // read from the index alone without sorting or fetching the rows.
        // Use CONCURRENTLY so the table is not blocked while the index is built.
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS videos_volume_id_filename_index ON videos (volume_id, filename) INCLUDE (id, uuid)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS videos_volume_id_filename_index');
    }
};
