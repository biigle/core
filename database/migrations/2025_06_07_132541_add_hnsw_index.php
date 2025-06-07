<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Make sure pgvector extension exists
        DB::statement('CREATE EXTENSION IF NOT EXISTS vector');

        DB::statement('CREATE INDEX ON image_annotation_label_feature_vectors USING hnsw (vector vector_cosine_ops) WITH (m = 16, ef_construction = 256)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("DROP INDEX IF EXISTS image_annotation_label_feature_vectors_vector_idx");
    }
};
