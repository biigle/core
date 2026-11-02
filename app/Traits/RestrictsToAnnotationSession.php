<?php

namespace Biigle\Traits;

use Biigle\Annotation;
use Biigle\AnnotationSession;
use Biigle\User;

trait RestrictsToAnnotationSession
{
    /**
     * Restrict a query of annotation label feature vectors to the annotations that are
     * allowed by the annotation session for the user.
     *
     * @param \Illuminate\Contracts\Database\Query\Builder $query Query of image or video annotation label feature vectors.
     * @param AnnotationSession $session
     * @param User $user
     * @param Annotation $annotation Instance of the annotation model that belongs to the feature vectors.
     */
    protected function restrictFeatureVectorsToSession($query, AnnotationSession $session, User $user, Annotation $annotation): void
    {
        $file = $annotation->file();
        $fileTable = $file->getRelated()->getTable();
        $annotationTable = $annotation->getTable();

        $query->whereIn('annotation_id', function ($query) use ($session, $user, $annotation, $file, $fileTable, $annotationTable) {
            $query->select("{$annotationTable}.id")
                ->from($annotationTable)
                ->join($fileTable, $file->getQualifiedOwnerKeyName(), '=', $file->getQualifiedForeignKeyName())
                ->where("{$fileTable}.volume_id", $session->volume_id);

            $annotation->scopeAllowedBySession($query, $session, $user);
        });

        if ($session->hide_other_users_annotations) {
            // The feature vectors have the same IDs than the annotation labels. Only
            // include annotation labels of the user (like Largo does).
            $labelTable = $annotation->labels()->getRelated()->getTable();
            $query->whereIn('id', function ($query) use ($user, $labelTable) {
                $query->select('id')
                    ->from($labelTable)
                    ->where('user_id', $user->id);
            });
        }
    }
}
