<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Http\Requests\UpdateUserSettings;

class UserSettingsControllerTest extends ApiTestCase
{
    public function testUpdate()
    {
        $this->doTestApiRoute('PUT', "/api/v1/users/my/settings");
    }

    public function testUpdateSuperUserMode()
    {
        $this->beUser();
        $this->putJson("/api/v1/users/my/settings", ['super_user_mode' => true])
            ->assertStatus(422);

        $this->beGlobalAdmin();
        $this->assertTrue($this->globalAdmin()->isInSuperUserMode);
        $this->putJson("/api/v1/users/my/settings", ['super_user_mode' => false])
            ->assertStatus(200);
        $this->assertFalse($this->globalAdmin()->fresh()->isInSuperUserMode);
    }

    public function testUpdateAdditionalRules()
    {
        $this->beUser();
        $this->putJson("/api/v1/users/my/settings", ['test' => 123])
            ->assertStatus(200);

        $this->assertEmpty($this->user()->fresh()->settings);
        UpdateUserSettings::addRule('test', 'integer');

        $this->putJson("/api/v1/users/my/settings", ['test' => 'abc'])
            ->assertStatus(422);

        $this->putJson("/api/v1/users/my/settings", ['test' => 123])
            ->assertStatus(200);

        $this->assertSame(['test' => 123], $this->user()->fresh()->settings);
    }

    public function testUpdateIncludeFederatedSearch()
    {
        $this->beUser();
        $this->assertNull($this->user()->getSettings('include_federated_search'));
        $this->putJson("/api/v1/users/my/settings", ['include_federated_search' => true])
            ->assertStatus(200);
        $this->assertTrue($this->user()->fresh()->getSettings('include_federated_search'));
    }
}
