<?php

namespace Dias\Tests\Http\Controllers\Api;

use App;
use Mockery;
use ApiTestCase;
use Dias\Tests\LabelSourceTest;

class LabelSourceControllerTest extends ApiTestCase
{
    public function testFind()
    {
        $source = LabelSourceTest::create(['name' => 'my_source']);

        $mock = Mockery::mock();
        $mock->shouldReceive('find')
            ->once()
            ->with('my query')
            ->andReturn([['name' => 'My Query Label']]);

        App::singleton('Dias\Services\LabelSourceAdapters\MySourceAdapter', function () use ($mock) {
            return $mock;
        });

        $this->doTestApiRoute('GET', "/api/v1/label-sources/{$source->id}/find");

        $this->beGuest();

        $this->json('GET', "/api/v1/label-sources/{$source->id}/find");
        // no query parameter
        $this->assertResponseStatus(422);

        $this->json('GET', "/api/v1/label-sources/{$source->id}/find", [
            'query' => 'my query',
        ]);
        $this->assertResponseOk();
        $this->seeJsonEquals([['name' => 'My Query Label']]);
    }}
