@extends('app')

@section('title') Search @if($query) - {{$query}} @endif @stop

@section('content')
<div class="container">
    <div class="row">
        <div class="col-xs-12 col-md-offset-2 col-md-8">
            <form class="search-form" action="{{route('search')}}" method="GET">
                <div class="input-group">
                    <div class="input-group-addon"><i class="fa fa-search"></i></div>
                    <input class="form-control" type="text" name="q" placeholder="Search BIIGLE" value="{{$query}}" required>
                </div>
                @if ($type)
                    <input type="hidden" name="t" value="{{$type}}">
                @endif
                <button type="submit" class="btn btn-success">Search</button>
            </form>
            <ul class="nav nav-tabs">
                @foreach (Modules::getViewMixins('searchTab') as $module => $nested)
                    @include("{$module}::searchTab")
                @endforeach
            </ul>
            <div class="tab-content">
                @foreach (Modules::getViewMixins('searchTabContent') as $module => $nested)
                    @include("{$module}::searchTabContent")
                @endforeach
            </div>
            @if (method_exists($results, 'total') && $results->total() > 0)
                <nav>
                    <ul class="pager">
                        @if ($results->currentPage() > 1)
                            <li><a href="{{$results->previousPageUrl()}}&q={{$query}}@if($type)&t={{$type}}@endif">Previous</a></li>
                        @else
                            <li class="disabled"><a href="#" disabled>Previous</a></li>
                        @endif

                        @if ($results->hasMorePages())
                            <li><a href="{{$results->nextPageUrl()}}&q={{$query}}@if($type)&t={{$type}}@endif">Next</a></li>
                        @else
                            <li class="disabled"><a href="#" disabled>Next</a></li>
                        @endif
                    </ul>
                </nav>
            @endif
        </div>
    </div>
</div>
@endsection
