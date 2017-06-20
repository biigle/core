@extends('app')

@section('title') Reports @stop

@section('content')
<div class="container">
    @include('partials.notification-tabs')
    <div class="row">
        <div class="col-md-offset-3 col-md-6">
            <div class="list-group">
                @forelse ($reports as $report)
                    <a href="{{$report->getUrl()}}" class="list-group-item" title="Download this report">
                        <h4 class="list-group-item-heading">
                            <small class="pull-right">{{$report->created_at}}</small>
                            {{$report->subject}}
                        </h4>
                        <p class="list-group-item-text">
                            {{$report->name}}
                        </p>
                    </a>
                @empty
                    <span class="list-group-item disabled">
                        You didn't request any reports yet.
                    </span>
                @endforelse
            </div>
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
