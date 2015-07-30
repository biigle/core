<?php

use Dias\Attribute;

class AttributeTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\Attribute::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->type);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testNameUnique()
    {
        $this->setExpectedException('Illuminate\Database\QueryException');
        static::create(['name' => $this->model->name]);
    }

    public function testTypeRequired()
    {
        $this->model->type = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testTypes()
    {
        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            // SQLite doesn't support enums
            return;
        }
        self::create(['type' => 'integer']);
        self::create(['type' => 'double']);
        self::create(['type' => 'string']);
        self::create(['type' => 'boolean']);
        $this->setExpectedException('Illuminate\Database\QueryException');
        self::create(['type' => 'test']);
    }
}
