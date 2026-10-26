<?php

namespace Biigle\Traits;

use DB;

trait ComputesAnnotationStatistics
{
    /**
     * Compute the annotation statistics of image or video volumes.
     *
     * The statistics are derived from the same join of annotations, annotation labels
     * and files. The join is computed only once (as materialized CTE) and all
     * statistics are fetched with a single query.
     *
     * @param string $type 'image' or 'video'
     * @param callable $restrict Receives the base query and restricts it to the volumes
     * of the statistics (e.g. with a where on "{$type}s.volume_id").
     *
     * @return array
     */
    protected function getAnnotationStatistics(string $type, callable $restrict): array
    {
        $baseQuery = DB::table("{$type}_annotations")
            ->join("{$type}_annotation_labels", "{$type}_annotation_labels.annotation_id", '=', "{$type}_annotations.id")
            ->join("{$type}s", "{$type}s.id", '=', "{$type}_annotations.{$type}_id");

        $restrict($baseQuery);

        $baseQuery
            ->select(
                "{$type}s.id as file_id",
                "{$type}s.volume_id",
                "{$type}_annotation_labels.label_id",
                "{$type}_annotation_labels.user_id",
            )
            ->selectRaw("to_char({$type}_annotations.created_at, 'YYYY-MM') as yearmonth");

        $fullname = "concat(users.firstname, ' ', users.lastname)";

        $statistics = DB::selectOne("
            WITH base AS MATERIALIZED ({$baseQuery->toSql()}),
            file_labels AS MATERIALIZED (SELECT DISTINCT file_id, label_id FROM base)
            SELECT
                (SELECT count(DISTINCT file_id) FROM file_labels) AS annotated_files,
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
                ) AS annotation_labels,
                (
                    -- Labels that are attached to annotations of the same file. Each
                    -- pair is listed once, keyed by the smaller label ID.
                    SELECT json_object_agg(t.source, t.targets ORDER BY t.source)
                    FROM (
                        SELECT a.label_id AS source, array_agg(DISTINCT b.label_id ORDER BY b.label_id) AS targets
                        FROM file_labels a
                        JOIN file_labels b ON a.file_id = b.file_id AND a.label_id < b.label_id
                        GROUP BY a.label_id
                    ) t
                ) AS source_target_labels
        ", $baseQuery->getBindings());

        return [
            'annotatedFiles' => $statistics->annotated_files,
            'annotationLabels' => collect(json_decode($statistics->annotation_labels ?? '[]')),
            'annotationTimeSeries' => collect(json_decode($statistics->annotation_time_series ?? '[]')),
            // Decode as array so the label IDs are integer keys.
            'sourceTargetLabels' => collect(json_decode($statistics->source_target_labels ?? '[]', true)),
            'volumeAnnotations' => collect(json_decode($statistics->volume_annotations ?? '[]')),
        ];
    }
}
