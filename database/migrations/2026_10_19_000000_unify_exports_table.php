<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::rename('volume_exports', 'exports');

        Schema::table('exports', function (Blueprint $table) {
            $table->renameColumn('volume_ids', 'entity_ids');
            $table->string('type')->default('volumes');
        });
    }

    public function down(): void
    {
        Schema::table('exports', function (Blueprint $table) {
            $table->dropColumn('type');
            $table->renameColumn('entity_ids', 'volume_ids');
        });

        Schema::rename('exports', 'volume_exports');
    }
};
