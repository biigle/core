<?php

namespace Biigle;

use DB;
use Exception;
use Illuminate\Database\Eloquent\Model;

/**
 * A label tree is a group of labels. Projects can choose to used different label trees,
 * which are then offered for labeling things in the project.
 * Label trees have admins and editors as members. Editors can add and delete labels.
 * Admins can also manage members and modify the tree (name, visibility etc).
 * Label trees can be public or private. Private trees maintain a list of projects
 * that are authorized to use the tree. This list is maintained by label tree admins.
 */
class LabelTree extends Model
{
    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'pivot',
        'uuid',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'visibility_id' => 'int',
    ];

    /**
     * Check if a member can loose their admin status.
     *
     * @param User $member
     * @return bool
     */
    public function memberCanLooseAdminStatus(User $member)
    {
        return $this->members()
            ->wherePivot('role_id', Role::$admin->id)
            ->where('id', '!=', $member->id)
            ->exists();
    }

    /**
     * Scope a query to public label trees.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePublicTrees($query)
    {
        return $query->where('visibility_id', Visibility::$public->id);
    }

    /**
     * Scope a query to private label trees.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePrivateTrees($query)
    {
        return $query->where('visibility_id', Visibility::$private->id);
    }

    /**
     * Scope a query to all trees that are accessible by a user.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param User $user
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeAccessibleBy($query, User $user)
    {
        if ($user->can('sudo')) {
            return $query;
        }

        return $query->where(function ($query) use ($user) {
            $query->where('label_trees.visibility_id', Visibility::$public->id)
                // Do it like this instead of a join with label_tree_user because
                // there can be global label trees without any members, too!
                ->orWhere(function ($query) use ($user) {
                    $query->whereIn('id', function ($query) use ($user) {
                        $query->select('label_tree_id')
                            ->from('label_tree_user')
                            ->where('user_id', $user->id);
                    });
                })
                // If the user is member of a project where the label tree is
                // used, they may access it as well, even if they are no member
                // of the label tree.
                ->orWhere(function ($query) use ($user) {
                    $query->whereIn('id', function ($query) use ($user) {
                        $query->select('label_tree_project.label_tree_id')
                            ->from('label_tree_project')
                            ->join('project_user', 'project_user.project_id', '=', 'label_tree_project.project_id')
                            ->where('project_user.user_id', $user->id);
                    });
                });
        });
    }

    /**
     * The visibility of the label tree.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function visibility()
    {
        return $this->belongsTo(Visibility::class);
    }

    /**
     * The members of this label tree. Every member has a tree-specific role.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function members()
    {
        return $this->belongsToMany(User::class)
            ->select('id', 'firstname', 'lastname')
            ->withPivot('role_id as role_id');
    }

    /**
     * The labels that belong to this tree.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function labels()
    {
        return $this->hasMany(Label::class)->orderBy('name');
    }

    /**
     * Determines if the label tree can be safely deleted.
     *
     * A label tree can be safely deleted if none if its labels is in use.
     *
     * @return bool
     */
    public function canBeDeleted()
    {
        return !AnnotationLabel::join('labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->where('labels.label_tree_id', $this->id)
            ->exists()
            && !ImageLabel::join('labels', 'image_labels.label_id', '=', 'labels.id')
            ->where('labels.label_tree_id', $this->id)
            ->exists();
    }

    /**
     * Add a new member with a certain role.
     *
     * @param User|id $user
     * @param Role|int $role
     */
    public function addMember($user, $role)
    {
        if ($user instanceof User) {
            $user = $user->id;
        }

        if ($role instanceof Role) {
            $role = $role->id;
        }

        $this->members()->attach($user, ['role_id' => $role]);
    }

    /**
     * Update a member (role).
     *
     * @param User|int $user
     * @param Role|int $role
     */
    public function updateMember($user, $role)
    {
        if ($user instanceof User) {
            $user = $user->id;
        }

        if ($role instanceof Role) {
            $role = $role->id;
        }

        $this->members()->updateExistingPivot($user, ['role_id' => $role]);
    }

    /**
     * Determines if a member can be removed.
     *
     * A member can be removed if at least one admin member remains afterwards.
     *
     * @param User $member
     * @return bool
     */
    public function memberCanBeRemoved(User $member)
    {
        return $this->memberCanLooseAdminStatus($member);
    }

    /**
     * The projects that are using this label tree.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function projects()
    {
        return $this->belongsToMany(Project::class);
    }

    /**
     * The projects that are authorized to use this private label tree.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function authorizedProjects()
    {
        return $this->belongsToMany(Project::class, 'label_tree_authorized_project');
    }

    /**
     * Detaches all projects that are not among the authorized projects.
     */
    public function detachUnauthorizedProjects()
    {
        // use DB directly so this can be done in a single query
        DB::table('label_tree_project')
            ->where('label_tree_id', $this->id)
            ->whereNotIn('project_id', function ($query) {
                $query->select('project_id')
                    ->from('label_tree_authorized_project')
                    ->where('label_tree_id', $this->id);
            })->delete();
    }
}
