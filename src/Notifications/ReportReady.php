<?php

namespace Dias\Modules\Export\Notifications;

use Illuminate\Notifications\Notification;
use Dias\Modules\Export\Support\Reports\Report;
use Illuminate\Notifications\Messages\MailMessage;

class ReportReady extends Notification
{
    /**
     * The report that is ready
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
            ->subject('Your BIIGLE DIAS report is ready')
            ->line("Your {$this->report->getName()} for {$this->report->getSubject()} is ready for download!")
            ->line('The report will be removed once you have downloaded it.')
            ->action('Download report', $this->report->getUrl());
    }
}
