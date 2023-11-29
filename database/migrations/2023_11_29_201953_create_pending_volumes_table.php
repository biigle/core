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
        Schema::create('pending_volumes', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->foreignId('user_id')
                ->constrained()
                ->onDelete('cascade');

            $table->foreignId('media_type_id')
                ->constrained()
                ->onDelete('restrict');

            $table->foreignId('project_id')
                ->constrained()
                ->onDelete('cascade');

            // Path of the file in the pending_metadata_storage_disk.
            $table->string('metadata_file_path', 256)->nullable();

            // A user is only allowed to create one pending volume at a time for a
            // project.
            $table->unique(['user_id', 'project_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pending_volumes');
    }
};
