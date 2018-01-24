<?php

namespace Biigle;

use Cache;
use Event;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;

class Project extends Model
{
    /**
     * Validation rules for creating a new project.
     *
     * @var array
     */
    public static $createRules = [
        'name'        => 'required|max:512',
        'description' => 'required',
    ];

    /**
     * Validation rules for updating a project.
     *
     * @var array
     */
    public static $updateRules = [
        'name'        => 'filled|min:2|max:512',
        'description' => 'filled|min:2',
    ];

    /**
     * Validation rules for attaching a label tree.
     *
     * @var array
     */
    public static $attachLabelTreeRules = [
        'id'        => 'required|exists:label_trees,id',
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
     * The members of this project. Every member has a project-specific
     * `project_role_id` besides their global user role.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function users()
    {
        return $this->belongsToMany(User::class)
            ->withPivot('project_role_id as project_role_id');
    }

    /**
     * All members of this project with the `admin` role.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function admins()
    {
        return $this->users()->whereProjectRoleId(Role::$admin->id);
    }

    /**
     * All members of this project with the `editor` role.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function editors()
    {
        return $this->users()->whereProjectRoleId(Role::$editor->id);
    }

    /**
     * All members of this project with the `guest` role.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function guests()
    {
        return $this->users()->whereProjectRoleId(Role::$guest->id);
    }

    /**
     * The user that created this project. On creation this user is
     * automatically added to the project's users with the 'admin' role by
     * the ProjectObserver.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function creator()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Sets the creator if it isn't already set.
     *
     * @param User $user
     * @return bool
     */
    public function setCreator($user)
    {
        // user must exist and creator mustn't
        if (!$this->creator && $user) {
            $this->creator()->associate($user);

            return true;
        }

        return false;
    }

    /**
     * Adds the user with the given role to this project.
     *
     * @param int $userId
     * @param int $roleId
     * @return void
     */
    public function addUserId($userId, $roleId)
    {
        try {
            $this->users()->attach($userId, ['project_role_id' => $roleId]);
        } catch (QueryException $e) {
            abort(400, 'The user already exists in this project.');
        }
    }

    /**
     * Changes the role of an existing user in this project.
     *
     * @param int $userId
     * @param int $roleId
     * @return void
     */
    public function changeRole($userId, $roleId)
    {
        if ($this->users()->find($userId) === null) {
            abort(400, "User doesn't exist in this project.");
        }

        // removeUserId prevents changing the last remaining admin to anything
        // else, too!
        if ($this->removeUserId($userId)) {
            // only re-attach if detach was successful
            $this->users()->attach($userId, ['project_role_id' => $roleId]);
        } else {
            abort(500, "The user couldn't be modified.");
        }
    }

    /**
     * Checks if the user can be removed from the project.
     * Throws an exception if not.
     *
     * @param int $userId
     */
    public function checkUserCanBeRemoved($userId)
    {
        $admins = $this->admins();
        // is this an attempt to remove the last remaining admin?
        if ($admins->count() === 1 && $admins->find($userId) !== null) {
            abort(400, "The last admin of {$this->name} cannot be removed. The admin status must be passed on to another user first.");
        }
    }

    /**
     * Removes the user by ID from this project.
     *
     * @param int $userId
     * @return bool
     */
    public function removeUserId($userId)
    {
        $this->checkUserCanBeRemoved($userId);

        return (boolean) $this->users()->detach($userId);
    }

    /**
     * The volumes of this project.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function volumes()
    {
        return $this->belongsToMany(Volume::class)
            ->withPivot('id')
            ->withTimestamps();
    }

    /**
     * Adds a volume to this project if it wasn't already.
     *
     * @deprecated Use `$project->volumes()->attach($id)` instead.
     * @param int $id
     * @return void
     */
    public function addVolumeId($id)
    {
        try {
            $this->volumes()->attach($id);
            // Maybe we get a new thumbnail now.
            Cache::forget("project-thumbnail-{$this->id}");
        } catch (QueryException $e) {
            // volume already exists for this project, so everything is fine
        }
    }

    /**
     * Detaches the volume from this project. Fails if this would delete annotations or
     * image labels, unless force is `true`.
     *
     * @param Volume $volume
     * @param bool $force Detach the volume even if this deletes annotations.
     */
    public function detachVolume($volume, $force = false)
    {
        $pivot = $this->volumes()->find($volume->id)->pivot;

        $annotationQuery = Annotation::where('project_volume_id', $pivot->id);
        $hasAnnotations = $annotationQuery->exists();
        $hasImageLabels = ImageLabel::where('project_volume_id', $pivot->id)->exists();

        if (($hasAnnotations || $hasImageLabels) && !$force) {
            abort(400, 'Detaching the volume would delete annotations or image labels. Use the "force" parameter to detach the volume anyway.');
        }

        if ($hasAnnotations) {
            Event::fire('annotations.cleanup', $annotationQuery->pluck('id'));
        }

        // Detaching will automatically delete any annotations and image labels.
        $this->volumes()->detach($volume->id);
        // Maybe we get a new thumbnail now.
        Cache::forget("project-thumbnail-{$this->id}");
    }

    /**
     * Detaches all volumes from this project. Fails if this would delete annotations or
     * image labels, unless force is `true`.
     *
     * @param bool $force
     */
    public function detachAllVolumes($force = false)
    {
        $pivotIds = $this->volumes()->pluck('project_volume.id');

        $annotationQuery = Annotation::whereIn('project_volume_id', $pivotIds);
        $hasAnnotations = $annotationQuery->exists();
        $hasImageLabels = ImageLabel::whereIn('project_volume_id', $pivotIds)->exists();

        if (($hasAnnotations || $hasImageLabels) && !$force) {
            abort(400, 'Detaching one volume would delete annotations or image labels. Use the "force" parameter to detach the volume anyway.');
        }

        if ($hasAnnotations) {
            Event::fire('annotations.cleanup', $annotationQuery->pluck('id'));
        }

        // Detaching will automatically delete any annotations and image labels.
        $this->volumes()->detach();
        Cache::forget("project-thumbnail-{$this->id}");
    }

    /**
     * The label trees, this project is using.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function labelTrees()
    {
        return $this->belongsToMany(LabelTree::class);
    }

    /**
     * The private label trees that authorized this project to use them.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function authorizedLabelTrees()
    {
        return $this->belongsToMany(LabelTree::class, 'label_tree_authorized_project');
    }

    /**
     * An image that can be used a unique thumbnail for this project.
     *
     * @return Image
     */
    public function getThumbnailAttribute()
    {
        return Cache::remember("project-thumbnail-{$this->id}", 60, function () {
            $volume = $this->volumes()
                ->select('volumes.id')
                ->orderBy('volumes.id')
                ->first();

            return $volume ? $volume->thumbnail : null;
        });
    }
}
