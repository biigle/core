@extends('app')

@section('title', "Reports for {$project->name}")

@push('scripts')
<script src="{{ cachebust_asset('vendor/reports/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('reports.projectId', {!! $project->id !!});
    biigle.$declare('reports.reportTypes', {!! $reportTypes !!});
    biigle.$declare('reports.labelTrees', {!! $labelTrees !!});
</script>
@endpush

@push('styles')
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
                Request a project report to consolidate data of image or video volumes of the project into downloadable files.
            </p>
            <form v-on:submit.prevent="submit">
                <div class="form-group">
                    <label>Report type</label>
                    @if ($hasImageVolume)
                        <div class="btn-group btn-group-justified">
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request an annotation report" v-on:click="selectType('ImageAnnotations')" :class="{active: wantsType('ImageAnnotations')}">Image annotation report</button>
                            </div>
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request an image label report" v-on:click="selectType('ImageLabels')" :class="{active: wantsType('ImageLabels')}">Image label report</button>
                            </div>
                        </div>
                    @endif
                @if ($hasImageVolume && $hasVideoVolume)
                </div>
                <div class="form-group">
                @endif
                    @if ($hasVideoVolume)
                        <div class="btn-group btn-group-justified">
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request a video annotation report" v-on:click="selectType('VideoAnnotations')" :class="{active: wantsType('VideoAnnotations')}">Video annotation report</button>
                            </div>
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request a video label report" v-on:click="selectType('VideoLabels')" :class="{active: wantsType('VideoLabels')}">Video label report</button>
                            </div>
                        </div>
                    @endif
                </div>
                <div class="form-group">
                    <label for="report-variant">Report variant</label>
                    <select id="report-variant" class="form-control" v-model="selectedVariant" required="" :disabled="onlyOneAvailableVariant">
                        <option v-for="variant in availableVariants" :value="variant" v-text="variant"></option>
                    </select>
                    @include('reports::partials.reportTypeInfo')
                </div>
                <div v-if="wantsType('ImageAnnotations')" v-cloak>
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
