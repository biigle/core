<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * The source name is the name of a project or volume, which may be up to 512
     * characters long.
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('source_name', 512)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->string('source_name', 255)->change();
        });
    }
};
