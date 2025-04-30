<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\Http\Requests\IndexVolumeAnnotationsSimilarity;

class SortAnnotationsBySimilarityController extends Controller
{
    /**
     * Sort annotations with specific label by similarity.
     *
     * @api {get} volumes/:id/annotations/sort/similarity Sort annotations with the same label by similarity
     * @apiGroup Volumes
     * @apiName ShowVolumesAnnotationsSortSimilarity
     * @apiParam {Number} id The volume ID
     * @apiParam (Required arguments) {Number} label_id The Label ID
     * @apiParam (Required arguments) {Number} annotation_id The reference annotation to sort by similarity
     * @apiPermission projectMember
     * @apiDescription Returns a list of image/video annotation IDs with the most similar first (without the reference annotation ID).
     *
     * @param  IndexVolumeAnnotationsSimilarity  $request
     */
    public function index(IndexVolumeAnnotationsSimilarity $request)
    {
        $r = $request->reference;

        if ($request->volume->isVideoVolume()) {
            $query = VideoAnnotationLabelFeatureVector::where('volume_id', $r->volume_id)
                ->where('label_id', $r->label_id)
                ->where('id', '!=', $r->id)
                ->orderByRaw('vector <=> ?, annotation_id DESC', [$r->vector]);
        } else {
            $query = ImageAnnotationLabelFeatureVector::where('volume_id', $r->volume_id)
                ->where('label_id', $r->label_id)
                ->where('id', '!=', $r->id)
                ->orderByRaw('vector <=> ?, annotation_id DESC', [$r->vector]);
        }

        return $query->pluck('annotation_id')
            // Use distinct/unique *after* fetchig from the DB because otherwise the
            // vector would need to be selected, too (order by expressions must appear in
            // the select list). But we don't want to get the huge vectors.
            ->unique()
            ->values();
    }
}
