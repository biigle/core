<?php

namespace Biigle\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserSettings extends FormRequest
{
    /**
     * Additional validation rules that can be added during runtime.
     *
     * @var array
     */
    protected static $additionalRules = [];

    /**
     * Add a new settings validation rule.
     *
     * @param string $key
     * @param mixed $rule
     */
    public static function addRule($key, $rule)
    {
        static::$additionalRules[$key] = $rule;
    }

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $rules = [
            'super_user_mode' => 'filled|bool',
            'include_federated_search' => 'filled|bool',
        ];

        if (config('reports.notifications.allow_user_settings')) {
            $rules['report_notifications'] = 'filled|in:email,web';
        }

        return array_merge(static::$additionalRules, $rules);
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->filled('super_user_mode') && !$this->user()->isGlobalAdmin) {
                $validator->errors()->add('super_user_mode', 'Only global admins can configure the super user mode.');
            }
        });
    }
}
