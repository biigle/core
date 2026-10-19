<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    public function up(): void
    {
        // The dashboard looks for the annotation labels that a user created within the
        // last few days. With an index on user_id alone the query planner falls back to
        // a sequential scan of the whole table for users with many annotation labels.
        // Use CONCURRENTLY so the tables are not blocked while the index is built.
        // Don't use IF NOT EXISTS: a failed concurrent build leaves an invalid index
        // behind, which would be silently skipped before the old indices are dropped.
        DB::statement('CREATE INDEX CONCURRENTLY image_annotation_labels_user_id_created_at_index ON image_annotation_labels (user_id, created_at)');
        DB::statement('CREATE INDEX CONCURRENTLY video_annotation_labels_user_id_created_at_index ON video_annotation_labels (user_id, created_at)');
        // The dashboard also looks for the volumes that a user created recently.
        DB::statement('CREATE INDEX CONCURRENTLY volumes_creator_id_created_at_index ON volumes (creator_id, created_at)');

        // The indices above start with user_id, so these are now redundant. They only
        // take up space and slow down inserts. Queries for user_id alone can use the
        // composite indices instead.
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS annotation_labels_user_id_index');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS video_annotation_labels_user_id_index');
    }

    public function down(): void
    {
        DB::statement('CREATE INDEX CONCURRENTLY annotation_labels_user_id_index ON image_annotation_labels (user_id)');
        DB::statement('CREATE INDEX CONCURRENTLY video_annotation_labels_user_id_index ON video_annotation_labels (user_id)');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS image_annotation_labels_user_id_created_at_index');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS video_annotation_labels_user_id_created_at_index');
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS volumes_creator_id_created_at_index');
    }
};
