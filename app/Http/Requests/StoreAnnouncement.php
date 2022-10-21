<?php

namespace Biigle\Http\Requests;

use Biigle\Announcement;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class StoreAnnouncement extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return $this->user()->can('create', Announcement::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'title' => 'required|max:255',
            'body' => 'required',
            'show_until' => 'filled|date',
        ];
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
            if (Announcement::active()->exists()) {
                $validator->errors()->add('title', 'There already is another active announcement.');
            }

            if ($this->has('show_until') && Carbon::parse($this->input('show_until'))->isPast()) {
                $validator->errors()->add('show_until', 'The show_until time must be in the future.');
            }
        });
    }
}
