<?php

namespace Biigle\Tests\Policies;

use Biigle\Announcement;
use Biigle\Role;
use Biigle\User;
use TestCase;

class AnnouncementPolicyTest extends TestCase
{
    private $user;
    private $globalAdmin;
    private $announcement;

    public function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->globalAdmin = User::factory()->create(['role_id' => Role::adminId()]);
        $this->announcement = Announcement::factory()->create();
    }

    public function testCreate()
    {
        $this->assertFalse($this->user->can('create', Announcement::class));
        $this->assertTrue($this->globalAdmin->can('create', Announcement::class));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->announcement));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->announcement));
    }
}
