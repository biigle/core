<?php

namespace Biigle\Traits;

use Biigle\Volume;
use DB;

trait RestrictsToNewestLabels
{
    /**
     * Callback to be used in a `when` query statement that restricts the results to the
     * newest annotation labels of each annotation.
     *
     * @param $query The query that needs restrictions
     * @param $volume The volume that contains the annotations
     * @param $keepEmptyImgs Boolean indicating whether empty images should be retained
     *
     * @return \Illuminate\Contracts\Database\Query\Builder
     */
    public function restrictToNewestLabelQuery($query, Volume $volume, $keepEmptyImgs = false)
    {
        // The subquery join is the fastest approach I could come up with that can be used
        // as an addition to the existing query (instead of rewiriting the entire query,
        // e.g. with a window function).
        //
        // Previously this was a where/in statement with was much slower.

        if ($volume->isVideoVolume()) {
            $table = 'video_annotation_labels';

            $subquery = DB::table($table)
                ->selectRaw("distinct on (annotation_id) video_annotation_labels.id")
                ->join('video_annotations', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
                ->join('videos', 'videos.id', '=', 'video_annotations.video_id')
                ->where('volume_id', $volume->id)
                ->orderBy('video_annotation_labels.annotation_id', 'desc')
                ->orderBy('video_annotation_labels.id', 'desc')
                ->orderBy('video_annotation_labels.created_at', 'desc');
        } else {
            $table = 'image_annotation_labels';

            $subquery = DB::table($table)
                ->selectRaw("distinct on (annotation_id) image_annotation_labels.id")
                ->join('image_annotations', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
                ->join('images', 'images.id', '=', 'image_annotations.image_id')
                ->where('volume_id', $volume->id)
                ->orderBy('image_annotation_labels.annotation_id', 'desc')
                ->orderBy('image_annotation_labels.id', 'desc')
                ->orderBy('image_annotation_labels.created_at', 'desc');
        }

        return $query
            ->joinSub($subquery, 'latest_labels', function ($join) use ($table, $keepEmptyImgs) {
                $join->on("{$table}.id", '=', 'latest_labels.id')
                    // Add empty images again
                    ->when($keepEmptyImgs, fn ($query) => $query->orWhereNull("{$table}.annotation_id"));
            });
    }
}
