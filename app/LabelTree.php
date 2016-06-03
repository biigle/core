<?php

namespace Dias;

use DB;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;

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
     * Validation rules for creating a new label tree.
     *
     * @var array
     */
    public static $createRules = [
        'name'        => 'required|max:256',
        'visibility_id' => 'required|exists:visibilities,id',
    ];

    /**
     * Validation rules for updating a label tree.
     *
     * @var array
     */
    public static $updateRules = [
        'name'        => 'filled|max:256',
        'description' => 'filled',
        'visibility_id' => 'exists:visibilities,id',
    ];

    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'pivot',
    ];

    /**
     * Scope a query to public label trees
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePublic($query)
    {
        return $query->where('visibility_id', Visibility::$public->id);
    }

    /**
     * Scope a query to private label trees
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePrivate($query)
    {
        return $query->where('visibility_id', Visibility::$private->id);
    }

    /**
     * The visibility of the label tree
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function visibility()
    {
        return $this->belongsTo('Dias\Visibility');
    }

    /**
     * The members of this label tree. Every member has a tree-specific role.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function members()
    {
        return $this->belongsToMany('Dias\User')
            ->select('id', 'firstname', 'lastname')
            ->withPivot('role_id as role_id');
    }

    /**
     * The labels that belong to this tree
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function labels()
    {
        return $this->hasMany('Dias\Label');
    }

    /**
     * Determines if the label tree can be safely deleted
     *
     * A label tree can be safely deleted if none if its labels is in use.
     *
     * @return bool
     */
    public function canBeDeleted()
    {
        return !AnnotationLabel::join('labels', 'annotation_labels.label_id', '=', 'labels.id')
            ->where('labels.label_tree_id', $this->id)
            ->exists();
    }

    /**
     * Add a new member with a certain role (either admin or editor)
     *
     * @param User $user
     * @param Role $role
     */
    public function addMember(User $user, Role $role)
    {
        if ($role->id !== Role::$admin->id && $role->id !== Role::$editor->id) {
            abort(400, 'Label tree members can only have the admin or the editor role. '.$role->name.' was given.');
        }

        try {
            $this->members()->attach($user->id, ['role_id' => $role->id]);
        } catch (QueryException $e) {
            abort(400, 'The user is already member of this label tree.');
        }
    }

    /**
     * Determines if a member can be removed
     *
     * A member can be removed if at least one admin member remains afterwards.
     *
     * @param User $member
     * @return bool
     */
    public function memberCanBeRemoved(User $member)
    {
        return $this->members()
            ->where('label_tree_user.role_id', Role::$admin->id)
            ->where('id', '!=', $member->id)
            ->exists();
    }

    /**
     * The projects that are using this label tree
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function projects()
    {
        return $this->belongsToMany('Dias\Project');
    }

    /**
     * The projects that are authorized to use this private label tree
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function authorizedProjects()
    {
        return $this->belongsToMany('Dias\Project', 'label_tree_authorized_project');
    }

    /**
     * Detaches all projects that are not among the authorized projects
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
