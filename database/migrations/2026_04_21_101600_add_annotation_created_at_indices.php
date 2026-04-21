<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public $withinTransaction = false;

    public function up(): void
    {
        // The index speeds up range queries e.g. in the admin dashboard.
        // Use CONCURRENTLY so the tables are not blocked while the index is built.
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS image_annotations_created_at_index ON image_annotations (created_at)');
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS video_annotations_created_at_index ON video_annotations (created_at)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS image_annotations_created_at_index');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS video_annotations_created_at_index');
    }
};
