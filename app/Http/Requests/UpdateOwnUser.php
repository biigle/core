<?php

namespace Biigle\Http\Requests;

class UpdateOwnUser extends UpdateUser
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->updateUser = $this->user();

        // Save origin so the settings view can highlight the right form fields.
        $this->session()->flash('origin', $this->input('_origin'));

        return $this->user()->can('update', $this->user());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $rules = parent::rules();
        
        // Prevent users from deleting their affiliation with an empty string
        // but still allow null values for cases where affiliation was never set
        $rules['affiliation'] = 'filled|max:255';
        
        return $rules;
    }
}
