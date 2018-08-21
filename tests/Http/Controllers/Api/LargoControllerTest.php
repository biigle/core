<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api;

use Exception;
use ApiTestCase;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Modules\Largo\Http\Controllers\Api\LargoController;

class LargoControllerTest extends ApiTestCase
{
    public function testSaveChangedAlreadyExists()
    {
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);
        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelChild()->id,
        ]);

        $this->beEditor();
        (new LargoControllerStub)->save($this->editor(), [
            'dismissed' => [
                $l1->label_id => [$a1->id],
            ],
            'changed' => [
                $l2->label_id => [$a1->id], // This already exists from the same user!
            ],
        ]);

        $this->assertEquals(1, $a1->labels()->count());
        $this->assertEquals($l2->id, $a1->labels()->first()->id);
    }

    public function testAnnotationMeanwhileDeleted()
    {
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $request = [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
            ],
            'changed' => [
                $this->labelChild()->id => [$a1->id, $a2->id],
            ],
        ];

        // annotation was deleted during the Largo session but saving should still work
        $a2->delete();

        (new LargoControllerStub)->save($this->editor(), $request);
        $this->assertEquals($this->labelChild()->id, $a1->labels()->first()->label_id);
    }

    public function testLabelMeanwhileDeleted()
    {
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $a2 = AnnotationTest::create(['image_id' => $image->id]);
        $otherLabel = LabelTest::create(['label_tree_id' => $this->labelRoot()->label_tree_id]);

        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $l2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $request = [
            'dismissed' => [
                $l1->label_id => [$a1->id, $a2->id],
            ],
            'changed' => [
                $otherLabel->id => [$a1->id],
                $this->labelChild()->id => [$a2->id],
            ],
        ];

        $otherLabel->delete();

        (new LargoControllerStub)->save($this->editor(), $request);
        $this->assertEquals($this->labelRoot()->id, $a1->labels()->first()->label_id);
        $this->assertEquals($this->labelChild()->id, $a2->labels()->first()->label_id);
    }

    public function testErrorRollbackDismissed()
    {
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $request = [
            'dismissed' => [
                $l1->label_id => [$a1->id],
            ],
            'changed' => [],
        ];

        $controller = new LargoControllerStub;
        $controller->throw = true;

        try {
            $controller->save($this->editor(), $request);
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertEquals(1, $a1->labels()->count());
            $this->assertEquals($l1->label_id, $a1->labels()->first()->label_id);
        }
    }

    public function testErrorRollbackChanged()
    {
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $a1 = AnnotationTest::create(['image_id' => $image->id]);
        $l1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $this->editor()->id,
            'label_id' => $this->labelRoot()->id,
        ]);

        $request = [
            'dismissed' => [
                $l1->label_id => [$a1->id],
            ],
            'changed' => [
                $this->labelChild()->id => [$a1->id],
            ],
        ];

        $controller = new LargoControllerStub;
        $controller->throw = true;

        try {
            $controller->save($this->editor(), $request);
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertEquals($l1->label_id, $a1->labels()->first()->label_id);
        }
    }
}

class LargoControllerStub extends LargoController
{
    public $throw;
    public function save($user, $request)
    {
        $this->applySave($user, $request['dismissed'], $request['changed']);
    }

    protected function applyChangedLabels($user, $changed)
    {
        $r = parent::applyChangedLabels($user, $changed);

        if ($this->throw) {
            throw new Exception('Throwing up');
        }

        return $r;
    }
}
