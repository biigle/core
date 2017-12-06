<?php

namespace Biigle\Notifications;

use Biigle\SystemMessage;
use Biigle\SystemMessageType;
use Illuminate\Notifications\Notification;

class NewSystemMessageNotification extends InAppNotification
{
    /**
     * Create a new notification instance.
     *
     * @return void
     */
    public function __construct(SystemMessage $message)
    {
        switch ($message->type_id) {
            case SystemMessageType::$important->id:
                $type = InAppNotification::TYPE_WARNING;
                break;
            case SystemMessageType::$update->id:
                $type = InAppNotification::TYPE_SUCCESS;
                break;
            default:
                $type = InAppNotification::TYPE_INFO;
        }

        parent::__construct(
            $message->title,
            'A new system message was just published.',
            $type,
            'Read it here',
            route('system-messages-show', $message->id)
        );
    }
}
