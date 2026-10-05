<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    public function up(): void
    {
        // The reports of a user are fetched for the reports tab of the search page
        // and when a user is deleted.
        // Use CONCURRENTLY so the table is not blocked while the index is built.
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS reports_user_id_index ON reports (user_id)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS reports_user_id_index');
    }
};
