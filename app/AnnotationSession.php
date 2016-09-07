<?php

namespace Dias;

use DB;
use Illuminate\Database\Eloquent\Model;

/**
 * An annotation session groups multiple annotations of a transect based on their
 * creation date.
 */
class AnnotationSession extends Model
{
    /**
     * Validation rules for updating an annotation session.
     *
     * @var array
     */
    public static $storeRules = [
        'name' => 'required',
        'starts_at' => 'required|date',
        'ends_at' => 'required|date|after:starts_at',
        'hide_other_users_annotations' => 'filled|boolean',
        'hide_own_annotations' => 'filled|boolean',
    ];

    /**
     * Validation rules for updating an annotation session.
     *
     * @var array
     */
    public static $updateRules = [
        'name' => 'filled',
        'starts_at' => 'filled|date',
        'ends_at' => 'filled|date',
        'hide_other_users_annotations' => 'filled|boolean',
        'hide_own_annotations' => 'filled|boolean',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'starts_at' => 'date',
        'ends_at' => 'date',
        'hide_other_users_annotations' => 'boolean',
        'hide_own_annotations' => 'boolean',
        'transect_id' => 'int',
    ];

    /**
     * The transect, this annotation session belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function transect()
    {
        return $this->belongsTo('Dias\Transect');
    }

    /**
     * Get the annotations of the image (with labels), filtered by the restrictions of this annotation session
     *
     * @param Image $image The image to get the annotations from
     * @param User $user The user to whom the restrictions should apply ('own' user)
     *
     * @return Illuminate\Support\Collection
     */
    public function getImageAnnotations(Image $image, User $user)
    {
        $query = $image->annotations();

        if ($this->hide_own_annotations && $this->hide_other_users_annotations) {

            // take only annotations of this session
            $query->where('created_at', '>=', $this->starts_at)
            ->where('created_at', '<', $this->ends_at)
            // which have at least one label of the current user
            ->whereExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                    ->from('annotation_labels')
                    ->whereRaw('annotation_labels.annotation_id = annotations.id')
                    ->where('annotation_labels.user_id', $user->id);
            })
            // hide all annotation labels of other users
            ->with(['labels' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }]);

        } else if ($this->hide_own_annotations) {

            // wrap in single where because the existing query already has conditions
            $query->where(function ($query) use ($user) {
                // take all annotations of this session
                $query->where('created_at', '>=', $this->starts_at)
                ->where('created_at', '<', $this->ends_at)
                // or older annotations with at least one label of another user
                ->orWhereExists(function ($query) use ($user) {
                    $query->select(DB::raw(1))
                        ->from('annotation_labels')
                        ->whereRaw('annotation_labels.annotation_id = annotations.id')
                        ->where('annotation_labels.user_id', '!=', $user->id);
                });
            })
            // take only labels of this session or any labels of other users
            ->with(['labels' => function ($query) use ($user) {
                $query->where('user_id', '!=', $user->id)
                ->orWhere(function ($query) {
                    $query->where('created_at', '>=', $this->starts_at)
                        ->where('created_at', '<', $this->ends_at);
                });
            }]);

        } else if ($this->hide_other_users_annotations) {

            // take only annotations with labels of the current user
            $query->whereExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                    ->from('annotation_labels')
                    ->whereRaw('annotation_labels.annotation_id = annotations.id')
                    ->where('annotation_labels.user_id', $user->id);
            })
            // take only labels of the current user
            ->with(['labels' => function ($query) use ($user) {
                $query->where('user_id', $user->id);
            }]);

        }

        return $query->get();
    }

    /**
     * Check if the given user is allowed to access the annotation if this annotation session is active
     *
     * @param Annotation $annotation
     * @param User $user
     * @return bool
     */
    public function allowsAccess(Annotation $annotation, User $user)
    {
        if ($this->hide_own_annotations && $this->hide_other_users_annotations) {

            return $annotation->created_at >= $this->starts_at &&
                $annotation->created_at < $this->ends_at &&
                $annotation->labels()->where('user_id', $user->id)->exists();

        } else if ($this->hide_own_annotations) {

            return ($annotation->created_at >= $this->starts_at && $annotation->created_at < $this->ends_at) ||
                $annotation->labels()->where('user_id', '!=', $user->id)->exists();

        } else if ($this->hide_other_users_annotations) {

            return $annotation->labels()->where('user_id', $user->id)->exists();

        }

        return true;
    }
}
