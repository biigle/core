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

    public function testScopeWithLocalToken()
    {
        $this->assertFalse(FederatedSearchInstance::withLocalToken()->exists());
        $this->model->local_token = 'test';
        $this->model->save();
        $this->assertTrue(FederatedSearchInstance::withLocalToken()->exists());
    }

    public function testScopeWithRemoteToken()
    {
        $this->assertFalse(FederatedSearchInstance::withRemoteToken()->exists());
        $this->model->remote_token = 'test';
        $this->model->save();
        $this->assertTrue(FederatedSearchInstance::withRemoteToken()->exists());
    }

    public function testSetRemoteTokenAttribute()
    {
        $this->model->remote_token = 'test';
        $this->assertSame('test', decrypt($this->model->getAttributes()['remote_token']));
    }

    public function testGetRemoteTokenAttribute()
    {
        $this->model->setRawAttributes(['remote_token' => encrypt('test')]);
        $this->assertSame('test', $this->model->remote_token);
    }

    public function testCreateLocalToken()
    {
        $token = $this->model->createLocalToken();
        $this->assertSame(64, strlen($token));
        $this->assertSame(hash('sha256', $token), $this->model->local_token);
    }
}
