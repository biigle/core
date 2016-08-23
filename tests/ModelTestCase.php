<?php

abstract class ModelTestCase extends TestCase
{
    public static function make($attrs = [])
    {
        return factory(static::$modelClass)->make($attrs);
    }

    public static function create($attrs = [])
    {
        return factory(static::$modelClass)->create($attrs);
    }

    protected $model;

    public function setUp()
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
