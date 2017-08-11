<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers;

use ApiTestCase;

class SettingsControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $response = $this->json('POST', 'api/v1/users/my/settings/export')
            ->assertStatus(401);

        $this->beUser();
        $response = $this->post('api/v1/users/my/settings/export')
            ->assertStatus(200);

        $this->assertNull($this->user()->fresh()->settings);

        $response = $this->post('api/v1/users/my/settings/export', [
                'unknown_key' => 'somevalue',
            ])
            ->assertStatus(200);

        $this->assertNull($this->user()->fresh()->settings);
    }

    public function testStoreNotificationSettings()
    {
        $user = $this->user();
        $this->beUser();

        $this->assertNull($this->user()->fresh()->getSettings('report_notifications'));

        $response = $this->json('POST', 'api/v1/users/my/settings/export', [
                'report_notifications' => 'unknown value',
            ])
            ->assertStatus(422);

        $this->assertNull($this->user()->fresh()->getSettings('report_notifications'));

        $response = $this->json('POST', 'api/v1/users/my/settings/export', [
                'report_notifications' => 'email',
            ])
            ->assertStatus(200);

        $this->assertEquals('email', $this->user()->fresh()->getSettings('report_notifications'));

        $response = $this->json('POST', 'api/v1/users/my/settings/export', [
                'report_notifications' => 'web',
            ])
            ->assertStatus(200);

        $this->assertEquals('web', $this->user()->fresh()->getSettings('report_notifications'));

        config(['export.notifications.allow_user_settings' => false]);

        $response = $this->json('POST', 'api/v1/users/my/settings/export', [
                'report_notifications' => 'email',
            ])
            ->assertStatus(200);

        $this->assertEquals('web', $this->user()->fresh()->getSettings('report_notifications'));
    }
}
