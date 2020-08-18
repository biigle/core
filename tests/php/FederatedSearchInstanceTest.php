<?php

namespace Biigle\Tests;

use Biigle\FederatedSearchInstance;
use ModelTestCase;

class FederatedSearchInstanceTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = FederatedSearchInstance::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->url);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testModels()
    {
        $model = FederatedSearchModelTest::create([
            'federated_search_instance_id' => $this->model->id,
        ]);

        $this->assertNotNull($this->model->models()->find($model->id));

        $this->model->delete();
        $this->assertNull($model->fresh());
    }
}
