<?php

namespace Biigle\Events;

use Biigle\Broadcasting\VolumeChannel;
use Biigle\Volume;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VolumeFilesProcessed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The volume that was processed
     *
     * @var Volume
     */
    public $volume;

    /**
     * Ignore this event if the volume does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new event instance.
     *
     * @param Volume $volume
     *
     */
    public function __construct(Volume $volume)
    {
        $this->volume = $volume;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new VolumeChannel($this->volume);
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->volume->id,
        ];
    }
}
