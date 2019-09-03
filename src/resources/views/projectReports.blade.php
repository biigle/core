@extends('app')

@section('title', "Reports for {$project->name}")

@push('scripts')
<script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
<script src="{{ cachebust_asset('vendor/reports/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('reports.projectId', {!! $project->id !!});
    biigle.$declare('reports.reportTypes', {!! $reportTypes !!});
    biigle.$declare('reports.labelTrees', {!! $labelTrees !!});
</script>
@endpush

@push('styles')
<link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/reports/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-volumes-breadcrumbs">
    <a href="{{route('project', $project->id)}}" class="navbar-link" title="Show project {{$project->name}}">{{$project->name}}</a> / <strong>Reports</strong>
</div>
@endsection

@section('content')
<div id="project-report-form" class="container">
    <div class="row">
        <div class="col-md-6 col-md-offset-3">
            <h2>Request report for {{$project->name}}</h2>
            <p>
                @if ($hasVolume && $hasVideo)
                    Request a project report to consolidate data of all volumes or videos of the project into downloadable files.
                @elseif ($hasVolume)
                    Request a project report to consolidate data of all volumes of the project into downloadable files.
                @else
                    Request a project report to consolidate data of all videos of the project into downloadable files.
                @endif
            </p>
            <form v-on:submit.prevent="submit">
                <div class="form-group">
                    <label>Report type</label>
                    <div class="btn-group btn-group-justified">
                        @if ($hasVolume)
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request an annotation report" v-on:click="selectType('Annotations')" :class="{active: wantsType('Annotations')}">Annotation report</button>
                            </div>
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request an image label report" v-on:click="selectType('ImageLabels')" :class="{active: wantsType('ImageLabels')}">Image label report</button>
                            </div>
                        @endif
                        @if ($hasVideo)
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request a video annotation report" v-on:click="selectType('VideoAnnotations')" :class="{active: wantsType('VideoAnnotations')}">Video annotation report</button>
                            </div>
                        @endif
                    </div>
                </div>
                <div class="form-group">
                    <label for="report-variant">Report variant</label>
                    <select id="report-variant" class="form-control" v-model="selectedVariant" required="" :disabled="onlyOneAvailableVariant">
                        <option v-for="variant in availableVariants" :value="variant" v-text="variant"></option>
                    </select>
                    @include('reports::partials.reportTypeInfo')
                </div>
                <div v-if="wantsType('Annotations')" v-cloak>
                    <div class="form-group" :class="{'has-error': errors.export_area}">
                        <div class="checkbox">
                            @if ($hasExportArea)
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
                    <div :class="{'has-error': errors.newest_label}">
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
                    The requested report will be prepared. You will get notified when it is ready. Now you can request a new report or <a href="{{route('project', $project->id)}}" title="Back to {{$project->name}}" class="alert-link">go back</a> to the project.
                </div>
                <div class="form-group">
                    <a href="{{route('project', $project->id)}}" title="Back to {{$project->name}}" class="btn btn-default">back</a>
                    <button class="btn btn-success pull-right" type="submit" :disabled="loading">Request this report</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
