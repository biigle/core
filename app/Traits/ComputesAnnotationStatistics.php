<?php

namespace Biigle\Traits;

use DB;

trait ComputesAnnotationStatistics
{
    /**
     * Compute the annotation statistics of image or video volumes.
     *
     * The statistics are derived from the same join of annotations, annotation labels
     * and files. The join is computed only once (as materialized CTE) and the counts
     * are fetched with a single query.
     *
     * @param string $type 'image' or 'video'
     * @param callable $restrict Receives the base query and restricts it to the volumes
     * of the statistics (e.g. with a where on "{$type}s.volume_id").
     *
     * @return array
     */
    protected function getAnnotationStatistics(string $type, callable $restrict)
    {
        $joinQuery = DB::table("{$type}_annotations")
            ->join("{$type}_annotation_labels", "{$type}_annotation_labels.annotation_id", '=', "{$type}_annotations.id")
            ->join("{$type}s", "{$type}s.id", '=', "{$type}_annotations.{$type}_id");

        $restrict($joinQuery);

        $baseQuery = $joinQuery->clone()
            ->select(
                "{$type}s.id as file_id",
                "{$type}s.volume_id",
                "{$type}_annotation_labels.label_id",
                "{$type}_annotation_labels.user_id",
            )
            ->selectRaw("to_char({$type}_annotations.created_at, 'YYYY-MM') as yearmonth");

        $fullname = "concat(users.firstname, ' ', users.lastname)";

        $statistics = DB::selectOne("
            WITH base AS MATERIALIZED ({$baseQuery->toSql()})
            SELECT
                (SELECT count(DISTINCT file_id) FROM base) AS annotated_files,
                (
                    SELECT json_agg(json_build_object('user_id', t.user_id, 'fullname', {$fullname}, 'count', t.count, 'yearmonth', t.yearmonth) ORDER BY t.user_id, t.yearmonth)
                    FROM (SELECT user_id, yearmonth, count(*) FROM base GROUP BY user_id, yearmonth) t
                    LEFT JOIN users ON users.id = t.user_id
                ) AS annotation_time_series,
                (
                    SELECT json_agg(json_build_object('user_id', t.user_id, 'fullname', {$fullname}, 'count', t.count, 'volume_id', t.volume_id) ORDER BY t.user_id, t.volume_id)
                    FROM (SELECT user_id, volume_id, count(*) FROM base GROUP BY user_id, volume_id) t
                    LEFT JOIN users ON users.id = t.user_id
                ) AS volume_annotations,
                (
                    SELECT json_agg(json_build_object('id', labels.id, 'name', labels.name, 'count', t.count, 'color', labels.color) ORDER BY labels.id)
                    FROM (SELECT label_id, count(*) FROM base GROUP BY label_id) t
                    JOIN labels ON labels.id = t.label_id
                ) AS annotation_labels
        ", $baseQuery->getBindings());

        // The label pairs are still computed in PHP from a separate query. This keeps
        // the order of the returned pairs exactly as it was.
        $sourceTargetLabelsRaw = $joinQuery->clone()
            ->select("{$type}s.id", "{$type}_annotation_labels.label_id")
            ->distinct()
            ->get()
            ->groupBy('id');

        $sourceTargetLabels = [];

        foreach ($sourceTargetLabelsRaw as $value) {
            foreach ($value as $label1) {
                foreach ($value as $label2) {
                    if ($label1->label_id === $label2->label_id) {
                        continue;
                    }
                    // set source : target relation
                    $id1 = min($label1->label_id, $label2->label_id);
                    $id2 = max($label1->label_id, $label2->label_id);
                    if (array_key_exists($id1, $sourceTargetLabels)) {
                        // append to end of array $arr[]
                        $sourceTargetLabels[$id1][] = $id2;
                    } else {
                        // first entry
                        $sourceTargetLabels[$id1] = [$id2];
                    }
                }
            }
        }

        $sourceTargetLabels = array_map('array_unique', $sourceTargetLabels);
        $sourceTargetLabels = array_map('array_values', $sourceTargetLabels);

        return [
            'annotatedFiles' => $statistics->annotated_files,
            'annotationLabels' => collect(json_decode($statistics->annotation_labels ?? '[]')),
            'annotationTimeSeries' => collect(json_decode($statistics->annotation_time_series ?? '[]')),
            'sourceTargetLabels' => collect($sourceTargetLabels),
            'volumeAnnotations' => collect(json_decode($statistics->volume_annotations ?? '[]')),
        ];
    }
}
