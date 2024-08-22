<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Largo\Http\Requests\IndexProjectAnnotationsSimilarity;
use DB;

class SortAnnotationsBySimilarityController extends Controller
{
    /**
     * Sort annotations with specific label by similarity.
     *
     * @api {get} projects/:id/annotations/sort/similarity Sort annotations with the same label by similarity
     * @apiGroup Projects
     * @apiName ShowProjectsAnnotationsSortSimilarity
     * @apiParam {Number} id The project ID
     * @apiParam (Required arguments) {Number} label_id The Label ID
     * @apiParam (Required arguments) {Number} image_annotation_id The reference image annotation to sort by similarity. This is not required if `video_annotation_id` is provided.
     * @apiParam (Required arguments) {Number} video_annotation_id The reference video annotation to sort by similarity. This is not required if `image_annotation_id` is provided.
     * @apiPermission projectMember
     * @apiDescription Returns a list of image/video annotation IDs with the most similar first (without the reference annotation ID). Image annotation IDs are prefixed with `i` (e.g. `i123`) and video annotation IDs are prefixed with `v` (e.g. `v456`).
     *
     * @param  IndexProjectAnnotationsSimilarity  $request
     */
    public function index(IndexProjectAnnotationsSimilarity $request)
    {
        $r = $request->reference;

        // This was too complicated with the query builder. Since there is no risk of SQL
        // injection here, we just use raw SQL.
        $sql = <<<SQL
        SELECT "id" FROM (
            (
              SELECT CONCAT('i', "annotation_id") AS id, "vector"
              FROM "image_annotation_label_feature_vectors"
              WHERE "label_id" = :lid AND "annotation_id" != :iid AND "volume_id" IN (
                 SELECT "volume_id" FROM "project_volume" WHERE "project_id" = :pid
              )
           )
           UNION
           (
              SELECT CONCAT('v', "annotation_id") AS id, "vector"
              FROM "video_annotation_label_feature_vectors"
              WHERE "label_id" = :lid AND "annotation_id" != :vid AND "volume_id" IN (
                 SELECT "volume_id" FROM "project_volume" WHERE "project_id" = :pid
              )
           )
        ) AS "temp"
        ORDER BY "temp"."vector" <=> :vector, id DESC
        SQL;

        $ids = DB::select($sql, [
            'pid' => $request->project->id,
            'lid' => $r->label_id,
            'vector' => $r->vector,
            // We need only one at a time but since the ID 0 never exists, we just take
            // it as the other ID.
            'iid' => $request->input('image_annotation_id', 0),
            'vid' => $request->input('video_annotation_id', 0),
        ]);

        // Filtering unique IDs is not required here because the UNION in the query
        // takes care of that.
        return array_map(fn ($v) => $v->id, $ids);
    }
}
