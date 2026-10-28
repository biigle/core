<?php

namespace Biigle\Http\Controllers\Api\Labels;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\Label;
use Illuminate\Http\Request;

class ImageAnnotationsController extends Controller
{
    /**
     * Show image annotations of a label.
     *
     * @api {get} labels/:id/image-annotations Get image annotations with a label
     * @apiGroup Labels
     * @apiName ShowLabelImageAnnotations
     * @apiParam {Number} id The Label ID
     * @apiParam (Optional arguments) {Number} take Maximum number of annotations to return.
     * @apiPermission user
     * @apiDescription Returns a map of image annotation IDs to their image UUIDs. Only annotations that are visible to the current user are returned.
     *
     * @param Request $request
     * @param int $id Label ID
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function index(Request $request, $id)
    {
        $label = Label::findOrFail($id);
        $this->validate($request, ['take' => 'integer|min:1']);
        $user = $request->user();

        $visibleVolumeIds = fn ($query) => $query->select('project_volume.volume_id')
            ->from('project_volume')
            ->join('project_user', 'project_user.project_id', '=', 'project_volume.project_id')
            ->where('project_user.user_id', $user->id);

        $annotations = ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
            ->when(!$user->can('sudo'), fn ($query) => $query->whereIn('images.volume_id', $visibleVolumeIds))
            // Use a subquery instead of a join because an annotation can have the same
            // label multiple times. The join would require a DISTINCT which prevents the
            // query from stopping early if "take" is given.
            ->whereIn('image_annotations.id', fn ($query) => $query->select('annotation_id')
                ->from('image_annotation_labels')
                ->where('label_id', $label->id))
            ->when($request->filled('take'), fn ($query) => $query->take($request->input('take')))
            ->select('images.uuid', 'image_annotations.id')
            ->toBase()
            ->lazyByIdDesc(column: 'image_annotations.id', alias: 'id')
            ->mapWithKeys(fn ($annotation) => [$annotation->id => $annotation->uuid])
            // The LazyCollection itself is JsonSerializable and would be encoded at
            // once. The iterator is streamed instead.
            ->getIterator();

        return response()->streamJson($annotations);
    }
}
