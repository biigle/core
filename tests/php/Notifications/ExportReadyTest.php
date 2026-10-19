<?php

namespace Biigle\Tests\Notifications;

use Biigle\ExportFile;
use Biigle\Notifications\ExportReady;
use Biigle\User;
use TestCase;

class ExportReadyTest extends TestCase
{
    public function testUsesReportNotificationPreference(): void
    {
        config(['reports.notifications.allow_user_settings' => true]);
        $user = new User;
        $notification = new ExportReady(new ExportFile);

        $user->setSettings(['report_notifications' => 'web']);
        $this->assertSame(['database'], $notification->via($user));

        $user->setSettings(['report_notifications' => 'email']);
        $this->assertSame(['mail'], $notification->via($user));
    }

    public function testIncludesDownloadLink(): void
    {
        config(['app.url' => 'https://biigle.test']);
        $export = new ExportFile;
        $export->id = 123;
        $export->type = 'volumes';
        $notification = new ExportReady($export);
        $link = '/api/v1/export/volumes/123';

        $this->assertStringEndsWith(
            $link,
            $notification->toArray(null)['actionLink']
        );
        $this->assertStringEndsWith($link, $notification->toMail(null)->actionUrl);
    }

    public function testIncludesUserAndLabelTreeLinks(): void
    {
        $export = new ExportFile;
        $export->id = 123;

        foreach (['users' => 'users', 'labelTrees' => 'label-trees'] as $type => $path) {
            $export->type = $type;
            $notification = new ExportReady($export);
            $this->assertStringEndsWith(
                "/api/v1/export/{$path}/123",
                $notification->toArray(null)['actionLink']
            );
        }
    }
}
