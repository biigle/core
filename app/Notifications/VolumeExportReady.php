<?php

namespace Biigle\Notifications;

use Biigle\VolumeExport;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VolumeExportReady extends Notification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(protected VolumeExport $export)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        $settings = config('reports.notifications.default_settings');

        if (config('reports.notifications.allow_user_settings') === true) {
            $settings = $notifiable->getSettings('report_notifications', $settings);
        }

        return $settings === 'web' ? ['database'] : ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param mixed $notifiable
     */
    public function toMail($notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Your BIIGLE volume export is ready')
            ->line('Your volume export is ready for download!');

        if (config('app.url')) {
            $message->action('Download volume export', $this->getUrl());
        }

        return $message;
    }

    /**
     * Get the array representation of the notification.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        $array = [
            'title' => 'Your BIIGLE volume export is ready',
            'message' => 'Your volume export is ready for download!',
        ];

        if (config('app.url')) {
            $array['action'] = 'Download volume export';
            $array['actionLink'] = $this->getUrl();
        }

        return $array;
    }

    /**
     * Get the owner-authorized download URL.
     */
    protected function getUrl(): string
    {
        return url("api/v1/export/volumes/{$this->export->id}");
    }
}
