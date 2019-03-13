<?php

namespace Biigle\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class RegistrationRejected extends Notification
{
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
            ->subject('Sign up rejected')
            ->replyTo(config('biigle.admin_email'))
            ->line('Your BIIGLE sign up has been rejected.')
            ->line('If you think this was done in error, please reply to this email.');
    }
}
