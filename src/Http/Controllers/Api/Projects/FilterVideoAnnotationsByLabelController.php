<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Generator;
use Biigle\Project;
use Biigle\VideoAnnotation;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;

class FilterVideoAnnotationsByLabelController extends Controller
{
    /**
     * Show all video annotations of the project that have a specific label attached.
     *
     * @api {get} projects/:tid/video-annotations/filter/label/:lid Get video annotations with a label
     * @apiGroup Projects
     * @apiName ShowProjectsVideoAnnotationsFilterLabels
     * @apiParam {Number} pid The project ID
     * @apiParam {Number} lit The Label ID
     * @apiParam (Optional arguments) {Number} take Number of video annotations to return. If this parameter is present, the most recent annotations will be returned first. Default is unlimited.
     * @apiPermission projectMember
     * @apiDescription Returns a map of video annotation IDs to their video UUIDs.
     *
     * @param Request $request
     * @param  int  $pid Project ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $pid, $lid)
    {
        $project = Project::findOrFail($pid);
        $this->authorize('access', $project);
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');

        return VideoAnnotation::join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('videos', 'video_annotations.video_id', '=', 'videos.id')
            ->whereIn('videos.volume_id', function ($query) use ($pid) {
                $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $pid);
            })
            ->where('video_annotation_labels.label_id', $lid)
            ->when(!is_null($take), function ($query) use ($take) {
                return $query->take($take);
            })
            ->select('videos.uuid', 'video_annotations.id')
            ->distinct()
            ->orderBy('video_annotations.id', 'desc')
            ->pluck('videos.uuid', 'video_annotations.id');
    }

    /**
     * Get all video annotations with uuids for a given project
     * 
     * @api {get} 
     * @apiGroup Projects
     * @apiName test
     * @apiParam {Number} id The Project ID
     * @apiPermission user
     * @apiDescription Returns a stream containing the video uuids and their annotation labels of a project
     * 
     * @apiSuccessExample {json} Success response:
     * [{
	 * 	"uuid":"9198ea9c-ef97-4af7-8018-407d16eafb65",
	 * 	"labels":{
	 *			"id":41,
	 *			"annotation_id":41,
	 *			"label_id":14,
	 *			"created_at":"2024-11-13T07:17:54.000000Z",
	 *			"label":{
	 *				"id":14,
	 *				"name":"a",
	 *				"color":"49f2c5",
	 *				}
	 *      }
	 * }]
     * 
     *
     * @param int $id Project ID
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function getProjectsAnnotationLabels($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $annotations = $project->videoVolumes()
            ->join('videos', 'volumes.id', '=', 'videos.volume_id')
            ->join('video_annotations', 'videos.id', '=', 'video_annotations.video_id')
            ->join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->join('labels', 'video_annotation_labels.label_id', '=', 'labels.id')
            ->select(
                'videos.uuid',
                'video_annotation_labels.id as annotation_label_id',
                'video_annotation_labels.annotation_id as annotation_label_annotation_id',
                'video_annotation_labels.created_at as annotation_created_at',
                'video_annotation_labels.label_id',
                'labels.name as label_name',
                'labels.color',
                'labels.label_tree_id'
            );

        $res = function () use ($annotations): Generator {
            foreach ($annotations->lazy() as $a) {
                yield [
                    'uuid' => $a->uuid,
                    'labels' => [
                        'id' => $a->annotation_label_id,
                        'annotation_id' => $a->annotation_label_annotation_id,
                        'label_id' => $a->label_id,
                        'created_at' => $a->annotation_created_at,
                        'label_tree_id' => $a->label_tree_id,
                        'label' => [
                            'id' => $a->label_id,
                            'name' => $a->label_name,
                            'color' => $a->color,
                        ]
                    ],
                ];
            }
        };

        return new StreamedJsonResponse($res());
    }
}
