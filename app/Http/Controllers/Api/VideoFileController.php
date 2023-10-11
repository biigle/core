<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Video;
use Exception;
use FileCache;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class VideoFileController extends Controller
{
    /**
     * Get a video file.
     *
     * @api {get} videos/:id/file Get a video file
     * @apiGroup Videos
     * @apiName ShowVideoFile
     * @apiParam {Number} id The video ID.
     * @apiPermission projectMember
     * @apiDescription This endpoint supports the `Range` header. If the video has a remote source, this endpoint redirects to the remote URL, instead. Returns a HTTP code 428 if the video has not been processed yet.
     *
     * @param Request $request
     * @param int $id
     *
     * @return mixed
     */
    public function show(Request $request, $id)
    {
        $video = Video::with('volume')->findOrFail($id);
        $this->authorize('access', $video);

        if (!$video->hasBeenProcessed()) {
            abort(Response::HTTP_PRECONDITION_REQUIRED);
        }

        if ($video->volume->isRemote()) {
            return redirect($video->url);
        }

        [$disk, $path] = explode('://', $video->volume->url);

        try {
            $disk = Storage::disk($disk);
        } catch (InvalidArgumentException $e) {
            abort(Response::HTTP_NOT_FOUND);
        }

        if ($disk->providesTemporaryUrls()) {
            return redirect($disk->temporaryUrl("{$path}/{$video->filename}", now()->addDay()));
        }

        try {
            $response = $disk->response("{$path}/{$video->filename}");
        } catch (Exception $e) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $response->headers->set('Accept-Ranges', 'bytes');

        $range = $this->getByteRange($video, $request);

        if (!empty($range)) {
            // Range requests:
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests
            $offset = $range[0];
            $length = $range[1] - $range[0] + 1;
            $total = $video->size;
            $response->headers->set('Content-Length', $length);
            $response->headers->set('Content-Range', 'bytes '.implode('-', $range).'/'.$total);
            $response->setStatusCode(206);

            // This overrides the default streamed response callback.
            $response->setCallback(function () use ($video, $offset, $length) {
                FileCache::get($video, function ($video, $path) use ($offset, $length) {
                    $stream = fopen($path, 'r');
                    $chunkSize = 1024;
                    fseek($stream, $offset);
                    // Read the file in chunks because the whole requested range may not
                    // fit in memory.
                    while ($length > $chunkSize) {
                        echo fread($stream, $chunkSize);
                        $length -= $chunkSize;
                    }
                    if ($length > 0) {
                        echo fread($stream, $length);
                    }
                    fclose($stream);
                });
            });
        }

        return $response;
    }

    /**
     * Determine the byte range that should be included in the response.
     *
     * @param Video $video
     * @param Request $request
     *
     * @return array Array containing start and stop byte positions.
     */
    protected function getByteRange(Video $video, Request $request)
    {
        $range = [];
        $header = explode('=', $request->headers->get('Range'));

        if ($header[0] === 'bytes' && count($header) === 2) {
            if (strpos($header[1], ',') !== false) {
                // Multipart responses are not supported.
                return [];
            }

            $range = array_map('intval', explode('-', trim($header[1])));

            if ($range[1] === 0) {
                $range[1] = $video->size - 1;
            }
        }

        return $range;
    }
}
