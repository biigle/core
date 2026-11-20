<?php

namespace Biigle\Tests\Services\Export;

use Biigle\Services\Export\UserExport;
use Biigle\Tests\UserTest;
use TestCase;

class UserExportTest extends TestCase
{
    public function testGetContent()
    {
        $user1 = UserTest::create(['attrs' => ['settings' => ['a' => 'b']]]);
        $user2 = UserTest::create();

        $export = new UserExport([$user1->id, $user2->id]);
        $expect = [
            'id' => $user1->id,
            'firstname' => $user1->firstname,
            'lastname' => $user1->lastname,
            'email' => $user1->email,
            'settings' => ['a' => 'b'],
            'uuid' => $user1->uuid,
            'affiliation' => $user1->affiliation,
        ];

        $content = $export->getContent();

        $this->assertCount(2, $content);
        $this->assertEquals($expect, $content[0]);
        $this->assertArrayNotHasKey('password', $content[0]);
        $this->assertArrayNotHasKey('password', $content[1]);
    }
}
