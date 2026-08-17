<?php

namespace Biigle\Http\Requests;

use \Illuminate\Foundation\Http\FormRequest;

class FilterAnnotationsRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'take' => 'integer',
            'shape_id' => 'array',
            'shape_id.*' => 'integer',
            'user_id' => 'array',
            'user_id.*' => 'integer',
            'filename' => 'array',
            'filename.*' => 'string',
            'created_at' => 'array',
            'created_at.*' => 'array:ref,operator,date',
            'created_at.ref' => 'string:annotation,annotation_label',
            'created_at.operator' => 'string:gt,eq,lt',
            'created_at.date' => 'date_format:Y-m-d',
            'updated_at.*' => 'array:ref,operator,date',
            'updated_at.ref' => 'string:annotation,annotation_label',
            'updated_at.operator' => 'string:gt,eq,neq,lt',
            'updated_at.date' => 'date_format:Y-m-d',
            'union' => 'boolean',
        ];
    }
}
