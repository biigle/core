<?php

namespace Dias;

use Illuminate\Auth\Authenticatable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Dias\Model\ModelWithAttributes;
use Cache;

/**
 * A user.
 */
class User extends ModelWithAttributes implements AuthenticatableContract, CanResetPasswordContract
{
    use Authenticatable, CanResetPassword;

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
    public static $registerRules = [
        'email'     => 'required|email|unique:users|max:255',
        'password'  => 'required|min:8|confirmed',
        'firstname' => 'required|alpha|max:127',
        'lastname'  => 'required|alpha|max:127',
    ];

    /**
     * The attributes included in the model's JSON form. All other are hidden.
     *
     * @var array
     */
    protected $visible = [
        'id',
        'name',
        'role_id',
        'project_role_id',
    ];

    /**
     * Attribute accessors that should be added to the JSON form.
     *
     * @var array
     */
    protected $appends = [
        'name',
    ];

    /**
     * Returns the validation rules for updating the attributes of this user.
     *
     * @return array
     */
    public function updateRules()
    {
        return [
            // ignore the email of this
            'email'     => 'email|unique:users,email,'.$this->id.'|max:255',
            'password'  => 'min:8|confirmed',
            'firstname' => 'alpha|max:127',
            'lastname'  => 'alpha|max:127',
        ];
    }

    /**
     * Generates a random string to use as an API key. The key will be stored in
     * the `api_key` attribute of the user.
     *
     * @return string
     */
    public function generateApiKey()
    {
        $key = str_random(32);
        $this->api_key = $key;

        return $key;
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
     * The global role of this user.
     *
     * @return Role
     */
    public function role()
    {
        return $this->belongsTo('Dias\Role');
    }

    /**
     * Adds the `isAdmin` attribute to the user which determines if the user
     * has the global admin role.
     *
     * @return bool
     */
    public function getIsAdminAttribute()
    {
        return $this->role->id === Role::$admin->id;
    }

    /**
     * Checks if this user is a member in one of the supplied projects.
     *
     * @param array $ids Project IDs
     * @return bool
     */
    public function canSeeOneOfProjects($ids)
    {
        return Cache::remember('user-'.$this->id.'-can-see-projects-'.implode('-', $ids), 0.1, function () use ($ids) {
            return $this->isAdmin || $this->projects()
                ->whereIn('id', $ids)
                ->count() > 0;
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
        return Cache::remember('user-'.$this->id.'-can-edit-projects-'.implode('-', $ids), 0.1, function () use ($ids) {
            return $this->isAdmin || $this->projects()
                ->whereIn('id', $ids)
                ->whereIn('project_role_id', [Role::$admin->id, Role::$editor->id])
                ->count() > 0;
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
        return Cache::remember('user-'.$this->id.'-can-admin-projects-'.implode('-', $ids), 0.1, function () use ($ids) {
            return $this->isAdmin || $this->projects()
                ->whereIn('id', $ids)
                ->where('project_role_id', Role::$admin->id)
                ->count() > 0;
        });
    }

    /**
     * Returns the full name of this user.
     * @return string
     */
    public function getNameAttribute()
    {
        return $this->firstname.' '.$this->lastname;
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
    }
}
