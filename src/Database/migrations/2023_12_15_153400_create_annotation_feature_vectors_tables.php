<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
         * Context/explanation: These tables are optimized for fast queries both by Largo
         * and (in the future) for LabelBOT. Largo needs to filter by label_id and
         * volume_id, followed by a vector sort. These tables include both IDs (although
         * they could be joined to the labels and images/videos tables) because it will
         * make the query faster. This does not benefit from a vector index because the
         * sorting always needs to consider all rows with a certain label_id and
         * volume_id. We use a compound index for the volume_id and label_id instead.
         *
         * LabelBOT will likely filter by label_tree_id and then search for most similar
         * annotations. The current plan is to dynamically create partitions for
         * these tables (one each for a label tree), so the label_tree_id is redundantly
         * included here, too. Partitioned tables combined with a vector index may be the
         * fastest way to query for "most similar" annotations that also involves
         * filtering by label_tree_id. There is some controversy, though (see below), and
         * we need to test the performance once we have real data in these tables.
         *
         * Recommends partitioning for filtered sorting:
         * https://github.com/pgvector/pgvector#filtering
         *
         * Mentions impracticality of partitioning to lots (100s) of categories but also
         * mentions possible improvements to pgvector to natively support fltering:
         * https://github.com/pgvector/pgvector/issues/259#issuecomment-1783872804
         */

        Schema::create('image_annotation_label_feature_vectors', function (Blueprint $table) {
                $table->unsignedBigInteger('id');
                $table->foreign('id')
                    ->references('id')
                    ->on('image_annotation_labels')
                    ->onDelete('cascade');

                $table->foreignId('annotation_id')
                    ->constrained(table: 'image_annotations')
                    ->onDelete('cascade');

                $table->foreignId('label_id')
                    ->constrained()
                    ->onDelete('restrict');

                // This is added to be used by LabelBOT in the future.
                // We still have to think of an efficient indexing strategy so indexes
                // are added later.
                $table->foreignId('label_tree_id')
                    ->constrained()
                    ->onDelete('restrict');

                $table->foreignId('volume_id')
                    ->constrained()
                    ->onDelete('cascade');

                $table->vector('vector', 384);

                // For Largo queries.
                $table->index(['label_id', 'volume_id']);
            });

        Schema::create('video_annotation_label_feature_vectors', function (Blueprint $table) {
                $table->unsignedBigInteger('id');
                $table->foreign('id')
                    ->references('id')
                    ->on('video_annotation_labels')
                    ->onDelete('cascade');

                $table->foreignId('annotation_id')
                    ->constrained(table: 'video_annotations')
                    ->onDelete('cascade');

                $table->foreignId('label_id')
                    ->constrained()
                    ->onDelete('restrict');

                // This is added to be used by LabelBOT in the future.
                // We still have to think of an efficient indexing strategy so indexes
                // are added later.
                $table->foreignId('label_tree_id')
                    ->constrained()
                    ->onDelete('restrict');

                $table->foreignId('volume_id')
                    ->constrained()
                    ->onDelete('cascade');

                $table->vector('vector', 384);

                // For Largo queries.
                $table->index(['label_id', 'volume_id']);
            });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::connection('pgvector')
            ->dropIfExists('image_annotation_label_feature_vectors');
        Schema::connection('pgvector')
            ->dropIfExists('video_annotation_label_feature_vectors');
    }
};
