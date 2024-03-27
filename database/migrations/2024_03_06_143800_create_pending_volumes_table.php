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

            // This is used if annotations or file labels should be imported. The volume
            // will be created first but the pending volume is still required to store
            // additional information required for the import.
            $table->foreignId('volume_id')
                ->nullable()
                ->constrained()
                ->onDelete('cascade');

            // Path of the file in the pending_metadata_storage_disk.
            $table->string('metadata_file_path', 256)->nullable();

            // Specify if the pending volume should be used to import annotations.
            $table->boolean('import_annotations')->default(false);

            // Specify if the pending volume should be used to import file labels.
            $table->boolean('import_file_labels')->default(false);

            // Specifies if a job to import metadata is already dispatched for this
            // pending volume.
            $table->boolean('importing')->default(false);

            // Used to filter the imported annotations.
            $table->jsonb('only_annotation_labels')->nullable();
            // Used to filter the imported file labels.
            $table->jsonb('only_file_labels')->nullable();
            // Used to map labels from the metadata to labels in the database.
            $table->jsonb('label_map')->nullable();
            // Used to map users from the metadata to users in the database.
            $table->jsonb('user_map')->nullable();

            // A user is only allowed to create one pending volume at a time for a
            // project.
            $table->unique(['user_id', 'project_id']);
        });

        Schema::table('volumes', function (Blueprint $table) {
            $table->string('metadata_file_path', 256)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('volumes', function (Blueprint $table) {
            $table->dropColumn('metadata_file_path');
        });

        Schema::dropIfExists('pending_volumes');
    }
};
