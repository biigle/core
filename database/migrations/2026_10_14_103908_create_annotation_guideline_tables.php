<?php

use Biigle\Support\EnumMigrationHelper;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('annotation_guidelines', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->foreignId('project_id')
                ->constrained()
                ->onDelete('cascade');
            $table->unique('project_id');

            $table->boolean('enforced')->default(false);
            // The aligned rectangle tool can be restricted independently of the
            // regular rectangle tool, although both create rectangles.
            $table->boolean('allow_aligned_rectangle')->default(true);

            $table->text('description')->nullable();
            // Null if all shapes are allowed. An empty array if no shape is allowed, so
            // only the separately allowed tools (see allow_aligned_rectangle) can be
            // used. An empty array must always be checked together with these flags.
            $table->jsonb('only_shapes')->nullable();
        });

        Schema::create('annotation_guideline_label', function (Blueprint $table) {
            $table->uuid('uuid')->primary();
            $table->timestamps();

            $table->foreignId('annotation_guideline_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('label_id')
                ->constrained()
                ->onDelete('cascade');

            // Value of the Biigle\Enums\Shape enum.
            $table->integer('shape')->nullable();
            // True if and only if the shape is Rectangle and the aligned rectangle tool
            // must be used instead of the regular rectangle tool.
            $table->boolean('use_aligned_rectangle')->default(false);

            $table->string('description', 256)->nullable();

            $table->string('reference_image_path')->nullable();

            $table->index('annotation_guideline_id');
            $table->index('label_id');
            $table->unique(['annotation_guideline_id', 'label_id']);
        });

        EnumMigrationHelper::addRangeValidationCheck('annotation_guideline_label', 'shape', 1, 7);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('annotation_guideline_label');
        Schema::dropIfExists('annotation_guidelines');
    }
};
