<?php

namespace Biigle\Http\Controllers\Api;

use App;
use Queue;
use Storage;
use Biigle\Video;
use Biigle\Project;
use Ramsey\Uuid\Uuid;
use GuzzleHttp\Client;
use Biigle\Jobs\ProcessNewVideo;
use Biigle\Http\Requests\StoreVideo;
use Biigle\Http\Controllers\Api\Controller;

class ProjectVideoController extends Controller
{
    /**
     * Shows a list of all videos belonging to the specified project.
     *
     * @api {get} projects/:id/videos Get all videos
     * @apiGroup Projects
     * @apiName IndexProjectVideos
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "uuid": "aa499e5b-6734-3148-82f2-7a16a8c6fb38",
     *       "name": "video 1",
     *       "project_id": 1,
     *       "creator_id": 7,
     *       "created_at": "2020-05-14 15:21:00",
     *       "updated_at":"2020-05-14 15:21:00",
     *       "url": "local://videos/1.mp4",
     *       "duration": 60,
     *       "gis_link": null,
     *       "doi": null
     *    }
     * ]
     *
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        return Video::where('project_id', $project->id)->get();
    }

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
     * @apiParam (Required attributes) {String} url The URL of the video files. Must be a path to a storage disk like `local://videos/1.mp4` or a remote URL like `https://myhost.tld/videos/1.mp4`. Supported video formats are MP4 (H.264) and WebM.
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
            'creator_id' => $request->user()->id,
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
        $queue = config('videos.process_new_video_queue');
        Queue::pushOn($queue, new ProcessNewVideo($video));

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
