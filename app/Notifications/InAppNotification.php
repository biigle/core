<?php

namespace Biigle\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * A notification that is displayed through the in-app notification system.
 */
class InAppNotification extends Notification
{
    use Queueable;

    /**
     * Danger notification type.
     *
     * @var string
     */
    const TYPE_DANGER = 'danger';

    /**
     * Warning notification type.
     *
     * @var string
     */
    const TYPE_WARNING = 'warning';

    /**
     * Success notification type.
     *
     * @var string
     */
    const TYPE_SUCCESS = 'success';

    /**
     * Info notification type.
     *
     * @var string
     */
    const TYPE_INFO = 'info';

    /**
     * Title of the notification.
     *
     * @var string
     */
    protected $title;

    /**
     * Message (body) of the notification.
     *
     * @var string
     */
    protected $message;

    /**
     * Notification type.
     *
     * @var string
     */
    protected $type;

    /**
     * Label of the action link.
     *
     * @var string
     */
    protected $action;

    /**
     * Action link (URL).
     *
     * @var string
     */
    protected $actionLink;

    /**
     * Create a new notification instance.
     *
     * @param string $title Title of the notification
     * @param string $message Message (body) of the notification
     * @param string $type Notification type
     * @param string $action Label of the action link
     * @param string $actionLink Action link (URL)
     * @return void
     */
    public function __construct($title, $message, $type = null, $action = null, $actionLink = null)
    {
        $this->title = $title;
        $this->message = $message;
        $this->type = $type;
        $this->action = $action;
        $this->actionLink = $actionLink;
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
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'action' => $this->action,
            'actionLink' => $this->actionLink,
        ];
    }
}
