<?php

namespace Biigle\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class RegistrationAccepted extends Notification implements ShouldQueue
{
    use Queueable;

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
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Sign up accepted')
            ->replyTo(config('biigle.admin_email'))
            ->line('Your BIIGLE sign up has been accepted!')
            ->line('You can now create your own projects and label trees.')
            ->action('Visit BIIGLE', route('home'))
            ->line('If you have any problems or questions please reply to this email.');
    }
}
