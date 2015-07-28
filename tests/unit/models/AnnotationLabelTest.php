<?php

use Dias\AnnotationLabel;

class AnnotationLabelTest extends TestCase
{
    public static function create($annotation = false, $label = false, $user = false, $confidence = 0.0)
    {
        $obj = new AnnotationLabel;
        $annotation = $annotation ? $annotation : AnnotationTest::create();
        $annotation->save();
        $obj->annotation()->associate($annotation);
        $label = $label ? $label : LabelTest::create();
        $label->save();
        $obj->label()->associate($label);
        $user = $user ? $user : UserTest::create();
        $user->save();
        $obj->user()->associate($user);
        $obj->confidence = $confidence;

        return $obj;
    }

    public function testCreation()
    {
        $obj = self::create();
        $this->assertTrue($obj->save());
    }

    public function testAttributes()
    {
        $annotationLabel = self::create();
        $annotationLabel->save();
        $this->assertNotNull($annotationLabel->annotation);
        $this->assertNotNull($annotationLabel->label);
        $this->assertNotNull($annotationLabel->user);
        $this->assertNotNull($annotationLabel->created_at);
        $this->assertNotNull($annotationLabel->updated_at);
        $this->assertTrue(is_float($annotationLabel->confidence));
    }

    public function testHiddenAttributes()
    {
        // API key mustn't show up in the JSON
        $json = json_decode((string) self::create());
        $this->assertObjectNotHasAttribute('label_id', $json);
        $this->assertObjectNotHasAttribute('user_id', $json);
        $this->assertObjectNotHasAttribute('annotation_id', $json);
        $this->assertObjectHasAttribute('confidence', $json);
    }

    public function testAnnotationOnDeleteCascade()
    {
        $annotationLabel = self::create();
        $annotationLabel->save();
        $this->assertNotNull(AnnotationLabel::find($annotationLabel->id));
        $annotationLabel->annotation()->delete();
        $this->assertNull(AnnotationLabel::find($annotationLabel->id));
    }

    public function testLabelOnDeleteRestrict()
    {
        $annotationLabel = self::create();
        $annotationLabel->save();
        $this->assertNotNull(AnnotationLabel::find($annotationLabel->id));
        $this->setExpectedException('Illuminate\Database\QueryException');
        $annotationLabel->label()->delete();
    }

    public function testUserOnDeleteSetNull()
    {
        $annotationLabel = self::create();
        $annotationLabel->save();
        $this->assertNotNull($annotationLabel->fresh()->user);
        $annotationLabel->user->delete();
        $this->assertNull($annotationLabel->fresh()->user);
    }

    public function testUniqueProperties()
    {
        $annotationLabel = self::create();
        $annotationLabel->save();

$test = self::create(
            $annotationLabel->annotation,
            $annotationLabel->label,
            $annotationLabel->user
        );
        $this->setExpectedException('Illuminate\Database\QueryException');
        $test->save();
    }
}
