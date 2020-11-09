<?php

namespace Biigle\Http\Requests;

class DestroyOwnUser extends DestroyUser
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->destroyUser = $this->user();

        return $this->user()->can('destroy', $this->destroyUser);
    }
}
