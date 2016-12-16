<?php

namespace Dias\Tests\Http\Controllers\Api;

use Dias\Role;
use ApiTestCase;
use Dias\LabelTree;
use Dias\Tests\LabelTest;
use Dias\Tests\AnnotationLabelTest;

class LabelControllerTest extends ApiTestCase
{
    public function testDestroy()
    {
        $label = LabelTest::create();
        $label->tree->addMember($this->editor(), Role::$editor);

        $this->doTestApiRoute('DELETE', "/api/v1/labels/{$label->id}");

        // only label tree members can remove a label
        $this->beUser();
        $this->json('DELETE', "/api/v1/labels/{$label->id}");
        $this->assertResponseStatus(403);

        // make sure the label is used somewhere
        $a = AnnotationLabelTest::create(['label_id' => $label->id]);

        $this->beEditor();
        $this->json('DELETE', "/api/v1/labels/{$label->id}");
        // can't be deleted if a label is still in use
        $this->assertResponseStatus(403);

        $a->delete();

        $child = LabelTest::create(['parent_id' => $label->id]);

        $this->beEditor();
        $this->json('DELETE', "/api/v1/labels/{$label->id}");
        // can't be deleted if label has children
        $this->assertResponseStatus(403);

        $child->delete();

        $this->assertNotNull($label->fresh());
        $this->json('DELETE', "/api/v1/labels/{$label->id}");
        $this->assertResponseOk();
        $this->assertNull($label->fresh());
    }

    public function testDestroyFormRequest()
    {
        $label = LabelTest::create();
        $label->tree->addMember($this->editor(), Role::$editor);

        $this->beEditor();
        $this->visit('/');
        $this->delete("/api/v1/labels/{$label->id}");
        $this->assertNull($label->fresh());
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('deleted', true);

        $label = LabelTest::create();
        $label->tree->addMember($this->editor(), Role::$editor);

        $this->delete("/api/v1/labels/{$label->id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertNull($label->fresh());
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('deleted', true);
    }
}
