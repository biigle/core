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

        if ($this->filled('super_user_mode') && !$this->user()->isGlobalAdmin) {
            return false;
        }

        return $this->user()->can('update', $this->user());
    }
}
