@if ($enforcedGuidelineProjects->isNotEmpty())
    <div class="panel panel-warning">
        <div class="panel-body text-warning">
            @if ($enforcedGuidelineProjects->count() === 1)
                The project "{{ $enforcedGuidelineProjects->first() }}" has an enforced annotation guideline.
            @else
                The projects "{{ $enforcedGuidelineProjects->join('", "') }}" have an enforced annotation guideline.
            @endif
            The guideline is not applied to the imported annotations and file labels, so they may have labels and shapes that the guideline does not allow.
        </div>
    </div>
@endif
