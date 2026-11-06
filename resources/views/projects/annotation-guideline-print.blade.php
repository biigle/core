@extends('app')
@section('show-navbar', false)
@section('title', "Annotation guideline of {$project->name}")

@if (request()->boolean('print'))
@push('scripts')
<script type="module">
    // The load event waits for the reference images.
    window.addEventListener('load', () => window.print());
</script>
@endpush
@endif

@section('content')
<div class="container annotation-guideline-print">
    <div class="hidden-print annotation-guideline-print__toolbar">
        <button class="btn btn-default" onclick="window.print()" title="Print the guideline or save it as PDF">
            <i class="fa fa-print"></i> Print
        </button>
    </div>

    <h1>Annotation guideline</h1>
    <p class="lead">
        Project: {{ $project->name }}<br>
        Date: {{ now()->toDateString() }}
        @if ($guideline->enforced)
            <br>
            Allowed shapes:
            @if ($onlyShapes->isNotEmpty())
                {{ $onlyShapes->join(', ') }}
            @else
                All shapes
            @endif
        @endif
    </p>

    <h2>Description</h2>
    @if ($guideline->description)
        <p class="annotation-guideline-print__text">{{ $guideline->description }}</p>
    @else
        <p class="text-muted">The guideline has no description.</p>
    @endif

    <h2>Labels</h2>
    @forelse ($labelsByTree as $labels)
        <h3>Label tree: {{ $labels->first()->tree->name }}</h3>
        <table class="table table-bordered annotation-guideline-print__labels">
            <thead>
                <tr>
                    <th>Label</th>
                    <th>{{ $guideline->enforced ? 'Allowed shape' : 'Preferred shape' }}</th>
                    <th>Description</th>
                    <th>Reference image</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($labels as $label)
                    <tr>
                        <td>
                            {{-- An SVG because the print styles of Bootstrap remove backgrounds. --}}
                            <svg class="annotation-guideline-print__color" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.3" fill="#{{ $label->color }}" stroke="white" stroke-width="1.4"/></svg>
                            {{ $label->name }}
                        </td>
                        <td>
                            @if ($label->pivot->shape)
                                {{ $shapes[$label->pivot->shape] }}
                            @else
                                <span class="text-muted">Any</span>
                            @endif
                        </td>
                        <td class="annotation-guideline-print__text">{{ $label->pivot->description }}</td>
                        <td>
                            @if ($label->pivot->reference_image_url)
                                <img class="annotation-guideline-print__image" src="{{ $label->pivot->reference_image_url }}" alt="Reference image of {{ $label->name }}">
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @empty
        <p class="text-muted">The guideline has no labels.</p>
    @endforelse
</div>
@endsection
