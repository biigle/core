<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use DB;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;

class SortAnnotationsByOutliersController extends Controller
{
    /**
     * Sort annotations with specific label by outliers.
     *
     * @api {get} projects/:pid/annotations/sort/outliers/:lid Sort annotations with the same label by outliers
     * @apiGroup Projects
     * @apiName ShowProjectsAnnotationsSortOutliers
     * @apiParam {Number} pid The project ID
     * @apiParam {Number} lid The Label ID
     * @apiPermission projectMember
     * @apiDescription Returns a list of image/video annotation IDs with the outliers first. Image annotation IDs are prefixed with `i` (e.g. `i123`) and video annotation IDs are prefixed with `v` (e.g. `v456`).
     *
     * @param  int  $pid Project ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function index($pid, $lid)
    {
        $project = Project::findOrFail($pid);
        $this->authorize('access', $project);

        // This was too complicated with the query builder. Since there is no risk of SQL
        // injection here, we just use raw SQL.
        $sql = <<<SQL
        SELECT "id" FROM (
            (
              SELECT CONCAT('i', "annotation_id") AS id, "vector"
              FROM "image_annotation_label_feature_vectors"
              WHERE "label_id" = :lid AND "volume_id" IN (
                 SELECT "volume_id" FROM "project_volume" WHERE "project_id" = :pid
              )
           )
           UNION
           (
              SELECT CONCAT('v', "annotation_id") AS id, "vector"
              FROM "video_annotation_label_feature_vectors"
              WHERE "label_id" = :lid AND "volume_id" IN (
                 SELECT "volume_id" FROM "project_volume" WHERE "project_id" = :pid
              )
           )
        ) AS "temp"
        ORDER BY "temp"."vector" <=> (
            SELECT AVG("temp2"."vector") FROM (
              SELECT "vector" FROM "image_annotation_label_feature_vectors"
              WHERE "label_id" = :lid AND "volume_id" IN (
                 SELECT "volume_id" FROM "project_volume" WHERE "project_id" = :pid
              )
              UNION ALL
              SELECT "vector" FROM "video_annotation_label_feature_vectors"
              WHERE "label_id" = :lid AND "volume_id" IN (
                 SELECT "volume_id" FROM "project_volume" WHERE "project_id" = :pid
              )
           ) AS temp2
        ) DESC, id DESC
        SQL;

        $ids = DB::select($sql, ['pid' => $pid, 'lid' => $lid]);

        // Filtering unique IDs is not required here because the UNION in the query
        // takes care of that.
        return array_map(fn ($v) => $v->id, $ids);
    }
}
