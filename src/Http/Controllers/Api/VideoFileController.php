<?php

namespace Biigle\Modules\Videos\Http\Controllers\Api;

use Storage;
use Illuminate\Http\Request;
use Biigle\Modules\Videos\Video;
use Biigle\Http\Controllers\Api\Controller;
use League\Flysystem\FileNotFoundException;

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
     * @apiDescription This endpoint supports the `Range` header.
     *
     * @param Request $request
     * @param int $id
     *
     * @return mixed
     */
    public function show(Request $request, $id)
    {
        $video = Video::findOrFail($id);
        $this->authorize('access', $video);

        try {
            $response = Storage::disk($video->disk)->response($video->path);
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
            $stream = Storage::disk($video->disk)->readStream($video->path);
            $total = $video->attrs['size'];
            $response->headers->set('Content-Length', $length);
            $response->headers->set('Content-Range', 'bytes '.implode('-', $range).'/'.$total);
            $response->setStatusCode(206);

            // This overrides the default streamed response callback.
            $response->setCallback(function () use ($stream, $offset, $length) {
                $chunkSize = 1024;
                fseek($stream, $offset);
                // Read the file in chunks because the whole requested range may not fit
                // in memory.
                while ($length > $chunkSize) {
                    echo fread($stream, $chunkSize);
                    $length -= $chunkSize;
                }
                echo fread($stream, $length);
                fclose($stream);
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
