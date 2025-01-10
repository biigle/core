<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Arr;
use Biigle\Http\Controllers\Views\Controller;
use Biigle\Video;

class VideoController extends Controller
{
    /**
     * Shows the video index page.
     *
     * @param int $id volume ID
     */
    public function index($id)
    {
        $video = Video::with('volume')->findOrFail($id);

        $this->authorize('access', $video);

        $metadataMap = [
            'gps_altitude' => 'GPS Altitude',
            'distance_to_ground' => 'Distance to ground',
            'yaw' => 'Yaw/Heading',
            'area' => 'Area',
        ];

        return view('volumes.videos.index', [
            'video' => $video,
            'volume' => $video->volume,
            'metadata' => Arr::only($video->metadata, array_keys($metadataMap)),
            'metadataMap' => $metadataMap,
        ]);
    }
}
