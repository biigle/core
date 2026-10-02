<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Trigram indexes cannot be built inside a transaction when CONCURRENTLY is
     * used, and CONCURRENTLY is what keeps the images table writable while the
     * index is created.
     *
     * @var bool
     */
    public $withinTransaction = false;

    /**
     * Columns that are searched with a leading-wildcard LIKE/ILIKE.
     *
     * @var array<string, string>
     */
    protected $columns = [
        'images' => 'filename',
        'videos' => 'filename',
        'volumes' => 'name',
        'projects' => 'name',
        'label_trees' => 'name',
    ];

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // A substring match like "%term%" cannot use a btree index, so searching
        // filenames scans the whole table. A GIN trigram index makes these
        // matches index-supported for terms of at least three characters, which
        // is what SearchController::MIN_FILE_QUERY_LENGTH enforces.
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        foreach ($this->columns as $table => $column) {
            DB::statement("CREATE INDEX CONCURRENTLY IF NOT EXISTS {$table}_{$column}_trgm_index ON {$table} USING gin ({$column} gin_trgm_ops);");
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        foreach ($this->columns as $table => $column) {
            DB::statement("DROP INDEX CONCURRENTLY IF EXISTS {$table}_{$column}_trgm_index;");
        }

        // The extension is left in place: other things may have started using it.
    }
};
