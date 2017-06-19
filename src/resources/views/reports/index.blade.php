@extends('app')

@section('title') Reports @stop

@section('content')
<div class="container">
    @include('partials.notification-tabs')
    <div class="row">
        <div class="col-sm-3 col-md-2 col-md-offset-1">

        </div>
        <div class="col-sm-9 col-md-7 col-md-offset-1">
            @forelse ($reports as $report)
                <h3><a href="{{$report->getUrl()}}" class="btn btn-default"><i class="glyphicon glyphicon-download" title="Download this report"></i></a> {{$report->source->name}}</h3>
                <p class="text-muted">
                    {{$report->getName()}}
                </p>
            @empty
                <p class="text-muted">You didn't request any reports yet.</p>
            @endforelse
        </div>
        @if ($reports->total() > 0)
            <nav class="col-sm-12">
                <ul class="pager">
                    @if ($reports->currentPage() > 1)
                        <li><a href="{{$reports->previousPageUrl()}}@if(old('query'))&query={{old('query')}}@endif" title="Show newer reports">Newer</a></li>
                    @else
                        <li class="disabled"><a href="#" disabled>Newer</a></li>
                    @endif

                    @if ($reports->hasMorePages())
                        <li><a href="{{$reports->nextPageUrl()}}@if(old('query'))&query={{old('query')}}@endif" title="Show older reports">Older</a></li>
                    @else
                        <li class="disabled"><a href="#" disabled>Older</a></li>
                    @endif
                </ul>
            </nav>
        @endif
    </div>
</div>
@endsection
