<?php

namespace Biigle;

use Biigle\Traits\HasJsonAttributes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable, HasJsonAttributes, HasFactory;

    /**
     * The attributes hidden from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
        'pivot',
        'uuid',
    ];

    /**
     * The attributes that should be casted to native types.
     *
     * @var array
     */
    protected $casts = [
        'role_id' => 'int',
        'attrs' => 'array',
    ];

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['created_at', 'updated_at', 'login_at'];

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
        return $this->belongsToMany(Project::class)->withPivot('pinned');
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
     * Api tokens of this user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function apiTokens()
    {
        return $this->hasMany(ApiToken::class, 'owner_id');
    }

    /**
     * The federated search models that the user can access
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function federatedSearchModels()
    {
        return $this->belongsToMany(FederatedSearchModel::class);
    }

    /**
     * Determines if the user has the global admin role.
     *
     * @return bool
     */
    public function getIsGlobalAdminAttribute()
    {
        return $this->role_id === Role::adminId();
    }

    /**
     * Checks if the user can be deleted.
     * Throws an exception if not.
     */
    public function checkCanBeDeleted()
    {
        foreach ($this->projects as $project) {
            if (!$project->userCanBeRemoved($this->id)) {
                abort(400, "The user can't be removed from project '{$project->name}'. The project needs at least one other admin.");
            }
        }

        foreach ($this->labelTrees as $tree) {
            if (!$tree->memberCanBeRemoved($this)) {
                abort(400, "The user can't be removed from label tree '{$tree->name}'. The label tree needs at least one other admin.");
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
            $this->setJsonAttr("settings.{$key}", $value);
        }

        if (empty($this->settings)) {
            $this->setJsonAttr('settings', null);
        }
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
        return $this->getJsonAttr("settings.{$key}", $default);
    }

    /**
     * Get the settings array.
     *
     * @return array|null
     */
    public function getSettingsAttribute()
    {
        return $this->getJsonAttr('settings');
    }

    /**
     * Determines if the user is currently in Super User Mode.
     *
     * @return bool
     */
    public function getIsInSuperUserModeAttribute()
    {
        return $this->isGlobalAdmin && $this->getSettings('super_user_mode', true);
    }

    /**
     * Enables or disables Super User Mode if the user is a global admin.
     * @param bool $value
     */
    public function setIsInSuperUserModeAttribute($value)
    {
        if ($this->isGlobalAdmin) {
            $this->setSettings(['super_user_mode' => (bool) $value]);
        }
    }

    /**
     * Determines if the user can review e.g. new user registrations (without being
     * super user).
     *
     * @return bool
     */
    public function getCanReviewAttribute()
    {
        return $this->isInSuperUserMode ||
            ($this->role_id === Role::editorId() &&
                $this->getSettings('can_review', false));
    }

    /**
     * Enables or disables the ability to review.
     *
     * @param bool $value
     */
    public function setCanReviewAttribute($value)
    {
        $this->setSettings(['can_review' => boolval($value) ? true : null]);
    }
}
