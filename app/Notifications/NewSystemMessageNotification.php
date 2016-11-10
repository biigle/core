<?php

namespace Dias\Notifications;

use Dias\SystemMessage;
use Dias\SystemMessageType;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class NewSystemMessageNotification extends Notification
{
    use Queueable;

    /**
     * The system message
     *
     * @var SystemMessage
     */
    protected $message;

    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct(SystemMessage $message)
    {
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        switch ($this->message->type_id) {
            case SystemMessageType::$important->id:
                $type = InAppNotification::TYPE_WARNING;
                break;
            case SystemMessageType::$update->id:
                $type = InAppNotification::TYPE_SUCCESS;
                break;
            default:
                $type = InAppNotification::TYPE_INFO;
        }

        return [
            'title' => $this->message->title,
            'message' => 'A new system message was just published.',
            'type' => $type,
            'action' => 'Read it here',
            // 'actionLink' => route('system-messages', $message->id),
            'actionLink' => '#',
        ];
    }
}
