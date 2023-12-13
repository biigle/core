<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // The pgvector connection was removed later so it may not always be present.
        // There is a second migration that enables pgvector for the default connection.
        // See: https://github.com/biigle/maia/pull/150
        if (!is_null(config('database.connections-pgvector'))) {
            DB::connection('pgvector')
                ->statement('CREATE EXTENSION IF NOT EXISTS vector');

        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (!is_null(config('database.connections-pgvector'))) {
            DB::connection('pgvector')
                ->statement('DROP EXTENSION IF NOT EXISTS vector');

        }
    }
};
