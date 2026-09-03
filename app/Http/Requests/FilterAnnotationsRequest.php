<?php

namespace Biigle\Http\Requests;

use \Illuminate\Foundation\Http\FormRequest;

abstract class FilterAnnotationsRequest extends FormRequest
{
    /**
     * ID of the label to filter annotations.
     *
     * @var int
     */
    public $labelId;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'take' => 'nullable|integer',
            'shape_id' => 'nullable|array',
            'shape_id.*' => 'nullable|integer',
            'user_id' => 'nullable|array',
            'user_id.*' => 'nullable|integer',
            'filename' => 'nullable|array',
            'filename.*' => 'nullable|string',
            'created_at' => 'nullable|array',
            'created_at.*' => 'nullable|array',
            'created_at.*.ref' => 'required_with:created_at|string|alpha_dash|max:50',
            'created_at.*.operator' => 'required_with:created_at|string|in:eq,neq,gt,lt',
            'created_at.*.date' => 'required_with:created_at|date_format:Y-m-d',
            'updated_at' => 'nullable|array',
            'updated_at.*' => 'nullable|array',
            'updated_at.*.ref' => 'required_with:updated_at|string|alpha_dash|max:50',
            'updated_at.*.operator' => 'required_with:updated_at|string|in:eq,neq,gt,lt',
            'updated_at.*.date' => 'required_with:updated_at|date_format:Y-m-d',
            'union' => 'nullable|boolean',
        ];
    }
}
