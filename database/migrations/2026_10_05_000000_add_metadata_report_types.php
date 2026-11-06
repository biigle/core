<?php

use Biigle\Support\EnumMigrationHelper;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE reports DROP CONSTRAINT reports_type_check');
        EnumMigrationHelper::addRangeValidationCheck('reports', 'type', 1, 18);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE reports DROP CONSTRAINT reports_type_check');
        EnumMigrationHelper::addRangeValidationCheck('reports', 'type', 1, 16);
    }
};
