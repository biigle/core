<?php

namespace Biigle;

use Biigle\Contracts\Annotation as AnnotationContract;
use Biigle\Traits\HasPointsAttribute;
use DB;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * An image annotation is a region of an image that can be labeled by the users.
 * It consists of one or many points and has a specific shape.
 *
 * @property int $id
 * @property array $points
 * @property string $created_at
 * @property int $shape_id
 */
abstract class Annotation extends Model implements AnnotationContract
{
    use HasPointsAttribute, HasFactory;

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'pivot',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'points' => 'array',
    ];

    /**
     * Scope a query to only include annotations that are visible for a certain user.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @param User $user The user to whom the restrictions should apply ('own' user)
     *
     * @return \Illuminate\Database\Query\Builder
     */
    public function scopeVisibleFor($query, User $user)
    {
        if ($user->can('sudo')) {
            return $query;
        }

        $table = $this->getTable();

        return $query->whereIn("{$table}.id", function ($query) use ($user, $table) {
            $ownerKeyName = $this->file()->getQualifiedOwnerKeyName();
            $ownerTable = explode('.', $ownerKeyName)[0];
            $foreignKeyName = $this->file()->getQualifiedForeignKeyName();

            $query->select("{$table}.id")
                ->from($table)
                ->join($ownerTable, $ownerKeyName, '=', $foreignKeyName)
                ->join('project_volume', 'project_volume.volume_id', '=', "{$ownerTable}.volume_id")
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
     * @param \Illuminate\Database\Query\Builder $query
     * @param Label $label
     *
     * @return \Illuminate\Database\Query\Builder
     */
    public function scopeWithLabel($query, Label $label)
    {
        $foreignKeyName = $this->labels()->getQualifiedForeignKeyName();
        $foreignTable = explode('.', $foreignKeyName)[0];
        $parentKeyName = $this->labels()->getQualifiedParentKeyName();
        $table = $this->getTable();

        return $query->join($foreignTable, $foreignKeyName, '=', $parentKeyName)
            ->where("{$foreignTable}.label_id", $label->id)
            ->select("{$table}.*");
    }

    /**
     * Scope a query to only include annotations allowed by the session for the user.
     *
     * @param \Illuminate\Database\Query\Builder $query
     * @param AnnotationSession $session
     * @param User $user The user to whom the restrictions should apply ('own' user)
     * @return \Illuminate\Database\Query\Builder
     */
    public function scopeAllowedBySession($query, AnnotationSession $session, User $user)
    {
        $table = $this->getTable();

        if ($session->hide_own_annotations && $session->hide_other_users_annotations) {

            // take only annotations of this session
            $query->where("{$table}.created_at", '>=', $session->starts_at)
                ->where("{$table}.created_at", '<', $session->ends_at)
                // which have at least one label of the current user
                ->whereExists(function ($query) use ($user) {
                    $foreignKeyName = $this->labels()->getQualifiedForeignKeyName();
                    $foreignTable = explode('.', $foreignKeyName)[0];
                    $parentKeyName = $this->labels()->getQualifiedParentKeyName();

                    $query->select(DB::raw(1))
                        ->from($foreignTable)
                        ->whereRaw("{$foreignKeyName} = {$parentKeyName}")
                        ->where("{$foreignTable}.user_id", $user->id);
                });
        } elseif ($session->hide_own_annotations) {
            $query->where(function ($query) use ($session, $user, $table) {
                // take all annotations of this session
                $query->where("{$table}.created_at", '>=', $session->starts_at)
                    ->where("{$table}.created_at", '<', $session->ends_at)
                    // or older annotations with at least one label of another user
                    ->orWhereExists(function ($query) use ($user) {
                        $foreignKeyName = $this->labels()->getQualifiedForeignKeyName();
                        $foreignTable = explode('.', $foreignKeyName)[0];
                        $parentKeyName = $this->labels()->getQualifiedParentKeyName();

                        $query->select(DB::raw(1))
                            ->from($foreignTable)
                            ->whereRaw("{$foreignKeyName} = {$parentKeyName}")
                            ->where("{$foreignTable}.user_id", '!=', $user->id);
                    });
            });
        } elseif ($session->hide_other_users_annotations) {

            // take only annotations with labels of the current user
            $query->whereExists(function ($query) use ($user) {
                $foreignKeyName = $this->labels()->getQualifiedForeignKeyName();
                $foreignTable = explode('.', $foreignKeyName)[0];
                $parentKeyName = $this->labels()->getQualifiedParentKeyName();

                $query->select(DB::raw(1))
                    ->from($foreignTable)
                    ->whereRaw("{$foreignKeyName} = {$parentKeyName}")
                    ->where("{$foreignTable}.user_id", $user->id);
            });
        }

        return $query;
    }

    /**
     * The file, this annotation belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<covariant VolumeFile, covariant Annotation>
     */
    abstract public function file();

    /**
     * The labels, this annotation got assigned by the users.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<covariant AnnotationLabel, $this>
     */
    abstract public function labels();

    /**
     * Get the file_id attribute
     *
     * @return int
     */
    abstract public function getFileIdAttribute();

    /**
     * The shape of this annotation.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Shape, $this>
     */
    public function shape()
    {
        return $this->belongsTo(Shape::class);
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
    public function getFile(): VolumeFile
    {
        return $this->file;
    }
}
