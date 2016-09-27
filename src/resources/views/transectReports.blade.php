@extends('app')

@section('title')Reports for {{ $transect->name }}@stop

@push('scripts')
    <script src="{{ asset('vendor/export/scripts/main.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.export').constant('TRANSECT_ID', {{$transect->id}});
    </script>
@endpush

@push('styles')
    <link href="{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-transects-breadcrumbs">
    @include('transects::partials.projectsBreadcrumb') / <a href="{{route('transect', $transect->id)}}" title="Show transect {{$transect->name}}" class="navbar-link">{{$transect->name}}</a> / <strong>Reports</strong> @include('transects::partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div class="container" data-ng-app="dias.export">
    <div class="row">
        <div class="col-md-6 col-md-offset-3">
            <h2>Request report for {{$transect->name}}</h2>
            <p>
                Request a transect report to consolidate data of the transect into downloadable files.
            </p>
            <form data-ng-controller="TransectReportRequestController" data-ng-submit="submit()">
                <div class="row">
                    <div class="form-group col-sm-7">
                        <label>Report type</label>
                        <div class="btn-group">
                            <button class="btn btn-default" title="Request an annotation report" data-ng-click="selectType('annotations')" data-ng-class="{active:wantsType('annotations')}">Annotation report</button>
                            <button class="btn btn-default" title="Request an image label report" data-ng-click="selectType('image-labels')" data-ng-class="{active:wantsType('image-labels')}">Image label report</button>
                        </div>
                    </div>
                    <div class="form-group col-sm-5">
                        <label for="report-variant">Report variant</label>
                        <select id="report-variant" class="form-control" data-ng-model="form.variant" required="">
                            <option data-ng-repeat="variant in availableVariants track by $index" value="@{{variant}}" data-ng-bind="variant"></option>
                        </select>
                    </div>
                </div>
                <div class="help-block" data-ng-if="wantsCombination('annotations', 'basic')">
                    The basic annotation report contains graphical plots of abundances of the different annotation labels (as PDF). See the manual for the <a target="_blank" href="{{route('manual-tutorials-export', 'reports-schema#annotation-basic-report')}}">report schema</a>.
                </div>
                <div class="help-block ng-cloak" data-ng-if="wantsCombination('annotations', 'extended')">
                    The extended annotation report lists the abundances of annotation labels for each image of this transect (as XLSX). See the manual for the <a target="_blank" href="{{route('manual-tutorials-export', 'reports-schema#annotation-extended-report')}}">report schema</a>.
                </div>
                <div class="help-block ng-cloak" data-ng-if="wantsCombination('annotations', 'full')">
                    The full annotation report lists the labels, shape and coordinates of all annotations of this transect (as XLSX). See the manual for the <a target="_blank" href="{{route('manual-tutorials-export', 'reports-schema#annotation-full-report')}}">report schema</a>.
                </div>
                <div class="help-block ng-cloak" data-ng-if="wantsCombination('annotations', 'csv')">
                    The CSV annotation report is intended for subsequent processing and lists the annotation labels of this transect at the highest possible resolution (as CSV files in a ZIP archive). See the manual for the <a target="_blank" href="{{route('manual-tutorials-export', 'reports-schema#annotation-csv-report')}}">report schema</a>.
                </div>
                <div class="help-block ng-cloak" data-ng-if="wantsCombination('image-labels', 'basic')">
                    The basic image label report lists the image labels of all images of this transect (as XLSX). See the manual for the <a target="_blank" href="{{route('manual-tutorials-export', 'reports-schema#image-label-basic-report')}}">report schema</a>.
                </div>
                <div class="help-block ng-cloak" data-ng-if="wantsCombination('image-labels', 'csv')">
                    The CSV image label report is intended for subsequent processing and lists the image labels of this transect at the highest possible resolution (as CSV files in a ZIP archive). See the manual for the <a target="_blank" href="{{route('manual-tutorials-export', 'reports-schema#image-label-csv-report')}}">report schema</a>.
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" data-ng-model="form.options.separateLabelTrees" disabled> Separate label trees
                            </label>
                        </div>
                        <div class="checkbox" data-ng-if="wantsType('annotations')">
                            <label>
                                <input type="checkbox" data-ng-model="form.options.exportArea"> Restrict to export area
                            </label>
                        </div>
                    </div>
                    <div class="col-sm-6" data-ng-if="wantsType('annotations')">
                        <label for="annotation-session">Restrict to annotation session</label>
                        <select id="annotation-session" class="form-control" data-ng-model="form.options.annotationSession" disabled>
                            <option value="">-- none --</option>
                            @foreach ($annotationSessions as $session)
                                <option value="{{$session->id}}">{{$session->name}}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="help-block ng-cloak" data-ng-if="form.options.separateLabelTrees">
                    Annotations belonging to different label trees will be separated to different files/sheets.
                </div>
                <div data-ng-if="wantsType('annotations')">
                    <div class="help-block ng-cloak" data-ng-if="form.options.exportArea">
                        Annotations that are outside of the export area will be discarded for this report.
                    </div>
                    <div class="help-block ng-cloak" data-ng-if="form.options.annotationSession">
                        Only annotations that were created during the selected annotation session will be included in the report.
                    </div>
                </div>
                <a href="{{route('transect', $transect->id)}}" title="Back to {{$transect->name}}" class="btn btn-default">back</a>
                <input type="submit" name="submit" value="Request this report" title="Request this report" class="btn btn-success pull-right">
            </form>
        </div>
    </div>
</div>
@endsection
