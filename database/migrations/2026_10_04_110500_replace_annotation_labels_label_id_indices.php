<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    /**
     * Replace the label_id indices of the annotation labels with indices on
     * (label_id, annotation_id).
     *
     * The annotations with a certain label are often requested (e.g. in Largo and the
     * label annotation catalog). With the new indices, they can be found in the order
     * of the annotation IDs without fetching the annotation label rows. The new
     * indices start with label_id, so they replace the old label_id indices (e.g. for
     * the foreign key checks when a label is deleted).
     */
    public function up(): void
    {
        // Use CONCURRENTLY so the tables are not blocked while the indices are built.
        DB::statement('CREATE INDEX CONCURRENTLY image_annotation_labels_label_id_annotation_id_index ON image_annotation_labels (label_id, annotation_id)');
        DB::statement('CREATE INDEX CONCURRENTLY video_annotation_labels_label_id_annotation_id_index ON video_annotation_labels (label_id, annotation_id)');

        DB::statement('DROP INDEX CONCURRENTLY annotation_labels_label_id_index');
        DB::statement('DROP INDEX CONCURRENTLY video_annotation_labels_label_id_index');
    }

    public function down(): void
    {
        // The image annotation label index still has the name from before the table
        // was renamed.
        DB::statement('CREATE INDEX CONCURRENTLY annotation_labels_label_id_index ON image_annotation_labels (label_id)');
        DB::statement('CREATE INDEX CONCURRENTLY video_annotation_labels_label_id_index ON video_annotation_labels (label_id)');

        DB::statement('DROP INDEX CONCURRENTLY image_annotation_labels_label_id_annotation_id_index');
        DB::statement('DROP INDEX CONCURRENTLY video_annotation_labels_label_id_annotation_id_index');
    }
};
