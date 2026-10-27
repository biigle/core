<?php

namespace Biigle\Traits;

trait ChunksInserts
{
    /**
     * Insert rows with as few queries as possible but without exceeding the parameter
     * limit of the database (see biigle.db_param_limit).
     *
     * @param string $model Class name of the model to insert the rows for.
     * @param array $rows Rows to insert. All rows must have the same columns.
     */
    protected function insertInChunks(string $model, array $rows): void
    {
        if (empty($rows)) {
            return;
        }

        // Each column of each row is one query parameter.
        $columns = count(reset($rows));
        $chunkSize = max(1, intdiv(config('biigle.db_param_limit'), $columns));

        foreach (array_chunk($rows, $chunkSize) as $chunk) {
            $model::insert($chunk);
        }
    }
}
