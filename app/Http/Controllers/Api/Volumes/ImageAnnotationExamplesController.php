<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\Label;
use Biigle\Volume;
use Illuminate\Http\Request;

class ImageAnnotationExamplesController extends Controller
{
    /**
     * Show example image annotations of a label or of a similar label if no annotation exists.
     *
     * @api {get} volumes/:vid/image-annotations/examples/:lid Get example image annotations
     * @apiGroup Volumes
     * @apiName ShowVolumesExampleAnnotations
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The Label ID
     * @apiPermission projectMember
     * @apiDescription The similarity is based on the Levenshtein distance between the label names. Only the sibling labels and the parent label are considered. This endpoint returns the image annotations of the specified label or of the most similar sibling/parent label if no annotations exist. Only available for image volumes.
     *
     * @param Request $request
     * @param  int  $vid Volume ID
     * @param int $lid Label ID
     * @return array
     */
    public function index(Request $request, $vid, $lid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);
        $this->validate($request, ['take' => 'integer']);
        $take = $request->input('take');

        $label = Label::findOrFail($lid);

        $user = $request->user();
        $session = $volume->getActiveAnnotationSession($user);

        // Get same, sibling or parent labels that have annotations in the volume.
        $query = Label::join('image_annotation_labels', 'image_annotation_labels.label_id', '=', 'labels.id')
            ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->where('images.volume_id', $vid)
            ->where('labels.label_tree_id', $label->label_tree_id)
            ->where(fn ($query) => $query->where('labels.parent_id', $label->parent_id)->orWhere('labels.id', $label->parent_id))
            ->select('labels.color', 'labels.id', 'labels.name', 'labels.parent_id', 'labels.label_tree_id');

        if ($session) {
            (new ImageAnnotation)->scopeAllowedBySession($query, $session, $user);
        }

        $labelsToCheck = $query->get();

        if ($labelsToCheck->isEmpty()) {
            return [];
        }

        // Determine the label with the most similar name. May be the exact label we
        // requested.
        $closestLabel = null;
        $closestDistance = INF;
        foreach ($labelsToCheck as $l) {
            if ($label->id === $l->id) {
                $closestLabel = $l;
                break;
            }

            $d = levenshtein($label->name, $l->name);
            if ($d < $closestDistance) {
                $closestLabel = $l;
                $closestDistance = $d;
            }
        }

        if ($session) {
            $query = ImageAnnotation::allowedBySession($session, $user);
        } else {
            $query = ImageAnnotation::getQuery();
        }

        // Get the example annotations from the similar label.
        $annotations = $query->join('image_annotation_labels', 'image_annotation_labels.annotation_id', '=', 'image_annotations.id')
            ->join('images', 'images.id', '=', 'image_annotations.image_id')
            ->where('images.volume_id', $vid)
            ->where('image_annotation_labels.label_id', $closestLabel->id)
            ->when(!is_null($take), fn ($query) => $query->orderBy('image_annotations.created_at', 'desc')->take($take))
            ->pluck('images.uuid', 'image_annotations.id');

        return [
            'label' => $closestLabel,
            'annotations' => $annotations,
        ];
    }
}
