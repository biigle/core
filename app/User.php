<?php

namespace Biigle;

use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use Notifiable;

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
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'role_id' => 'int',
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
        return $this->belongsToMany(Project::class);
    }

    /**
     * The label trees, this user is a member of.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function labelTrees()
    {
        return $this->belongsToMany(LabelTree::class);
    }

    /**
     * The global role of this user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Api tokens of this user
     *
     * @return @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function apiTokens()
    {
        return $this->hasMany(ApiToken::class, 'owner_id');
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
