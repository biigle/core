<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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
            $table->text('description')
        });

        Schema::create('annotation_strategy_labels', function (Blueprint $table) {
            $table->foreignId('annotation_strategy_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('label_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('shape_id')
                ->nullable(true)
                ->constrained()
                ->onDelete('set null');

            $table->text('description');

            $table->string('reference_image')
                ->nullable(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('annotation_strategy_label');
        Schema::dropIfExists('annotation_strategy');
    }
};
