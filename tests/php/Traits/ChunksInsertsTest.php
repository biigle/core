<?php

namespace Biigle\Tests\Traits;

use Biigle\LabelSource;
use Biigle\Traits\ChunksInserts;
use Illuminate\Support\Facades\DB;
use TestCase;

class ChunksInsertsTest extends TestCase
{
    public function testInsertInChunks()
    {
        config(['biigle.db_param_limit' => 5]);
        $inserts = $this->listenForInserts();
        $rows = array_map(fn ($i) => [
            'name' => "source {$i}",
            'description' => 'chunk test',
        ], range(1, 5));

        (new ChunksInsertsStub)->insertInChunks(LabelSource::class, $rows);

        // Two parameters per row and at most five parameters per query.
        $this->assertSame([4, 4, 2], $inserts->all());
        $names = LabelSource::where('description', 'chunk test')
            ->orderBy('id')
            ->pluck('name')
            ->all();
        $this->assertSame(array_column($rows, 'name'), $names);
    }

    public function testInsertInChunksEmpty()
    {
        $inserts = $this->listenForInserts();
        (new ChunksInsertsStub)->insertInChunks(LabelSource::class, []);
        $this->assertEmpty($inserts->all());
    }

    public function testInsertInChunksRowExceedsLimit()
    {
        config(['biigle.db_param_limit' => 1]);
        $inserts = $this->listenForInserts();
        $rows = [
            ['name' => 'source 1', 'description' => 'chunk test'],
            ['name' => 'source 2', 'description' => 'chunk test'],
        ];

        (new ChunksInsertsStub)->insertInChunks(LabelSource::class, $rows);

        // Rows can't be split so each row is inserted on its own.
        $this->assertSame([2, 2], $inserts->all());
        $this->assertSame(2, LabelSource::where('description', 'chunk test')->count());
    }

    /**
     * Collect the number of parameters of each insert query.
     */
    protected function listenForInserts()
    {
        $inserts = collect([]);
        DB::listen(function ($query) use ($inserts) {
            if (str_starts_with($query->sql, 'insert')) {
                $inserts->push(count($query->bindings));
            }
        });

        return $inserts;
    }
}

class ChunksInsertsStub
{
    use ChunksInserts {
        insertInChunks as public;
    }
}
