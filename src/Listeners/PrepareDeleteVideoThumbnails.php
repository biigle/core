<?php

namespace Biigle\Modules\Videos\Listeners;

use Queue;
use Biigle\Modules\Videos\Events\VideoDeleted;
use Biigle\Modules\Videos\Jobs\DeleteVideoThumbnails;

class PrepareDeleteVideoThumbnails
{
    /**
      * Handle the event.
      *
      * @param  VideoDeleted  $event
      * @return void
      */
    public function handle(VideoDeleted $event)
    {
        Queue::push(new DeleteVideoThumbnails($event->video));
    }
}
