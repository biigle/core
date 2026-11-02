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
        Schema::create('export_files', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('cascade');

            $table->string('type');
            $table->string('description')->nullable();
            $table->jsonb('entity_ids');
            $table->timestamp('ready_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('export_files');
    }
};
