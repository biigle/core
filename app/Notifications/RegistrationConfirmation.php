<?php

namespace Biigle\Notifications;

use Biigle\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use View;

class RegistrationConfirmation extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * User who has been newly registered.
     *
     * @var User
     */
    public $user;

    /**
     * Create a new notification instance.
     *
     * @param User $user
     */
    public function __construct(User $user)
    {
        $this->user = $user;
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
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('New user registration')
            ->replyTo($this->user->email, "{$this->user->firstname} {$this->user->lastname}")
            ->markdown('notifications.emails.registration-confirmation', [
                'newUser' => $this->user,
                'duplicateUsers' => $this->getDuplicateUsers(),
            ]);
    }

    /**
     * Determine possible duplicate users.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getDuplicateUsers()
    {
        return User::where('firstname', 'ilike', "%{$this->user->firstname}%")
            ->where('lastname', 'ilike', "%{$this->user->lastname}%")
            ->where('id', '!=', $this->user->id)
            ->get();
    }
}
