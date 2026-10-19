<?php

namespace Biigle\Notifications;

use Biigle\ExportFile;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use InvalidArgumentException;

class ExportReady extends Notification
{
    /**
     * Create a new notification instance.
     */
    public function __construct(protected ExportFile $export)
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
        $name = strtolower($this->export->getTypeName());
        $message = (new MailMessage)
            ->subject("Your BIIGLE {$name} export is ready")
            ->line("Your {$name} export is ready for download!");

        if (config('app.url')) {
            $message->action("Download {$name} export", $this->getUrl());
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
        $name = strtolower($this->export->getTypeName());
        $array = [
            'title' => "Your BIIGLE {$name} export is ready",
            'message' => "Your {$name} export is ready for download!",
        ];

        if (config('app.url')) {
            $array['action'] = "Download {$name} export";
            $array['actionLink'] = $this->getUrl();
        }

        return $array;
    }

    /**
     * Get the owner-authorized download URL.
     */
    protected function getUrl(): string
    {
        $path = match ($this->export->type) {
            'volumes' => 'volumes',
            'labelTrees' => 'label-trees',
            'users' => 'users',
            default => throw new InvalidArgumentException('Unknown export type.'),
        };

        return url("api/v1/export/{$path}/{$this->export->id}");
    }
}
