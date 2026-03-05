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
        Schema::create('lol', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project')
                ->constrained()
                ->onDelete('cascade');
            $table->text('description');
        });

        Schema::create('lol2', function (Blueprint $table) {
            $table->foreignId('annotation_strategy_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('label_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('shape_id')
                ->constrained()
                ->onDelete('cascade');

            $table->text('description');
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
