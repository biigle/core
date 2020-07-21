<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Video;
use FileCache;
use Illuminate\Http\Request;
use League\Flysystem\FileNotFoundException;
use Storage;

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
     * @apiDescription This endpoint supports the `Range` header. If the video has a remote source, this endpoint redirects to the remote URL, instead.
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

        if ($video->volume->isRemote()) {
            return redirect($video->url);
        }

        [$disk, $path] = explode('://', $video->volume->url);

        try {
            $response = Storage::disk($disk)->response("{$path}/{$video->filename}");
        } catch (FileNotFoundException $e) {
            abort(404);
        }

        $response->headers->set('Accept-Ranges', 'bytes');

        $range = $this->getByteRange($video, $request);

        if (!empty($range)) {
            // Range requests:
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests
            $offset = $range[0];
            $length = $range[1] - $range[0] + 1;
            $total = $video->attrs['size'];
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
                $range[1] = $video->attrs['size'] - 1;
            }
        }

        return $range;
    }
}
