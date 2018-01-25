<?php

namespace Biigle;

use DB;
use Biigle\Traits\HasMembers;
use Illuminate\Database\Eloquent\Model;

/**
 * A label tree is a group of labels. Projects can choose to use different label trees,
 * which are then offered for labeling things in the project.
 * Label trees have admins and editors as members. Editors can add and delete labels.
 * Admins can also manage members and modify the tree (name, visibility etc).
 * Label trees can be public or private. Private trees maintain a list of projects
 * that are authorized to use the tree. This list is maintained by label tree admins.
 */
class LabelTree extends Model
{
    use HasMembers;

    /**
     * Validation rules for creating a new label tree.
     *
     * @var array
     */
    public static $createRules = [
        'name' => 'required|max:256',
        'visibility_id' => 'required|integer|exists:visibilities,id',
        'project_id' => 'filled|integer|exists:projects,id',
    ];

    /**
     * Validation rules for updating a label tree.
     *
     * @var array
     */
    public static $updateRules = [
        'name' => 'filled|max:256',
        'visibility_id' => 'integer|exists:visibilities,id',
    ];

    /**
     * Validation rules for adding a label tree member.
     *
     * @var array
     */
    public static $addMemberRules = [
        'id' => 'required|integer|exists:users,id',
        'role_id' => 'required|integer|exists:roles,id',
    ];

    /**
     * Validation rules for updating a label tree member.
     *
     * @var array
     */
    public static $updateMemberRules = [
        'role_id' => 'integer|exists:roles,id',
    ];

    /**
     * Validation rules for adding a new authorized project.
     *
     * @var array
     */
    public static $authorizeProjectRules = [
        'id' => 'required|integer|exists:projects,id',
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
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'visibility_id' => 'int',
    ];

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
     * The visibility of the label tree.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function visibility()
    {
        return $this->belongsTo(Visibility::class);
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

    /**
     * Checks if a role ID can be used for a member of this model.
     *
     * @param int $roleId
     * @return bool
     */
    public function isRoleIdValid($roleId)
    {
        return in_array($roleId, [Role::$admin->id, Role::$editor->id]);
    }
}
