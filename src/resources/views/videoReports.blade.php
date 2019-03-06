@extends('app')

@section('title', "Reports for {$video->name}")

@push('scripts')
    <script src="{{ cachebust_asset('vendor/reports/scripts/main.js') }}"></script>
    <script type="text/javascript">
        biigle.$declare('reports.videoId', {!! $video->id !!});
        biigle.$declare('reports.reportTypes', {!! $reportTypes !!});
    </script>
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-annotations-breadcrumbs">
    <a href="{{route('project', $video->project_id)}}" class="navbar-link" title="Show project {{$video->project->name}}">{{$video->project->name}}</a> /
    <a href="{{route('video', $video->id)}}" class="navbar-link" title="Show video {{$video->name}}">{{$video->name}}</a> / <strong>Reports</strong>
</div>
@endsection

@section('content')
<div id="video-report-form" class="container">
    <div class="row">
        <div class="col-md-6 col-md-offset-3">
            <h2>Request report for {{$video->name}}</h2>
            <p>
                Request a video report to consolidate data of the video into downloadable files.
            </p>
            <form v-on:submit.prevent="submit">
                <div class="form-group">
                    <label for="report-variant">Report variant</label>
                    <select id="report-variant" class="form-control" v-model="selectedVariant" required="" :disabled="onlyOneAvailableVariant">
                        <option v-for="variant in availableVariants" :value="variant" v-text="variant"></option>
                    </select>
                    @include('reports::partials.reportTypeInfo')
                </div>
                <div class="form-group" :class="{'has-error': errors.separate_label_trees}">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" v-model="options.separate_label_trees"> Separate label trees
                        </label>
                    </div>
                    <div class="help-block" v-if="errors.separate_label_trees" v-cloak v-text="getError('separate_label_trees')"></div>
                    <div v-else class="help-block">
                        Annotations belonging to different label trees will be separated to different files.
                    </div>
                </div>
                <div class="alert alert-success" v-if="success" v-cloak>
                    The requested report will be prepared. You will get notified when it is ready. Now you can request a new report or <a href="{{route('video', $video->id)}}" title="Back to {{$video->name}}" class="alert-link">go back</a> to the video.
                </div>
                <div class="form-group">
                    <a href="{{route('video', $video->id)}}" title="Back to {{$video->name}}" class="btn btn-default">back</a>
                    <button class="btn btn-success pull-right" type="submit" :disabled="loading">Request this report</button>
                </div>
            </form>
            <p class="text-muted">
                ProTip: You can request reports for a whole project from the project overview page.
            </p>
        </div>
    </div>
</div>
@endsection
