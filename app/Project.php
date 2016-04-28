<?php

namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Dias\Contracts\BelongsToProjectContract;

class Project extends Model implements BelongsToProjectContract
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
     * The attributes hidden from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'pivot',
    ];

    /**
     * {@inheritdoc}
     *
     * A project belongs only to itself but the user permissions can be handled
     * very consistently if a project implements this method, too.
     *
     * @return array
     */
    public function projectIds()
    {
        return [$this->id];
    }

    /**
     * The members of this project. Every member has a project-specific
     * `project_role_id` besides their global user role.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function users()
    {
        return $this->belongsToMany('Dias\User')
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
        return $this->belongsTo('Dias\User');
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
     * The transects of this project.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function transects()
    {
        return $this->belongsToMany('Dias\Transect');
    }

    /**
     * Adds a transect to this project if it wasn't already.
     *
     * @param int $id
     * @return void
     */
    public function addTransectId($id)
    {
        try {
            $this->transects()->attach($id);
        } catch (QueryException $e) {
            // transect already exists for this project, so everything is fine
        }
    }

    /**
     * Detaches the transect from this project. Fails if this is the last
     * project, the transect is attached to, unless force is `true`.
     *
     * @param \Dias\Transect $transect
     * @param bool $force Delete the transect completely if this is the last
     * project it belongs to
     */
    public function removeTransect($transect, $force = false)
    {
        if (!$transect) {
            // nothing to remove
            return;
        }

        // this is the last project the transect belongs to, so it should be
        // deleted
        if ($transect->projects()->count() === 1) {
            // but delete the transect only with force!
            if (!$force) {
                abort(400, 'The transect would not belong to any project after detaching. Use the "force" argument to detach and delete it.');
            }

            $transect->delete();
        }

        // if the transect still belongs to other projects, just detach it
        $this->transects()->detach($transect->id);
    }

    /**
     * Detaches the transect from this project. Fails if this is the last
     * project, the transect is attached to, unless force is `true`.
     *
     * @param int $id Transect ID
     * @param bool $force Delete the transect completely if this is the last
     * project it belongs to
     */
    public function removeTransectId($id, $force = false)
    {
        $transect = $this->transects()->find($id);
        $this->removeTransect($transect, $force);
    }

    /**
     * Detaches all transects from this project. Fails if this is the last
     * project, one of the transects is attached to, unless force is `true`.
     *
     * @param bool $force
     */
    public function removeAllTransects($force = false)
    {
        $transects = $this->transects;

        if (!$force) {
            foreach ($transects as $transect) {
                if ($transect->projects()->count() === 1) {
                    abort(400, 'One transect would not belong to any project after detaching. Use the "force" argument or detach and delete it first.');
                }
            }
        }

        foreach ($transects as $transect) {
            $this->removeTransect($transect, $force);
        }
    }

    /**
     * The project specific labels of this project.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function labels()
    {
        return $this->hasMany('Dias\Label');
    }
}
