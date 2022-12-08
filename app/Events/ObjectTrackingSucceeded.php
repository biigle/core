<?php

namespace Biigle\Events;

use Biigle\User;
use Biigle\VideoAnnotation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ObjectTrackingSucceeded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The user that created the server.
     *
     * @var User
     */
    public $user;

    /**
     * The video annotation that finished tracking.
     *
     * @var VideoAnnotation
     */
    public $annotation;

    /**
     * Create a new event instance.
     *
     * @param VideoAnnotation $annotation
     * @param User $user
     * @return void
     */
    public function __construct(VideoAnnotation $annotation, User $user)
    {
        $this->annotation = $annotation;
        $this->user = $user;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new PrivateChannel("user-{$this->user->id}");
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith()
    {
        return [
            'annotation' => $this->annotation,
        ];
    }
}
