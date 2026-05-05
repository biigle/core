<?php

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
            $table->foreignId('project_id')
                ->constrained()
                ->onDelete('cascade');

            $table->unique('project_id');

            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('annotation_guideline_label', function (Blueprint $table) {
            $table->foreignId('annotation_guideline_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('label_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('shape_id')
                ->nullable()
                ->constrained()
                ->onDelete('set null');

            $table->text('description')->nullable();
            $table->string('reference_image_path')->nullable();

            $table->index('annotation_guideline_id');
            $table->unique(['annotation_guideline_id', 'label_id']);
        });
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
