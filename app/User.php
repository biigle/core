<?php

namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Auth\Authenticatable;
use Illuminate\Foundation\Auth\Access\Authorizable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Cache;
use DB;

/**
 * A user.
 */
class User extends Model implements AuthenticatableContract, CanResetPasswordContract
{
    use Authenticatable, CanResetPassword, Authorizable;

    /**
     * Validation rules for logging in.
     *
     * @var array
     */
    public static $authRules = [
        'email'    => 'required|email|max:255',
        'password' => 'required|min:8',
    ];

    /**
     * Validation rules for resetting the password.
     *
     * @var array
     */
    public static $resetRules = [
        'email'    => 'required|email|max:255',
        'password' => 'required|confirmed|min:8',
        'token'    => 'required',
    ];

    /**
     * Validation rules for registering a new user.
     *
     * @var array
     */
    public static $createRules = [
        'email' => 'required|email|unique:users|max:255',
        'password' => 'required|min:8|confirmed',
        'firstname' => 'required|max:127',
        'lastname' => 'required|max:127',
        'role_id' => 'exists:roles,id',
    ];

    /**
     * Validation rules for deleting a user.
     *
     * @var array
     */
    public static $deleteRules = [
        'password'  => 'required|min:8',
    ];

    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
        'pivot',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['created_at', 'updated_at', 'login_at'];

    /**
     * Returns the validation rules for updating the attributes of this user.
     *
     * @return array
     */
    public function updateRules()
    {
        return [
            // ignore the email of this user
            'email' => "filled|email|unique:users,email,{$this->id}|max:255",
            'password' => 'min:8|confirmed',
            'firstname' => 'max:127',
            'lastname' => 'max:127',
            'role_id' => 'exists:roles,id',
            'auth_password' => 'required_with:role_id,password,email'
        ];
    }

    /**
     * The projects, this user is a member of.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function projects()
    {
        return $this->belongsToMany('Dias\Project');
    }

    /**
     * The label trees, this user is a member of.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function labelTrees()
    {
        return $this->belongsToMany('Dias\LabelTree');
    }

    /**
     * The global role of this user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function role()
    {
        return $this->belongsTo('Dias\Role');
    }

    /**
     * Api tokens of this user
     *
     * @return @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function apiTokens()
    {
        return $this->hasMany('Dias\ApiToken', 'owner_id');
    }

    /**
     * Adds the `isAdmin` attribute to the user which determines if the user
     * has the global admin role.
     *
     * @return bool
     */
    public function getIsAdminAttribute()
    {
        return $this->role_id === Role::$admin->id;
    }

    /**
     * Checks if this user is a member in one of the supplied projects.
     *
     * @param array $ids Project IDs
     * @return bool
     */
    public function canSeeOneOfProjects($ids)
    {
        return Cache::remember('user-'.$this->id.'-can-see-projects-'.implode('-', $ids), 0.25, function () use ($ids) {
            return $this->isAdmin || DB::table('project_user')
                ->whereIn('project_id', $ids)
                ->where('user_id', $this->id)
                ->exists();
        });
    }

    /**
     * Checks if this user is an editor or admin in one of the supplied
     * projects.
     *
     * @param array $ids Project IDs
     * @return bool
     */
    public function canEditInOneOfProjects($ids)
    {
        return Cache::remember('user-'.$this->id.'-can-edit-projects-'.implode('-', $ids), 0.25, function () use ($ids) {
            return $this->isAdmin || DB::table('project_user')
                ->whereIn('project_id', $ids)
                ->whereIn('project_role_id', [Role::$admin->id, Role::$editor->id])
                ->where('user_id', $this->id)
                ->exists();
        });
    }

    /**
     * Checks if this user is an admin in one of the supplied projects.
     *
     * @param array $ids Project IDs
     * @return bool
     */
    public function canAdminOneOfProjects($ids)
    {
        return Cache::remember('user-'.$this->id.'-can-admin-projects-'.implode('-', $ids), 0.25, function () use ($ids) {
            return $this->isAdmin || DB::table('project_user')
                ->whereIn('project_id', $ids)
                ->where('project_role_id', Role::$admin->id)
                ->where('user_id', $this->id)
                ->exists();
        });
    }

    /**
     * Checks if the user can be deleted.
     * Throws an exception if not.
     */
    public function checkCanBeDeleted()
    {
        foreach ($this->projects as $project) {
            $project->checkUserCanBeRemoved($this->id);
        }

        foreach ($this->labelTrees as $tree) {
            if (!$tree->memberCanBeRemoved($this)) {
                abort(400, "The user can't be removed from label tree '{$tree->name}'. The label tree needs at least one other admin.");
            }
        }
    }
}
