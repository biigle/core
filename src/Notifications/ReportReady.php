<?php

namespace Biigle\Modules\Export\Notifications;

use Illuminate\Notifications\Notification;
use Biigle\Modules\Export\Support\Reports\Report;
use Illuminate\Notifications\Messages\MailMessage;

class ReportReady extends Notification
{
    /**
     * The report that is ready.
     *
     * @var Report
     */
    protected $report;

    /**
     * Create a new notification instance.
     *
     * @param Report $report
     * @return void
     */
    public function __construct(Report $report)
    {
        $this->report = $report;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        $settings = config('export.notifications.default_settings');

        if (config('export.notifications.allow_user_settings') === true) {
            $settings = $notifiable->getSettings('report_notifications', $settings);
        }

        if ($settings === 'web') {
            return ['database'];
        }

        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Your BIIGLE report is ready')
            ->line("Your {$this->report->getName()} for {$this->report->getSubject()} is ready for download!")
            ->line('The report will be removed once you have downloaded it.')
            ->action('Download report', $this->report->getUrl());
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'title' => 'Your BIIGLE report is ready',
            'message' => "Your {$this->report->getName()} for {$this->report->getSubject()} is ready for download! The report will be removed once you have downloaded it.",
            'action' => 'Download report',
            'actionLink' => $this->report->getUrl(),
        ];
    }
}
