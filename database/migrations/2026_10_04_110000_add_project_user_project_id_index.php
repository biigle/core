<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    public function up(): void
    {
        // The unique index on (user_id, project_id) can't be used to find the users of
        // a project, e.g. for the member list and count of the project page, the users
        // of a volume and the cascaded delete of a project.
        // Use CONCURRENTLY so the table is not blocked while the index is built.
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS project_user_project_id_index ON project_user (project_id)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS project_user_project_id_index');
    }
};
