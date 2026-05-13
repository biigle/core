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
            $table->foreignId('project')
                ->constrained()
                ->onDelete('cascade');
            $table->unique('project');
            $table->text('description')
                ->nullable(true);
        });

        Schema::create('annotation_guideline_labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('annotation_guideline')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('label')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('shape')
                ->nullable(true)
                ->constrained()
                ->onDelete('set null');

            $table->text('description')
                ->nullable(true);

            $table->boolean('reference_image');

            $table->unique(['annotation_guideline', 'label']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('annotation_guideline_labels');
        Schema::dropIfExists('annotation_guidelines');
    }
};
