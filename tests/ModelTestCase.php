<?php

abstract class ModelTestCase extends TestCase
{
    public static function make($attrs = [])
    {
        return static::$modelClass::factory()->make($attrs);
    }

    public static function create($attrs = [])
    {
        return static::$modelClass::factory()->create($attrs);
    }

    protected $model;

    public function setUp(): void
    {
        parent::setUp();
        $this->model = static::create();
    }

    public function testCreation()
    {
        $this->assertTrue($this->model->exists);
    }

    abstract public function testAttributes();
}
