<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use App;
use Biigle\Tests\LabelSourceTest;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Mockery;

class LabelSourceControllerTest extends ApiTestCase
{
    public function testFind()
    {
        $source = LabelSourceTest::create(['name' => 'my_source']);

        $mock = Mockery::mock();
        $mock->shouldReceive('find')
            ->once()
            ->with(Mockery::type(Request::class))
            ->andReturn([['name' => 'My Query Label']]);

        App::singleton('Biigle\Services\LabelSourceAdapters\MySourceAdapter', function () use ($mock) {
            return $mock;
        });

        $this->doTestApiRoute('GET', "/api/v1/label-sources/{$source->id}/find");

        $this->beGuest();

        $response = $this->json('GET', "/api/v1/label-sources/{$source->id}/find");
        // no query parameter
        $response->assertStatus(422);

        $response = $this->json('GET', "/api/v1/label-sources/{$source->id}/find", [
            'query' => 'my query',
        ]);
        $response->assertStatus(200);
        $response->assertExactJson([['name' => 'My Query Label']]);
    }

    public function testFindWithException()
    {
        $source = LabelSourceTest::create(['name' => 'my_source']);

        $mock = Mockery::mock();
        $mock->shouldReceive('find')
            ->once()
            ->andThrow(new \SoapFault('test', 'test')); // faultcode and faultstring parameter must to be set

        App::singleton('Biigle\Services\LabelSourceAdapters\MySourceAdapter', function () use ($mock) {
            return $mock;
        });

        $this->beGuest();

        $response = $this->json('GET', "/api/v1/label-sources/{$source->id}/find", [
            'query' => 'my query',
        ]);
        $response->assertStatus(Response::HTTP_SERVICE_UNAVAILABLE);



    }
}