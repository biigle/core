<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    public function up(): void
    {
        // These indices duplicate the primary key index on the id column. They only
        // take up space and slow down inserts.
        // Use CONCURRENTLY so the tables are not blocked while the index is dropped.
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS image_annotation_label_feature_vectors_id_index');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS video_annotation_label_feature_vectors_id_index');
    }

    public function down(): void
    {
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS image_annotation_label_feature_vectors_id_index ON image_annotation_label_feature_vectors (id)');
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS video_annotation_label_feature_vectors_id_index ON video_annotation_label_feature_vectors (id)');
    }
};
