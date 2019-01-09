<?php

namespace App\Http\Controllers\Api;

use DB;
use App\Video;
use Ramsey\Uuid\Uuid;
use App\Http\Requests\StoreVideo;
use App\Http\Controllers\Controller;

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
