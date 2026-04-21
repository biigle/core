<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The index speeds up range queries e.g. in the admin dashboard.
        Schema::table('image_annotations', function (Blueprint $table) {
            $table->index('created_at');
        });

        Schema::table('video_annotations', function (Blueprint $table) {
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('image_annotations', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });

        Schema::table('video_annotations', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
        });
    }
};
