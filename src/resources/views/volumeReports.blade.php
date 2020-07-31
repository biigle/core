@extends('app')

@section('title', "Reports for {$volume->name}")

@push('scripts')
<script src="{{ cachebust_asset('vendor/reports/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('reports.volumeId', {!! $volume->id !!});
    biigle.$declare('reports.reportTypes', {!! $reportTypes !!});
    biigle.$declare('reports.labelTrees', {!! $labelTrees !!});
</script>
@endpush

@push('styles')
<link href="{{ cachebust_asset('vendor/reports/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-volumes-breadcrumbs">
    @include('volumes.partials.projectsBreadcrumb') / <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}" class="navbar-link">{{$volume->name}}</a> / <strong>Reports</strong> @include('volumes.partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div id="volume-report-form" class="container">
    <div class="row">
        <div class="col-md-6 col-md-offset-3">
            <h2>Request report for {{$volume->name}}</h2>
            <p>
                Request a volume report to consolidate data of the volume into downloadable files.
            </p>
            <form v-on:submit.prevent="submit">
                <div class="form-group">
                    <label>Report type</label>
                    <div class="btn-group btn-group-justified">
                        <div class="btn-group">
                            <button type="button" class="btn btn-default" title="Request an annotation report" v-on:click="selectType('ImageAnnotations')" :class="{active: wantsType('ImageAnnotations')}">Annotation report</button>
                        </div>
                        <div class="btn-group">
                            <button type="button" class="btn btn-default" title="Request an image label report" v-on:click="selectType('ImageLabels')" :class="{active: wantsType('ImageLabels')}">Image label report</button>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="report-variant">Report variant</label>
                    <select id="report-variant" class="form-control" v-model="selectedVariant" required="">
                        <option v-for="variant in availableVariants" :value="variant" v-text="variant"></option>
                    </select>
                    @include('reports::partials.reportTypeInfo')
                </div>
                @if ($annotationSessions->count() > 0)
                    <div v-if="wantsType('ImageAnnotations')" v-cloak class="form-group" :class="{'has-error': errors.annotation_session_id}">
                        <label for="annotation-session">Restrict to annotation session</label>
                        <select id="annotation-session" class="form-control" v-model="options.annotation_session_id">
                            @foreach ($annotationSessions as $session)
                                <option value="{{$session->id}}">{{$session->name}}</option>
                            @endforeach
                        </select>
                        <div class="help-block" v-if="errors.annotation_session_id" v-text="getError('annotation_session_id')"></div>
                        <div v-else class="help-block">
                            Only annotations that were created during the selected annotation session will be included in the report.
                        </div>
                    </div>
                @endif
                <div v-if="wantsType('ImageAnnotations')" v-cloak>
                    <div class="form-group" :class="{'has-error': errors.export_area}">
                        <div class="checkbox">
                            @if ($volume->exportArea)
                                <label>
                                    <input type="checkbox" v-model="options.export_area"> Restrict to export area
                                </label>
                            @else
                                <label class="text-muted">
                                    <input type="checkbox" v-model="options.export_area" disabled> Restrict to export area
                                </label>
                            @endif
                        </div>
                        <div v-if="errors.export_area" v-cloak class="help-block" v-text="getError('export_area')"></div>
                        <div v-else class="help-block">
                            Annotations that are outside of the export area will be discarded for this report.
                        </div>
                    </div>
                    <div class="form-group" :class="{'has-error': errors.newest_label}">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" v-model="options.newest_label"> Restrict to newest label
                            </label>
                        </div>
                        <div v-if="errors.newest_label" v-cloak class="help-block" v-text="getError('newest_label')"></div>
                        <div v-else class="help-block">
                            Only the newest label of each annotation will be included in the report.
                        </div>
                    </div>
                    <div v-if="wantsVariant('Abundance')" class="form-group" :class="{'has-error': errors.aggregate_child_labels}">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" v-model="options.aggregate_child_labels"> Aggregate child labels
                            </label>
                        </div>
                        <div v-if="errors.aggregate_child_labels" v-cloak class="help-block" v-text="getError('aggregate_child_labels')"></div>
                        <div v-else class="help-block">
                            Aggregate the abundance of child labels to their parent label.
                        </div>
                    </div>
                </div>
                <div class="form-group" :class="{'has-error': errors.separate_label_trees}">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" v-model="options.separate_label_trees"> Separate label trees
                        </label>
                    </div>
                    <div class="help-block" v-if="errors.separate_label_trees" v-cloak v-text="getError('separate_label_trees')"></div>
                    <div v-else class="help-block">
                        Annotations belonging to different label trees will be separated to different files/sheets.
                    </div>
                </div>
                @include('reports::partials.restrictLabels')
                <div class="alert alert-success" v-if="success" v-cloak>
                    The requested report will be prepared. You will get notified when it is ready. Now you can request a new report or <a href="{{route('volume', $volume->id)}}" title="Back to {{$volume->name}}" class="alert-link">go back</a> to the volume.
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
