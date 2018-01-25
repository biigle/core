<?php

namespace Biigle;

use Biigle\Traits\HasJsonAttributes;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use Notifiable, HasJsonAttributes;

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
        'email' => 'required|string|email|unique:users|max:255',
        'password' => 'required|string|min:8|confirmed',
        'firstname' => 'required|string|max:127',
        'lastname' => 'required|string|max:127',
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
        'settings' => 'array',
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
            'auth_password' => 'required_with:role_id,password,email',
        ];
    }

    /**
     * Set the email attribute and transform it to lowercase.
     *
     * @param string $value
     */
    public function setEmailAttribute($value)
    {
        $this->attributes['email'] = $value ? strtolower($value) : null;
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
     * The volumes, this user is a member of.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function volumes()
    {
        return $this->belongsToMany(Volume::class);
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
     * Api tokens of this user.
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

        foreach ($this->volumes as $volume) {
            if (!$volume->memberCanBeRemoved($this)) {
                abort(400, "The user can't be removed from volume '{$volume->name}'. The volume needs at least one other admin.");
            }
        }
    }

    /**
     * Set settings and merge them with the existing settings.
     *
     * @param array $settings
     */
    public function setSettings(array $settings)
    {
        foreach ($settings as $key => $value) {
            $this->setJsonAttr($key, $value, 'settings');
        }

        $this->save();
    }

    /**
     * Get settings of a specific key.
     *
     * @param string $key
     * @param mixed $default Default value if the settings key was not set
     *
     * @return mixed
     */
    public function getSettings($key, $default = null)
    {
        return $this->getJsonAttr($key, $default, 'settings');
    }
}
