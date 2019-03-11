<?php

namespace Biigle\Modules\Videos\Http\Controllers\Api;

use App;
use Queue;
use Storage;
use Ramsey\Uuid\Uuid;
use GuzzleHttp\Client;
use Biigle\Modules\Videos\Video;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Videos\Jobs\ProcessNewVideo;
use Biigle\Modules\Videos\Http\Requests\StoreVideo;

class ProjectVideoController extends Controller
{
    /**
     * Creates a new video associated to the specified project.
     *
     * @api {post} projects/:id/videos Create a new video
     * @apiGroup Videos
     * @apiName StoreProjectVideos
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required attributes) {String} name The name of the new video.
     * @apiParam (Required attributes) {String} url The URL of the video files. Must be a path to a storage disk like `local://videos/1.mp4` or a remote URL like `https://myhost.tld/videos/1.mp4`. Supported video formats are WEBM, MP4 and MPEG.
     * @apiParam (Optional attributes) {String} gis_link Link to a GIS that belongs to this video.
     * @apiParam (Optional attributes) {String} doi The DOI of the dataset that is represented by the new video.
     *
     * @apiParamExample {String} Request example:
     * name: 'New video'
     * url: 'local://videos/test-video.mp4'
     * gis_link: 'http://gis.example.com'
     * doi: '10.3389/fmars.2017.00083'
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "name": "New video",
     *    "created_at": "2019-01-17 08:50:00",
     *    "updated_at": "2019-01-17 08.50.00",
     *    "url": "local://videos/test-video.mp4",
     *    "gis_link": "http://gis.example.com",
     *    "doi": "10.3389/fmars.2017.00083"
     * }
     *
     * @param StoreVideo $request
     * @return  mixed
     */
    public function store(StoreVideo $request)
    {
        list($disk, $path) = explode('://', $request->input('url'));

        $video = Video::make([
            'uuid' => Uuid::uuid4(),
            'name' => $request->input('name'),
            'url' => $request->input('url'),
            'project_id' => $request->project->id,
        ]);

        if ($video->isRemote()) {
            list($size, $mime) = $this->getRemoteAttrs($video);
        } else {
            list($size, $mime) = $this->getDiskAttrs($video);
        }

        $video->attrs = [
            'size' => $size,
            'mimetype' => $mime,
            'gis_link' => $request->input('gis_link'),
            'doi' => $request->input('doi'),
        ];
        $video->save();
        Queue::push(new ProcessNewVideo($video));

        if ($this->isAutomatedRequest()) {
            return $video;
        }

        return $this->fuzzyRedirect()
            ->with('message', "Video {$video->name} created")
            ->with('messageType', 'success');
    }

    /**
     * Get the size and mime type of a video from a storage disk.
     *
     * @param Video $video
     *
     * @return array
     */
    protected function getDiskAttrs(Video $video)
    {
        return [
            Storage::disk($video->disk)->size($video->path),
            Storage::disk($video->disk)->mimeType($video->path),
        ];
    }

    /**
     * Get the size and mime type of a video from a remote source.
     *
     * @param Video $video
     *
     * @return array
     */
    protected function getRemoteAttrs(Video $video)
    {
        $client = App::make(Client::class);
        $response = $client->head($video->url);

        return [
            intval($response->getHeaderLine('Content-Length')),
            explode(';', $response->getHeaderLine('Content-Type'))[0],
        ];
    }
}
