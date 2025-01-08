@extends('app')

@section('title') Search @if($query) - {{$query}} @endif @stop

@section('content')
<div class="container">
    <div class="row">
        <div class="col-xs-12 col-md-offset-2 col-md-8">
            <form class="search-form" action="{{route('search')}}" method="GET">
                <div class="input-group">
                    <div class="input-group-addon"><i class="fa fa-search"></i></div>
                    <input class="form-control" type="text" name="q" placeholder="Search BIIGLE" value="{{$query}}">
                    @if ($query)
                        <div class="input-group-btn">
                            <a class="btn btn-default" href="{{route('search', ['t' => $type])}}" title="Clear search term"><i class="fa fa-times"></i></a>
                        </div>
                    @endif
                </div>
                @if ($type)
                    <input type="hidden" name="t" value="{{$type}}">
                @endif
                <button type="submit" class="btn btn-success">Search</button>
            </form>
            <ul class="nav nav-tabs">
                @include("search.projects-tab")
                @include("search.label-trees-tab")
                @include("search.volumes-tab")
                @include("search.annotations-tab")
                @include("search.videos-tab")
                @include("search.reports-tab")
                @foreach (Modules::getViewMixins('searchTab') as $module => $nested)
                    @include("{$module}::searchTab")
                @endforeach
            </ul>
            <div class="tab-content">
                @include("search.projects-content")
                @include("search.label-trees-content")
                @include("search.volumes-content")
                @include("search.annotations-content")
                @include("search.videos-content")
                @include("search.reports-content")
                @foreach (Modules::getViewMixins('searchTabContent') as $module => $nested)
                    @include("{$module}::searchTabContent")
                @endforeach
            </div>
            @if (isset($results))
                <nav class="text-center">
                    {{$results->links()}}
                </nav>
            @endif
        </div>
    </div>
</div>
@endsection
