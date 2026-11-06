<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {

    public $withinTransaction = false;

    /**
     * Replace the unique constraints on (filename, volume_id) of images and videos with
     * unique constraints on (volume_id, filename) that include the id and uuid columns.
     *
     * The files of a volume are often listed ordered by filename (e.g. in the volume
     * overview and the annotation tool). With the new constraints, the lists can be read
     * from the index alone without sorting or fetching the rows. The new constraints
     * can also be used for all queries that filter by volume_id, so the plain volume_id
     * indices are dropped.
     */
    public function up(): void
    {
        // Use CONCURRENTLY so the tables are not blocked while the indices are built.
        DB::statement('CREATE UNIQUE INDEX CONCURRENTLY images_volume_id_filename_unique ON images (volume_id, filename) INCLUDE (id, uuid)');
        DB::statement('CREATE UNIQUE INDEX CONCURRENTLY videos_volume_id_filename_unique ON videos (volume_id, filename) INCLUDE (id, uuid)');

        // Swap the constraints in a transaction so uniqueness is enforced at all times.
        DB::transaction(function () {
            DB::statement('ALTER TABLE images ADD CONSTRAINT images_volume_id_filename_unique UNIQUE USING INDEX images_volume_id_filename_unique');
            DB::statement('ALTER TABLE images DROP CONSTRAINT images_filename_transect_id_unique');
            DB::statement('ALTER TABLE videos ADD CONSTRAINT videos_volume_id_filename_unique UNIQUE USING INDEX videos_volume_id_filename_unique');
            DB::statement('ALTER TABLE videos DROP CONSTRAINT videos_filename_volume_id_unique');
        });

        DB::statement('DROP INDEX CONCURRENTLY images_transect_id_index');
        DB::statement('DROP INDEX CONCURRENTLY videos_volume_id_index');
    }

    public function down(): void
    {
        DB::statement('CREATE INDEX CONCURRENTLY images_transect_id_index ON images (volume_id)');
        DB::statement('CREATE INDEX CONCURRENTLY videos_volume_id_index ON videos (volume_id)');

        DB::statement('CREATE UNIQUE INDEX CONCURRENTLY images_filename_transect_id_unique ON images (filename, volume_id)');
        DB::statement('CREATE UNIQUE INDEX CONCURRENTLY videos_filename_volume_id_unique ON videos (filename, volume_id)');

        DB::transaction(function () {
            DB::statement('ALTER TABLE images ADD CONSTRAINT images_filename_transect_id_unique UNIQUE USING INDEX images_filename_transect_id_unique');
            DB::statement('ALTER TABLE images DROP CONSTRAINT images_volume_id_filename_unique');
            DB::statement('ALTER TABLE videos ADD CONSTRAINT videos_filename_volume_id_unique UNIQUE USING INDEX videos_filename_volume_id_unique');
            DB::statement('ALTER TABLE videos DROP CONSTRAINT videos_volume_id_filename_unique');
        });
    }
};
