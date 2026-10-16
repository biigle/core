<?php

namespace Biigle\Tests\Notifications;

use Biigle\Notifications\VolumeExportReady;
use Biigle\User;
use Biigle\VolumeExport;
use TestCase;

class VolumeExportReadyTest extends TestCase
{
    public function testUsesReportNotificationPreference(): void
    {
        config(['reports.notifications.allow_user_settings' => true]);
        $user = new User;
        $notification = new VolumeExportReady(new VolumeExport);

        $user->setSettings(['report_notifications' => 'web']);
        $this->assertSame(['database'], $notification->via($user));

        $user->setSettings(['report_notifications' => 'email']);
        $this->assertSame(['mail'], $notification->via($user));
    }

    public function testIncludesDownloadLink(): void
    {
        config(['app.url' => 'https://biigle.test']);
        $export = new VolumeExport;
        $export->id = 123;
        $notification = new VolumeExportReady($export);
        $link = '/api/v1/export/volumes/123';

        $this->assertStringEndsWith(
            $link,
            $notification->toArray(null)['actionLink']
        );
        $this->assertStringEndsWith($link, $notification->toMail(null)->actionUrl);
    }
}
