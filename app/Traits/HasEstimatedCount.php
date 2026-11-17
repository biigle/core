<?php

namespace Biigle\Traits;

use DB;

trait HasEstimatedCount
{
    /**
     * Get an estimated count of all rows from pg_class statistics.
     * This is much faster than a full table scan of a large table.
     *
     * Falls back to an exact count if no statistics are available.
     *
     * See: https://wiki.postgresql.org/wiki/Count_estimate
     */
    public static function estimatedCount(): int
    {
        $table = (new static)->getTable();

        $estimate = (int) DB::selectOne('SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = ?', [$table])->estimate;

        // reltuples is -1 if the table was never analyzed (or 0 in older PostgreSQL
        // versions). Tables without statistics are usually small, so an exact count
        // is cheap.
        if ($estimate <= 0) {
            return static::count();
        }

        return $estimate;
    }
}
