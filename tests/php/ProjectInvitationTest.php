<?php

namespace Biigle\Tests;

use Biigle\ProjectInvitation;
use Illuminate\Database\QueryException;
use ModelTestCase;

class ProjectInvitationTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = ProjectInvitation::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->uuid);
        $this->assertNotNull($this->model->expires_at);
        $this->assertNotNull($this->model->project_id);
        $this->assertNotNull($this->model->role_id);
        $this->assertNotNull($this->model->current_uses);
        $this->assertNull($this->model->max_uses);
    }

    public function testMaxUsesConstraint()
    {
        $this->model->increment('current_uses');
        $this->model->update(['max_uses' => 1]);

        $this->expectException(QueryException::class);
        $this->model->increment('current_uses');
    }

    public function testIsOpenUses()
    {
        $this->assertTrue($this->model->isOpen());
        $this->model->max_uses = 2;
        $this->model->current_uses = 1;
        $this->assertTrue($this->model->isOpen());
        $this->model->current_uses = 2;
        $this->assertFalse($this->model->isOpen());
    }

    public function testIsOpenDate()
    {
        $this->assertTrue($this->model->isOpen());
        $this->model->expires_at = '2022-11-09 14:51:00';
        $this->assertFalse($this->model->isOpen());
    }
}
