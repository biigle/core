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
        Schema::create('project_strategies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project')
                ->constrained()
                ->onDelete('cascade');
            $table->text('description');
        });

        Schema::create('project_strategy_labels', function (Blueprint $table) {
            $table->id();

            $table->foreignId('project_strategy')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('label_id')
                ->constrained()
                ->onDelete('cascade');

            //TODO: consider here using Magic SAM and so
            $table->unsignedBigInteger('preferred_shape');
            $table->foreign('preferred_shape')
                ->references('id')
                ->on('shapes')
                ->nullable(true)
                ->onDelete('set null');

            $table->text('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_strategy_label');
        Schema::dropIfExists('project_strategy');
    }
};
