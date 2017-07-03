<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers;

use ApiTestCase;

class SettingsControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $this->json('POST', 'api/v1/users/my/settings/export')
            ->assertResponseStatus(401);

        $this->beUser();
        $this->post('api/v1/users/my/settings/export')
            ->assertResponseOk();

        $this->assertNull($this->user()->fresh()->settings);

        $this->post('api/v1/users/my/settings/export', [
                'unknown_key' => 'somevalue',
            ])
            ->assertResponseOk();

        $this->assertNull($this->user()->fresh()->settings);
    }

    public function testStoreNotificationSettings()
    {
        $user = $this->user();
        $this->beUser();

        $this->assertNull($this->user()->fresh()->getSettings('report_notifications'));

        $this->json('POST', 'api/v1/users/my/settings/export', [
                'report_notifications' => 'unknown value',
            ])
            ->assertResponseStatus(422);

        $this->assertNull($this->user()->fresh()->getSettings('report_notifications'));

        $this->json('POST', 'api/v1/users/my/settings/export', [
                'report_notifications' => 'email',
            ])
            ->assertResponseOk();

        $this->assertEquals('email', $this->user()->fresh()->getSettings('report_notifications'));

        $this->json('POST', 'api/v1/users/my/settings/export', [
                'report_notifications' => 'web',
            ])
            ->assertResponseOk();

        $this->assertEquals('web', $this->user()->fresh()->getSettings('report_notifications'));

        config(['export.notifications.allow_user_settings' => false]);

        $this->json('POST', 'api/v1/users/my/settings/export', [
                'report_notifications' => 'email',
            ])
            ->assertResponseOk();

        $this->assertEquals('web', $this->user()->fresh()->getSettings('report_notifications'));
    }
}
