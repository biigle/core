<?php

namespace Biigle\Modules\Export\Notifications;

use Biigle\Modules\Export\Report;
use Illuminate\Notifications\Notification;
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
        $message = (new MailMessage)
            ->subject('Your BIIGLE report is ready')
            ->line("Your {$this->report->name} for {$this->report->subject} is ready for download!");

        if (config('app.url')) {
            $message = $message->action('Download report', $this->report->getUrl());
        }

        return $message;
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        $array = [
            'title' => 'Your BIIGLE report is ready',
            'message' => "Your {$this->report->name} for {$this->report->subject} is ready for download!",
        ];

        if (config('app.url')) {
            $array['action'] = 'Download report';
            $array['actionLink'] = $this->report->getUrl();
        }

        return $array;
    }
}
