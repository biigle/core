<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    public function up(): void
    {
        // The unique index on (label_tree_id, project_id) can't be used to find the
        // label trees of a project, e.g. in the annotation tool, the volume page, the
        // label tree tab count of the project page and the cascaded delete of a project.
        // Use CONCURRENTLY so the table is not blocked while the index is built.
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS label_tree_project_project_id_index ON label_tree_project (project_id)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS label_tree_project_project_id_index');
    }
};
