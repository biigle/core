<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    /**
     * Replace the unique constraint on (images.filename, images.volume_id) with a unique
     * constraint on (images.volume_id, images.filename) that includes the id and uuid columns.
     *
     * The files of a volume are often listed ordered by filename (e.g. in the volume
     * overview and the annotation tool). With the new constraint, the list can be read
     * from the index alone without sorting or fetching the rows.
     * The new constraint can also be used for all queries that filter by volume_id
     * so the plain volume_id index is dropped.
     */
    public function up(): void
    {
        // Use CONCURRENTLY so the table is not blocked while the index is built.
        $this->dropInvalidIndex('images_volume_id_filename_unique');
        DB::statement('CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS images_volume_id_filename_unique ON images (volume_id, filename) INCLUDE (id, uuid)');

        // Swap the constraints in a transaction so uniqueness is enforced at all times.
        DB::transaction(function () {
            if (!$this->constraintExists('images_volume_id_filename_unique')) {
                DB::statement('ALTER TABLE images ADD CONSTRAINT images_volume_id_filename_unique UNIQUE USING INDEX images_volume_id_filename_unique');
            }
            DB::statement('ALTER TABLE images DROP CONSTRAINT IF EXISTS images_filename_transect_id_unique');
        });

        DB::statement('DROP INDEX CONCURRENTLY IF EXISTS images_transect_id_index');
    }

    public function down(): void
    {
        DB::statement('CREATE INDEX CONCURRENTLY IF NOT EXISTS images_transect_id_index ON images (volume_id)');

        $this->dropInvalidIndex('images_filename_transect_id_unique');
        DB::statement('CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS images_filename_transect_id_unique ON images (filename, volume_id)');

        DB::transaction(function () {
            if (!$this->constraintExists('images_filename_transect_id_unique')) {
                DB::statement('ALTER TABLE images ADD CONSTRAINT images_filename_transect_id_unique UNIQUE USING INDEX images_filename_transect_id_unique');
            }
            DB::statement('ALTER TABLE images DROP CONSTRAINT IF EXISTS images_volume_id_filename_unique');
        });
    }

    /**
     * Determine if a constraint with the given name exists on the table.
     */
    protected function constraintExists(string $name): bool
    {
        return DB::table('pg_constraint')
            ->where('conrelid', DB::raw("'images'::regclass"))
            ->where('conname', $name)
            ->exists();
    }

    /**
     * Drop the index if it is invalid (e.g. after a failed concurrent build).
     */
    protected function dropInvalidIndex(string $name): void
    {
        $invalid = DB::table('pg_index')
            ->join('pg_class', 'pg_class.oid', '=', 'pg_index.indexrelid')
            ->where('pg_class.relname', $name)
            ->where('pg_index.indisvalid', false)
            ->exists();

        if ($invalid) {
            DB::statement("DROP INDEX CONCURRENTLY IF EXISTS {$name}");
        }
    }
};
