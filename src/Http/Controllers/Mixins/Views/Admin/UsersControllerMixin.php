<?php

namespace Biigle\Modules\Annotations\Http\Controllers\Mixins\Views\Admin;

use Biigle\User;
use Biigle\Annotation;
use Biigle\AnnotationLabel;

class UsersControllerMixin
{
    /**
     * Add project statistics to the view.
     *
     * @param User $user
     *
     * @return array
     */
    public function show(User $user)
    {
        $totalAnnotationLabels = AnnotationLabel::where('user_id', $user->id)->count();

        if ($totalAnnotationLabels > 0) {
            $annotationQuery = Annotation::join('annotation_labels', 'annotations.id', '=', 'annotation_labels.annotation_id')
                ->where('annotation_labels.user_id', $user->id);

            $totalAnnotations = (clone $annotationQuery)->distinct()->count('annotations.id');

            $labelsPerAnnotation = round($totalAnnotationLabels / $totalAnnotations);

            $relativeAnnotationLabels = $totalAnnotationLabels / AnnotationLabel::count();
            $relativeAnnotations = $totalAnnotations / Annotation::count();

            $recentAnnotations = $annotationQuery->orderBy('annotation_labels.created_at', 'desc')
                ->take(10)
                ->select('annotation_labels.created_at', 'annotations.id')
                ->get();
        } else {
            $totalAnnotations = 0;
            $labelsPerAnnotation = 0;
            $relativeAnnotationLabels = 0;
            $relativeAnnotations = 0;
            $recentAnnotations = [];
        }

        return compact('totalAnnotationLabels', 'totalAnnotations', 'labelsPerAnnotation', 'relativeAnnotationLabels', 'relativeAnnotations', 'recentAnnotations');
    }
}
