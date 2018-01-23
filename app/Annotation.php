<?php

namespace Biigle;

use DB;
use Exception;
use Illuminate\Database\Eloquent\Model;

/**
 * An annotation is a region of an image that can be labeled by the users.
 * It consists of one or many points and has a specific shape.
 */
class Annotation extends Model
{
    /**
     * Validation rules for attaching a label to a annotation.
     *
     * @var array
     */
    public static $attachLabelRules = [
        'label_id'    => 'required|exists:labels,id',
        'confidence'  => 'required|numeric|between:0,1',
    ];

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
        if ($user->isAdmin) {
            return $query;
        }

        // A user should see all annotations of all images they have access to,
        // even if they belong to another project.

        return $query->join('images', 'images.id', '=', 'annotations.image_id')
            ->join('project_volume', 'project_volume.volume_id', '=', 'images.volume_id')
            ->whereIn('project_volume.project_id', function ($query) use ($user) {
                $query->select('project_id')
                    ->from('project_user')
                    ->where('user_id', $user->id);
            })
            ->select('annotations.*');
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
        // TODO this should become simpler with the new project_volume_id

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
     * Validates a points array for the shape of this annotation.
     *
     * @param array $points Points array like `[x1, y1, x2, y2, x3, y3, ...]`
     * @throws Exception If the points array is invalid
     */
    public function validatePoints(array $points)
    {
        // check if all elements are integer
        $valid = array_reduce($points, function ($carry, $point) {
            return $carry && (is_float($point) || is_int($point));
        }, true);

        if (!$valid) {
            throw new Exception('Point coordinates must be of type float or integer.');
        }

        $size = sizeof($points);

        switch ($this->shape_id) {
            case Shape::$pointId:
                $valid = $size === 2;
                break;
            case Shape::$circleId:
                $valid = $size === 3;
                break;
            case Shape::$ellipseId:
            case Shape::$rectangleId:
                $valid = $size === 8;
                break;
            default:
                $valid = $size > 0 && $size % 2 === 0;
        }

        if (!$valid) {
            throw new Exception('Invalid number of points for shape '.$this->shape->name.'!');
        }
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
     * Round the floats of the points array to 2 decimals before saving.
     *
     * This is a more than sufficient precision for annotation point coordinates and
     * saves memory in the DB as well as when processing the annotations in PHP.
     *
     * @param array $points
     */
    public function setPointsAttribute(array $points)
    {
        $points = array_map(function ($coordinate) {
            return round($coordinate, 2);
        }, $points);

        $this->attributes['points'] = json_encode($points);
    }
}
