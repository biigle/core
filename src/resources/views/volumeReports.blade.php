@extends('app')

@section('title')Reports for {{ $volume->name }}@stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/export/scripts/main.js') }}"></script>
    <script type="text/javascript">
        biigle.$declare('export.volumeId', {!! $volume->id !!});
    </script>
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-volumes-breadcrumbs">
    @include('volumes::partials.projectsBreadcrumb') / <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}" class="navbar-link">{{$volume->name}}</a> / <strong>Reports</strong> @include('volumes::partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div id="export-volume-report-form" class="container">
    <div class="row">
        <div class="col-md-6 col-md-offset-3">
            <h2>Request report for {{$volume->name}}</h2>
            <p>
                Request a volume report to consolidate data of the volume into downloadable files.
            </p>
            <form v-on:submit.prevent="submit">
                <div class="row">
                    <div class="col-sm-7">
                        <div class="form-group">
                            <label>Report type</label>
                            <div class="btn-group btn-group-justified">
                                <div class="btn-group">
                                    <button type="button" class="btn btn-default" title="Request an annotation report" v-on:click="selectType('annotations')" :class="{active: wantsType('annotations')}">Annotation report</button>
                                </div>
                                <div class="btn-group">
                                    <button type="button" class="btn btn-default" title="Request an image label report" v-on:click="selectType('image-labels')" :class="{active: wantsType('image-labels')}">Image label report</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="report-variant">Report variant</label>
                            <select id="report-variant" class="form-control" v-model="selectedVariant" required="">
                                <option v-for="variant in availableVariants" :value="variant" v-text="variant"></option>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-5">
                        @include('export::partials.reportTypeInfo')
                    </div>
                </div>
                @if ($annotationSessions->count() > 0)
                    <div class="row" v-if="wantsType('annotations')" v-cloak>
                        <div class="col-sm-7">
                            <div class="form-group" :class="{'has-error': errors.annotationSession}">
                                <label for="annotation-session">Restrict to annotation session</label>
                                <select id="annotation-session" class="form-control" v-model="options.annotationSession">
                                    @foreach ($annotationSessions as $session)
                                        <option value="{{$session->id}}">{{$session->name}}</option>
                                    @endforeach
                                </select>
                                <div class="help-block" v-if="errors.annotationSession" v-text="getError('annotationSession')"></div>
                            </div>
                        </div>
                        <div class="col-sm-5 help-block ng-cloak" v-if="options.annotationSession" v-cloak>
                            Only annotations that were created during the selected annotation session will be included in the report.
                        </div>
                    </div>
                @endif
                <div class="row" v-if="wantsType('annotations')" v-cloak>
                    <div class="col-sm-7" :class="{'has-error': errors.exportArea}">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" v-model="options.exportArea"> Restrict to export area
                            </label>
                        </div>
                        <div v-if="errors.exportArea" v-cloak class="help-block" v-text="getError('exportArea')"></div>
                    </div>
                    <div class="col-sm-5 help-block" v-if="options.exportArea" v-cloak>
                        Annotations that are outside of the export area will be discarded for this report.
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-7" :class="{'has-error': errors.separateLabelTrees}">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" v-model="options.separateLabelTrees"> Separate label trees
                            </label>
                        </div>
                        <div class="help-block" v-if="errors.separateLabelTrees" v-cloak v-text="getError('separateLabelTrees')"></div>
                    </div>
                    <div class="col-sm-5 help-block" v-if="options.separateLabelTrees" v-cloak>
                        Annotations belonging to different label trees will be separated to different files/sheets.
                    </div>
                </div>
                <div class="alert alert-success" v-if="success" v-cloak>
                    The requested report will be prepared. You will get notified by email when it is ready. Now you can request a new report or <a href="{{route('volume', $volume->id)}}" title="Back to {{$volume->name}}" class="alert-link">go back</a> to the volume.
                </div>
                <div class="form-group">
                    <a href="{{route('volume', $volume->id)}}" title="Back to {{$volume->name}}" class="btn btn-default">back</a>
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
