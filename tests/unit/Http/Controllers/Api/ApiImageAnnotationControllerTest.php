<?php

class ApiImageAnnotationControllerTest extends ApiTestCase
{
    private $image;

    public function setUp()
    {
        parent::setUp();
        $this->image = ImageTest::create();
        $this->project->addTransectId($this->image->transect->id);
    }

    public function testIndex()
    {
        $annotation = AnnotationTest::create(['image_id' => $this->image->id]);

        // test ordering of points, too
        // use fresh() so numbers get strings in SQLite and stay numbers in Postgres
        $point1 = AnnotationPointTest::create([
            'annotation_id' => $annotation->id,
            'index' => 1,
        ])->fresh();
        $point2 = AnnotationPointTest::create([
            'annotation_id' => $annotation->id,
            'index' => 0,
        ])->fresh();

        $this->doTestApiRoute('GET',
            '/api/v1/images/'.$this->image->id.'/annotations'
        );

        // api key authentication
        $this->callToken('GET',
            '/api/v1/images/'.$this->image->id.'/annotations',
            $this->user
        );
        $this->assertResponseStatus(401);

        $this->callToken('GET',
            '/api/v1/images/'.$this->image->id.'/annotations',
            $this->guest
        );
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->guest);
        $this->get('/api/v1/images/'.$this->image->id.'/annotations')
            ->seeJson([
                'points' => [
                    ['x' => $point2->x, 'y' => $point2->y],
                    ['x' => $point1->x, 'y' => $point1->y],
                ]
            ]);
    }

    public function testStore()
    {
        $this->doTestApiRoute('POST',
            '/api/v1/images/'.$this->image->id.'/annotations'
        );

        // api key authentication
        $this->callToken('POST',
            '/api/v1/images/'.$this->image->id.'/annotations',
            $this->guest
        );
        $this->assertResponseStatus(401);

        $this->callToken('POST',
            '/api/v1/images/'.$this->image->id.'/annotations',
            $this->editor
        );
        // missing arguments
        $this->assertResponseStatus(422);

        // session cookie authentication
        $this->be($this->editor);

        $this->callAjax('POST',
            '/api/v1/images/'.$this->image->id.'/annotations',
            [
                '_token' => Session::token(),
                'shape_id' => 99999,
                'points' => '',
            ]
        );
        // shape does not exist
        $this->assertResponseStatus(422);

        $this->callAjax('POST',
            '/api/v1/images/'.$this->image->id.'/annotations',
            [
                '_token' => Session::token(),
                'shape_id' => \Dias\Shape::$lineId,
                'label_id' => 99999,
            ]
        );
        // label is required
        $this->assertResponseStatus(422);

        $this->callAjax('POST',
            '/api/v1/images/'.$this->image->id.'/annotations',
            [
                '_token' => Session::token(),
                'shape_id' => \Dias\Shape::$pointId,
                'label_id' => $this->labelRoot->id,
            ]
        );
        // confidence required
        $this->assertResponseStatus(422);

        $this->callAjax('POST',
            '/api/v1/images/'.$this->image->id.'/annotations',
            [
                '_token' => Session::token(),
                'shape_id' => \Dias\Shape::$pointId,
                'label_id' => $this->labelRoot->id,
                'confidence' => 0.5,
                'points' => '[]',
            ]
        );
        // at least one point required
        $this->assertResponseStatus(400);

        $this->post('/api/v1/images/'.$this->image->id.'/annotations', [
            '_token' => Session::token(),
            'shape_id' => \Dias\Shape::$pointId,
            'label_id' => $this->labelRoot->id,
            'confidence' => 0.5,
            'points' => '[{"x":10,"y":11},{"x":12,"y":13}]',
        ]);

        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            $this->seeJson([
                'points' => [
                    ['x' => '10', 'y' => '11'],
                    ['x' => '12', 'y' => '13'],
                ]
            ]);
        } else {
            $this->seeJson([
                'points' => [
                    ['x' => 10, 'y' => 11],
                    ['x' => 12, 'y' => 13],
                ]
            ]);
        }

        $annotation = $this->image->annotations->first();
        $this->assertNotNull($annotation);

        $this->assertEquals(2, $annotation->points()->count());

        $this->assertEquals(1, $annotation->labels()->count());
    }
}
