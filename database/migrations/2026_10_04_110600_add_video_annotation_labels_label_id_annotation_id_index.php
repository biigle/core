<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    public function up(): void
    {
        // The annotations with a certain label are often requested (e.g. in Largo and
        // the label annotation catalog). With this index, they can be found in the
        // order of the annotation IDs without fetching the annotation label rows.
        // Use CONCURRENTLY so the table is not blocked while the index is built.
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS video_annotation_labels_label_id_annotation_id_index ON video_annotation_labels (label_id, annotation_id)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS video_annotation_labels_label_id_annotation_id_index');
    }
};
