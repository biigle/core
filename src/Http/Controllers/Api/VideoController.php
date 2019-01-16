<?php

namespace Biigle\Modules\Videos\Http\Controllers\Api;

use DB;
use Ramsey\Uuid\Uuid;
use Biigle\Modules\Videos\Video;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Videos\Http\Requests\StoreVideo;

class VideoController extends Controller
{
    /**
     * Upload a new video.
     *
     * @return mixed
     */
    public function store(StoreVideo $request)
    {
        $video = DB::transaction(function () use ($request) {
            $file = $request->file('file');

            $video = Video::create([
                'name' => $request->input('name'),
                'uuid' => Uuid::uuid4(),
                'meta' => [
                    'filename' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mimetype' => $file->getMimeType(),
                ],
            ]);

            $file->storeAs('', $video->uuid, 'videos');

            return $video;
        });

        if (!$request->expectsJson()) {
            return redirect()->route('video', $video->uuid);
        }

        return $video;
    }
}
