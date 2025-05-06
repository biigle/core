<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {

        /*
         * Explanation: These indices are crutial for the foreign key constraints.
         * For example, if a label or a label tree should be deleted, the DB must check
         * if there are any feature vectors using the label/tree. Without index this
         * is terribly slow on large tables (and these tables will be large here).
         * The same is true for cascaded deletes. If a whole image/video or volume should
         * be deleted, the feature vectors are deleted via their foreign key constraints.
         * The index is essential for this to be fast. Otherwise a query could take hours
         * or days!
         */
        Schema::table('image_annotation_label_feature_vectors', function (Blueprint $table) {
            $table->index('id');
            $table->index('label_id');
            $table->index('label_tree_id');

            // This is not needed. If a volume is deleted, deletion of the vectors is
            // cascaded through the annotations.
            $table->dropForeign(['volume_id']);
        });

        Schema::table('video_annotation_label_feature_vectors', function (Blueprint $table) {
            $table->index('id');
            $table->index('label_id');
            $table->index('label_tree_id');

            // This is not needed. If a volume is deleted, deletion of the vectors is
            // cascaded through the annotations.
            $table->dropForeign(['volume_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('image_annotation_label_feature_vectors', function (Blueprint $table) {
            $table->foreignId('volume_id')
                ->constrained()
                ->onDelete('cascade');
        });

        Schema::table('video_annotation_label_feature_vectors', function (Blueprint $table) {
            $table->foreignId('volume_id')
                ->constrained()
                ->onDelete('cascade');
        });
    }
};
