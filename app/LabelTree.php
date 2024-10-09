<?php

namespace Biigle;

use DB;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

/**
 * A label tree is a group of labels. Projects can choose to used different label trees,
 * which are then offered for labeling things in the project.
 * Label trees have admins and editors as members. Editors can add and delete labels.
 * Admins can also manage members and modify the tree (name, visibility etc).
 * Label trees can be public or private. Private trees maintain a list of projects
 * that are authorized to use the tree. This list is maintained by label tree admins.
 *
 * @property string $uuid
 */
class LabelTree extends Model
{
    use HasFactory;

    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'pivot',
        'uuid',
        'version_id',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'visibility_id' => 'int',
        'label_tree_version_id' => 'int',
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
            ->wherePivot('role_id', Role::adminId())
            ->where('id', '!=', $member->id)
            ->exists();
    }

    /**
     * Scope a query to public label trees.
     *
     * @param \Illuminate\Database\Eloquent\Builder<LabelTree> $query
     * @return \Illuminate\Database\Eloquent\Builder<LabelTree>
     */
    public function scopePublicTrees($query)
    {
        return $query->where('visibility_id', Visibility::publicId());
    }

    /**
     * Scope a query to private label trees.
     *
     * @param \Illuminate\Database\Eloquent\Builder<LabelTree> $query
     * @return \Illuminate\Database\Eloquent\Builder<LabelTree>
     */
    public function scopePrivateTrees($query)
    {
        return $query->where('visibility_id', Visibility::privateId());
    }

    /**
     * Scope a query to all trees that are accessible by a user.
     *
     * @param \Illuminate\Database\Eloquent\Builder<LabelTree> $query
     * @param User $user
     * @return \Illuminate\Database\Eloquent\Builder<LabelTree>
     */
    public function scopeAccessibleBy($query, User $user)
    {
        if ($user->can('sudo')) {
            return $query;
        }

        return $query->where(function ($query) use ($user) {
            $query->where('label_trees.visibility_id', Visibility::publicId())
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
     * Scope a query to all trees that are not a varsion of another tree.
     *
     * @param \Illuminate\Database\Eloquent\Builder<LabelTree> $query
     *
     * @return \Illuminate\Database\Eloquent\Builder<LabelTree>
     */
    public function scopeWithoutVersions($query)
    {
        return $query->whereNull('label_trees.version_id');
    }

    /**
     * Scope a query to all "global" trees.
     *
     * @param \Illuminate\Database\Eloquent\Builder<LabelTree> $query
     *
     * @return \Illuminate\Database\Eloquent\Builder<LabelTree>
     */
    public function scopeGlobal($query)
    {
        return $query->withoutVersions()
            ->whereDoesntHave('members')
            ->where('label_trees.visibility_id', Visibility::publicId());
    }

    /**
     * The version of this label tree (if it is a version of a master label tree).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<LabelTreeVersion, LabelTree>
     */
    public function version()
    {
        return $this->belongsTo(LabelTreeVersion::class);
    }

    /**
     * The versions of this (master) label tree.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<LabelTreeVersion>
     */
    public function versions()
    {
        return $this->hasMany(LabelTreeVersion::class);
    }

    /**
     * The visibility of the label tree.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Visibility, LabelTree>
     */
    public function visibility()
    {
        return $this->belongsTo(Visibility::class);
    }

    /**
     * The members of this label tree. Every member has a tree-specific role.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<User>
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
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Label>
     */
    public function labels()
    {
        return $this->hasMany(Label::class)->orderBy('name');
    }

    /**
     * Determines if the label tree can be safely deleted.
     *
     * A label tree can be safely deleted if none if its labels or the labels of any of its versions are in use.
     *
     * @return bool
     */
    public function canBeDeleted()
    {
        $treeIds = $this->versions()
            ->join('label_trees', 'label_trees.version_id', '=', 'label_tree_versions.id')
            ->pluck('label_trees.id')
            ->concat([$this->id]);

        return !Label::used()->whereIn('label_tree_id', $treeIds)->exists();
    }

    /**
     * Add a new member with a certain role.
     *
     * @param User|int $user
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
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Project>
     */
    public function projects()
    {
        return $this->belongsToMany(Project::class);
    }

    /**
     * The projects that are authorized to use this private label tree.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Project>
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
        // Use DB directly so this can be done in a single query.
        // Also detach unauthorized projects of versions of this label tree.
        DB::table('label_tree_project')
            ->where(function ($query) {
                $query->where('label_tree_id', $this->id)
                    ->orWhereIn('label_tree_id', function ($query) {
                        $query->select('label_trees.id')
                            ->from('label_trees')
                            ->join('label_tree_versions', 'label_tree_versions.id', '=', 'label_trees.version_id')
                            ->where('label_tree_versions.label_tree_id', $this->id);
                    });
            })
            ->whereNotIn('project_id', function ($query) {
                $query->select('project_id')
                    ->from('label_tree_authorized_project')
                    ->where('label_tree_id', $this->id);
            })->delete();
    }

    /**
     * Get the name with a version suffix of this label tree.
     *
     * @return string
     */
    public function getVersionedNameAttribute()
    {
        if (is_null($this->version_id)) {
            return $this->name;
        }

        return "{$this->name} @ {$this->version->name}";
    }

    /**
     * Replicate all labels of one label tree to this one.
     *
     * @param LabelTree $tree
     */
    public function replicateLabelsOf(LabelTree $tree)
    {
        $oldLabels = $tree->labels;
        $newLabels = $oldLabels->map(function ($label) {
            $label = $label->replicate(['parent_id']);
            $label->label_tree_id = $this->id;
            $label->uuid = Uuid::uuid4();

            return $label;
        });

        $parents = $oldLabels->pluck('parent_id');
        $idMap = [];

        foreach ($newLabels as $index => $label) {
            $label->save();
            $idMap[$oldLabels[$index]->id] = $label->id;
        }

        foreach ($parents as $index => $id) {
            if (!is_null($id)) {
                $newLabels[$index]->parent_id = $idMap[$id];
                $newLabels[$index]->save();
            }
        }
    }
}
