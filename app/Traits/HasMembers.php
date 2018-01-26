<?php

namespace Biigle\Traits;

use Biigle\Role;
use Biigle\User;

trait HasMembers
{
    /**
     * Name of the role id column in the pivot table.
     *
     * @var string
     */
    protected $roleColumnName = 'role_id';

    /**
     * Checks if a role can be used for a member of this model.
     *
     * @param Role $role
     * @return bool
     */
    public function isRoleValid(Role $role)
    {
        return $this->isRoleIdValid($role->id);
    }

    /**
     * Checks if a role ID can be used for a member of this model.
     *
     * @param int $roleId
     * @return bool
     */
    public function isRoleIdValid($roleId)
    {
        return in_array($roleId, [
            Role::$admin->id,
            Role::$editor->id,
            Role::$guest->id,
        ]);
    }

    /**
     * The members of this model. Every member has a specific role.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function members()
    {
        return $this->belongsToMany(User::class)
            ->select('id', 'firstname', 'lastname')
            ->withPivot("{$this->roleColumnName} as {$this->roleColumnName}");
    }

    /**
     * Add a new member with a certain role.
     *
     * @param User $user
     * @param Role $role
     */
    public function addMember(User $user, Role $role)
    {
        return $this->addMemberId($user->id, $role->id);
    }

    /**
     * Add a new member with a certain role by IDs.
     *
     * @param int $userId
     * @param int $roleId
     */
    public function addMemberId($userId, $roleId)
    {
        if (!$this->isRoleIdValid($roleId)) {
            abort(422, 'Invalid member role.');
        }

        if ($this->members()->where('id', $userId)->exists()) {
            abort(422, 'The user is already member.');
        } else {
            $this->members()->attach($userId, [$this->roleColumnName => $roleId]);
        }
    }

    /**
     * Update a member role.
     *
     * @param User $user
     * @param Role $role
     */
    public function updateMember(User $user, Role $role)
    {
        return $this->updateMemberId($user->id, $role->id);
    }

    /**
     * Update a member role by IDs.
     *
     * @param int $userId
     * @param int $roleId
     */
    public function updateMemberId($userId, $roleId)
    {
        if (!$this->isRoleIdValid($roleId)) {
            abort(422, 'Invalid member role.');
        }

        if ($roleId !== Role::$admin->id && !$this->memberCanLooseAdminStatus($userId)) {
            abort(403, 'The last admin cannot be demoted.');
        }

        if (!$this->members()->where('id', $userId)->exists()) {
            abort(404, 'This user is not a member.');
        }

        $this->members()->updateExistingPivot($userId, [$this->roleColumnName => $roleId]);
    }

    /**
     * Determines if a member can be removed.
     *
     * @param User $member
     * @return bool
     */
    public function memberCanBeRemoved(User $member)
    {
        return $this->memberCanLooseAdminStatus($member->id);
    }

    /**
     * Check if a member can loose their admin status. The model must have at least one
     * admin at all times.
     *
     * @param int $memberId
     * @return bool
     */
    protected function memberCanLooseAdminStatus($memberId)
    {
        return $this->members()
            ->where('id', '!=', $memberId)
            ->wherePivot($this->roleColumnName, Role::$admin->id)
            ->exists();
    }
}
