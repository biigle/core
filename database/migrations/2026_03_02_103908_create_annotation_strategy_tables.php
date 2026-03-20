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
        Schema::create('annotation_strategies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project')
                ->constrained()
                ->onDelete('cascade');
            $table->unique('project');
            $table->text('description');
        });

        Schema::create('annotation_strategy_labels', function (Blueprint $table) {
            $table->foreignId('annotation_strategy')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('label')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('shape')
                ->nullable(true)
                ->constrained()
                ->onDelete('set null');

            $table->text('description');

            $table->primary(['annotation_strategy', 'label']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('annotation_strategy_labels');
        Schema::dropIfExists('annotation_strategies');
    }
};
