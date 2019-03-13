<?php

namespace Biigle;

use DB;
use Biigle\Traits\HasPointsAttribute;
use Illuminate\Database\Eloquent\Model;
use Biigle\Contracts\Annotation as AnnotationContract;

/**
 * An annotation is a region of an image that can be labeled by the users.
 * It consists of one or many points and has a specific shape.
 */
class Annotation extends Model implements AnnotationContract
{
    use HasPointsAttribute;

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        // don't display info from the pivot table
        'pivot',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'points' => 'array',
    ];

    /**
     * Scope a query to only include annotations that are visible for a certain user.
     *
     * @param Illuminate\Database\Query\Builder $query
     * @param User $user The user to whom the restrictions should apply ('own' user)
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeVisibleFor($query, User $user)
    {
        if ($user->can('sudo')) {
            return $query;
        }

        return $query->whereIn('annotations.id', function ($query) use ($user) {
            $query->select('annotations.id')
                ->from('annotations')
                ->join('images', 'images.id', '=', 'annotations.image_id')
                ->join('project_volume', 'project_volume.volume_id', '=', 'images.volume_id')
                ->whereIn('project_volume.project_id', function ($query) use ($user) {
                    $query->select('project_id')
                        ->from('project_user')
                        ->where('user_id', $user->id);
                });
        });
    }

    /**
     * Scope a query to only include annotations that have a certain label attached.
     *
     * @param Illuminate\Database\Query\Builder $query
     * @param Label $label
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithLabel($query, Label $label)
    {
        return $query->join('annotation_labels', 'annotation_labels.annotation_id', '=', 'annotations.id')
            ->where('annotation_labels.label_id', $label->id)
            ->select('annotations.*');
    }

    /**
     * Scope a query to only include annotations allowed by the session for the user.
     *
     * @param Illuminate\Database\Query\Builder $query
     * @param AnnotationSession $session
     * @param User $user The user to whom the restrictions should apply ('own' user)
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeAllowedBySession($query, AnnotationSession $session, User $user)
    {
        if ($session->hide_own_annotations && $session->hide_other_users_annotations) {

            // take only annotations of this session
            $query->where('annotations.created_at', '>=', $session->starts_at)
                ->where('annotations.created_at', '<', $session->ends_at)
                // which have at least one label of the current user
                ->whereExists(function ($query) use ($user) {
                    $query->select(DB::raw(1))
                        ->from('annotation_labels')
                        ->whereRaw('annotation_labels.annotation_id = annotations.id')
                        ->where('annotation_labels.user_id', $user->id);
                });
        } elseif ($session->hide_own_annotations) {
            $query->where(function ($query) use ($session, $user) {
                // take all annotations of this session
                $query->where('annotations.created_at', '>=', $session->starts_at)
                    ->where('annotations.created_at', '<', $session->ends_at)
                    // or older annotations with at least one label of another user
                    ->orWhereExists(function ($query) use ($user) {
                        $query->select(DB::raw(1))
                            ->from('annotation_labels')
                            ->whereRaw('annotation_labels.annotation_id = annotations.id')
                            ->where('annotation_labels.user_id', '!=', $user->id);
                    });
            });
        } elseif ($session->hide_other_users_annotations) {

            // take only annotations with labels of the current user
            $query->whereExists(function ($query) use ($user) {
                $query->select(DB::raw(1))
                    ->from('annotation_labels')
                    ->whereRaw('annotation_labels.annotation_id = annotations.id')
                    ->where('annotation_labels.user_id', $user->id);
            });
        }

        return $query;
    }

    /**
     * The image, this annotation belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function image()
    {
        return $this->belongsTo(Image::class);
    }

    /**
     * The shape of this annotation.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function shape()
    {
        return $this->belongsTo(Shape::class);
    }

    /**
     * The labels, this annotation got assigned by the users.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function labels()
    {
        return $this->hasMany(AnnotationLabel::class)->with('label', 'user');
    }

    /**
     * {@inheritdoc}
     */
    public function getPoints(): array
    {
        return $this->points;
    }

    /**
     * {@inheritdoc}
     */
    public function getShape(): Shape
    {
        return $this->shape;
    }

    /**
     * {@inheritdoc}
     */
    public function getImage(): Image
    {
        return $this->image;
    }
}
