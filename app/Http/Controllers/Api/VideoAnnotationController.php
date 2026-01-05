<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreVideoAnnotation;
use Biigle\Http\Requests\UpdateVideoAnnotation;
use Biigle\Jobs\TrackObject;
use Biigle\Label;
use Biigle\Services\LabelBot\LabelBotService;
use Biigle\Video;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use Cache;
use DB;
use Exception;
use Generator;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Queue;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class VideoAnnotationController extends Controller
{
    /**
     * Shows a list of all annotations of the specified video.
     *
     * @api {get} videos/:id/annotations Get all video annotations
     * @apiGroup Videos
     * @apiName IndexVideoAnnotations
     * @apiPermission projectMember
     * @apiDescription If there is an active annotation session for the volume of this video, only those annotations will be returned that the user is allowed to access.
     *
     * @apiParam {Number} id The video ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "created_at": "2015-02-18 11:45:00",
     *       "updated_at": "2015-02-18 11:45:00",
     *       "video_id": 1,
     *       "shape_id": 1,
     *       "frames": [10.0, 15.0]
     *       "points": [[100, 200],[200, 300]],
     *       "labels": [
     *          {
     *             "id": 1,
     *             "label": {
     *                "color": "bada55",
     *                "id": 3,
     *                "name": "My label",
     *                "parent_id": null,
     *             },
     *             "user": {
     *                "id": 4,
     *                "firstname": "Graham",
     *                "lastname": "Hahn",
     *             }
     *          }
     *       ]
     *    }
     * ]
     *
     * @param Request $request
     * @param int $id Video id
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function index(Request $request, $id)
    {
        $video = Video::findOrFail($id);
        $this->authorize('access', $video);

        $user = $request->user();
        $session = $video->volume->getActiveAnnotationSession($user);
        $load = ['labels.label', 'labels.user'];

        // Prevent exceeding memory limit by using generator and stream
        if ($session) {
            $yieldAnnotations = $session->getVolumeFileAnnotations($video, $user, $load);
        } else {
            $yieldAnnotations = function () use ($video, $load): Generator {
                foreach ($video->annotations()->with($load)->lazy() as $annotation) {
                    yield $annotation;
                }
            };
        }

        return new StreamedJsonResponse($yieldAnnotations());
    }

    /**
     * Shows a video annotation.
     *
     * @api {get} video-annotations/:id Show a video annotation
     * @apiGroup Videos
     * @apiName SHowVideoAnnotation
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The annotation ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "created_at": "2015-02-18 11:45:00",
     *    "updated_at": "2015-02-18 11:45:00",
     *    "video_id": 1,
     *    "shape_id": 1,
     *    "frames": [10.0, 15.0]
     *    "points": [[100, 200],[200, 300]],
     *    "labels": [
     *       {
     *          "id": 1,
     *          "label": {
     *             "color": "bada55",
     *             "id": 3,
     *             "name": "My label",
     *             "parent_id": null,
     *          },
     *          "user": {
     *             "id": 4,
     *             "firstname": "Graham",
     *             "lastname": "Hahn",
     *          }
     *       }
     *    ]
     * }
     *
     * @param int $id Snnotation id
     * @return mixed
     */
    public function show($id)
    {
        $annotation = VideoAnnotation::findOrFail($id);
        $this->authorize('access', $annotation);
        $annotation->load('labels.label', 'labels.user');

        return $annotation;
    }

    /**
     * Creates a new annotation in the specified video.
     *
     * @api {post} videos/:id/annotations Create a new video annotation
     * @apiGroup VideoAnnotations
     * @apiName StoreVideoAnnotations
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree used by
     * the project to which the video belongs to.
     *
     * @apiParam {Number} id The video ID.
     *
     * @apiParam (Required arguments) {Number} shape_id ID of the shape of the new annotation.
     * @apiParam (Required arguments) {Number} label_id ID of the initial label to be attached to the new annotation.
     * @apiParam (Required arguments) {Number[]} frames Array of the key frame times. Each key frame corresponds to one entry in the points array.
     * @apiParam (Required arguments) {Number[]} points Array of the initial points for each key frame of the annotation. The points array of each key frame is interpreted as alternating x and y coordinates like this `[x1, y1, x2, y2...]`. The interpretation of the points of the different shapes is as follows:
     * **Point:** The first point is the center of the annotation point.
     * **Rectangle:** The first four points are the vertices of the rectangle (in the given order).
     * **Polygon:** Like rectangle with one or more vertices.
     * **LineString:** Like rectangle with one or more vertices.
     * **Circle:** The first point is the center of the circle. The third value of the points array is the radius of the circle. A valid points array of a circle might look like this: `[10, 10, 5]`.
     * **Ellipse:** The four points specify the end points of the semi-major and semi-minor axes of the ellipse in (counter-)clockwise ordering (depending on how the ellipse was drawn). So the first point is the end point of axis 1, the second is the end point of axis 2, the third is the other end point of axis 1 and the fourth is the other end point of axis 2.
     * **WholeFrame:** The points array must be empty for this shape.
     * @apiParam (Optional arguments) {Boolean} track Set to true to start automatic object tracking for the new annotation. This can only be done for single frame point or circle annotations. Poll the show video annotation endpoint to see when the object tracking is finished. On success, the annotation gets additional frames. On failure the annotation is deleted.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * {
     *    "shape_id": 1,
     *    "label_id": 1,
     *    "frames": [1.0, 2.0, 3.0],
     *    "points": [[10, 11], [20, 21], [30, 31]]
     * }
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "video_id": 1,
     *    "shape_id": 1,
     *    "updated_at": "2015-02-18 11:45:00",
     *    "created_at": "2015-02-18 11:45:00",
     *    "frames": [1.0, 2.0, 3.0],
     *    "points": [[10, 11], [20, 21], [30, 31]]
     *    "labels": [
     *       {
     *          "id": 1,
     *          "label": {
     *             "color": "bada55",
     *             "id": 3,
     *             "name": "My label",
     *             "parent_id": null,
     *          },
     *          "user": {
     *             "id": 4,
     *             "firstname": "Graham",
     *             "lastname": "Hahn",
     *          }
     *       }
     *    ]
     * }
     *
     * @param StoreVideoAnnotation $request
     * @return VideoAnnotation
     */
    public function store(StoreVideoAnnotation $request, LabelBotService $labelBotService)
    {
        if ($request->shouldTrack()) {
            $maxJobs = config('videos.track_object_max_jobs_per_user');
            $currentJobs = Cache::get(TrackObject::getRateLimitCacheKey($request->user()->id), 0);

            if ($currentJobs >= $maxJobs) {
                throw new TooManyRequestsHttpException(message: "You already have {$currentJobs} object tracking jobs running. Please wait for one to finish until you submit a new one.");
            }
        }

        $points = $request->input('points', []);

        $annotation = new VideoAnnotation([
            'video_id' => $request->video->id,
            'shape_id' => $request->input('shape_id'),
            'points' => $points,
            'frames' => $request->input('frames'),
        ]);

        try {
            $annotation->validatePoints();
        } catch (Exception $e) {
            throw ValidationException::withMessages(['points' => [$e->getMessage()]]);
        }
        
        $label = $labelBotService->predictLabelForImage($request->video->volume_id, $request, $annotation);

        $this->authorize('attach-label', [$annotation, $label]);

        $annotation = DB::transaction(function () use ($annotation, $request, $label) {
            $annotation->save();
            VideoAnnotationLabel::create([
                'label_id' => $label->id,
                'user_id' => $request->user()->id,
                'annotation_id' => $annotation->id,
            ]);

            return $annotation;
        });

        if ($request->shouldTrack()) {
            $queue = config('videos.track_object_queue');
            Queue::pushOn($queue, new TrackObject($annotation, $request->user()));
            Cache::increment(TrackObject::getRateLimitCacheKey($request->user()->id));
            /** @phpstan-ignore property.notFound */
            $annotation->trackingJobLimitReached = $currentJobs === ($maxJobs - 1);
        }

        $annotation->load('labels.label', 'labels.user');

        return $annotation;
    }

    /**
     * Updates the video annotation
     *
     * @api {put} video-annotations/:id Update an annotation
     * @apiGroup VideoAnnotations
     * @apiName UpdateVideoAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The video annotation ID.
     * @apiParam (Required attributes) {Number[]} points Array of new points of the annotation. The new points will replace the old points. See the "Create a new video annotation" endpoint for how the points are interpreted for different shapes.
     * @apiParam (Required attributes) {Number[]} frames Array of new key frames of the annotation. The new key frames will replace the old key frames.
     *
     * @apiParamExample {json} Request example (JSON):
     * {
     *    "points": [[10, 11], [20, 21]],
     *    "frames": [5.0, 10.]
     * }
     *
     * @param UpdateVideoAnnotation $request
     */
    public function update(UpdateVideoAnnotation $request)
    {
        // from a JSON request, the array may already be decoded
        $points = $request->input('points', []);

        if (is_string($points)) {
            $points = json_decode($points);
        }

        $request->annotation->points = $points;
        $request->annotation->frames = $request->input('frames');

        try {
            $request->annotation->validatePoints();
        } catch (Exception $e) {
            throw ValidationException::withMessages(['points' => [$e->getMessage()]]);
        }

        $request->annotation->save();
    }

    /**
     * Removes a video annotation.
     *
     * @api {delete} video-annotations/:id Delete a video annotation
     * @apiGroup VideoAnnotations
     * @apiName DestroyVideoAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     *
     * @param  int  $id
     */
    public function destroy($id)
    {
        $annotation = VideoAnnotation::findOrFail($id);
        $this->authorize('destroy', $annotation);
        $annotation->delete();
    }
}
