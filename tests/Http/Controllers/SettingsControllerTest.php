<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers;

use ApiTestCase;

class SettingsControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $response = $this->json('POST', 'api/v1/users/my/settings/reports')
            ->assertStatus(401);

        $this->beUser();
        $response = $this->post('api/v1/users/my/settings/reports')
            ->assertStatus(200);

        $this->assertNull($this->user()->fresh()->settings);

        $response = $this->post('api/v1/users/my/settings/reports', [
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

        $response = $this->json('POST', 'api/v1/users/my/settings/reports', [
                'report_notifications' => 'unknown value',
            ])
            ->assertStatus(422);

        $this->assertNull($this->user()->fresh()->getSettings('report_notifications'));

        $response = $this->json('POST', 'api/v1/users/my/settings/reports', [
                'report_notifications' => 'email',
            ])
            ->assertStatus(200);

        $this->assertEquals('email', $this->user()->fresh()->getSettings('report_notifications'));

        $response = $this->json('POST', 'api/v1/users/my/settings/reports', [
                'report_notifications' => 'web',
            ])
            ->assertStatus(200);

        $this->assertEquals('web', $this->user()->fresh()->getSettings('report_notifications'));

        config(['reports.notifications.allow_user_settings' => false]);

        $response = $this->json('POST', 'api/v1/users/my/settings/reports', [
                'report_notifications' => 'email',
            ])
            ->assertStatus(200);

        $this->assertEquals('web', $this->user()->fresh()->getSettings('report_notifications'));
    }
}
