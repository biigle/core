<?php

namespace Biigle\Http\Requests;

use Biigle\Enums\Shape;
use Biigle\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAnnotationGuideline extends FormRequest
{
    /**
     * The project to which the guideline should be added.
     *
     * @var Project
     */
    public $project;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->project = Project::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->project);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'description' => 'nullable|string|min:1',
            'enforced' => 'boolean',
            'only_shapes' => 'nullable|array|prohibited_unless:enforced,true',
            'only_shapes.*' => ['distinct', 'integer', Rule::enum(Shape::class)],
            'allow_aligned_rectangle' => 'boolean',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // Additional tools that are allowed separately of only_shapes must be
            // checked here, too.
            if ($this->getOnlyShapes() === [] && !$this->getAllowAlignedRectangle()) {
                $validator->errors()->add('only_shapes', 'The guideline must allow at least one shape or the aligned rectangle tool.');
            }
        });
    }

    /**
     * Get the only_shapes attribute with the IDs cast to int.
     *
     * Null means that all shapes are allowed. An empty array is kept because it means
     * that no shape is allowed, so only the tools that are allowed separately (e.g.
     * with allow_aligned_rectangle) can be used. This can't be expressed otherwise
     * because these tools are not shapes of their own. An empty array must always be
     * checked together with these flags.
     */
    public function getOnlyShapes(): ?array
    {
        $onlyShapes = $this->input('only_shapes');

        // An empty array passes the prohibited_unless rule, so it is ignored here if
        // the guideline is not enforced.
        if (!$this->boolean('enforced') || !is_array($onlyShapes)) {
            return null;
        }

        return array_map('intval', $onlyShapes);
    }

    /**
     * Get the allow_aligned_rectangle attribute.
     *
     * The tool can only be restricted by an enforced guideline, so the flag is reset
     * otherwise. This prevents a stale restriction if the guideline is enforced again.
     */
    public function getAllowAlignedRectangle(): bool
    {
        return !$this->boolean('enforced')
            || $this->boolean('allow_aligned_rectangle', true);
    }
}
