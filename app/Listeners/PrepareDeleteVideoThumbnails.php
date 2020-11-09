<?php

namespace Biigle\Listeners;

use Biigle\Events\VideoDeleted;
use Biigle\Jobs\DeleteVideoThumbnails;
use Queue;

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
        $queue = config('videos.delete_video_thumbnails_queue');
        Queue::pushOn($queue, new DeleteVideoThumbnails($event->video));
    }
}
