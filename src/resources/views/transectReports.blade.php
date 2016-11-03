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
                    <div class="col-sm-7">
                        <div class="form-group">
                            <label>Report type</label>
                            <div class="btn-group btn-group-justified">
                                <div class="btn-group">
                                    <button type="button" class="btn btn-default" title="Request an annotation report" data-ng-click="form.selectType('annotations')" data-ng-class="{active:form.wantsType('annotations')}">Annotation report</button>
                                </div>
                                <div class="btn-group">
                                    <button type="button" class="btn btn-default" title="Request an image label report" data-ng-click="form.selectType('image-labels')" data-ng-class="{active:form.wantsType('image-labels')}">Image label report</button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="report-variant">Report variant</label>
                            <select id="report-variant" class="form-control" data-ng-model="form.data.variant" required="">
                                <option data-ng-repeat="variant in form.availableVariants track by $index" value="@{{variant}}" data-ng-bind="variant"></option>
                            </select>
                        </div>
                    </div>
                    <div class="col-sm-5">
                        @include('export::partials.reportTypeInfo')
                    </div>
                </div>
                <div class="row" data-ng-if="form.wantsType('annotations')">
                    <div class="col-sm-7">
                        <div class="form-group" data-ng-class="{'has-error':form.error.annotationSession}">
                            <label for="annotation-session">Restrict to annotation session</label>
                            <select id="annotation-session" class="form-control" data-ng-model="form.data.options.annotationSession">
                                <option value="">-- none --</option>
                                @foreach ($annotationSessions as $session)
                                    <option value="{{$session->id}}">{{$session->name}}</option>
                                @endforeach
                            </select>
                            <div class="ng-cloak help-block" data-ng-if="form.error.annotationSession" data-ng-bind="form.error.annotationSession"></div>
                        </div>
                    </div>
                    <div class="col-sm-5 help-block ng-cloak" data-ng-if="form.data.options.annotationSession">
                        Only annotations that were created during the selected annotation session will be included in the report.
                    </div>
                </div>
                <div class="row" data-ng-if="form.wantsType('annotations')">
                    <div class="col-sm-7" data-ng-class="{'has-error':form.error.exportArea}">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" data-ng-model="form.data.options.exportArea"> Restrict to export area
                            </label>
                        </div>
                        <div class="ng-cloak help-block" data-ng-if="form.error.exportArea" data-ng-bind="form.error.exportArea"></div>
                    </div>
                    <div class="col-sm-5 help-block ng-cloak" data-ng-if="form.data.options.exportArea">
                        Annotations that are outside of the export area will be discarded for this report.
                    </div>
                </div>
                <div class="row form-group">
                    <div class="col-sm-7" data-ng-class="{'has-error':form.error.separateLabelTrees}">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" data-ng-model="form.data.options.separateLabelTrees"> Separate label trees
                            </label>
                        </div>
                        <div class="ng-cloak help-block" data-ng-if="form.error.separateLabelTrees" data-ng-bind="form.error.separateLabelTrees"></div>
                    </div>
                    <div class="col-sm-5 help-block ng-cloak" data-ng-if="form.data.options.separateLabelTrees">
                        Annotations belonging to different label trees will be separated to different files/sheets.
                    </div>
                </div>
                <div class="ng-cloak alert alert-success" data-ng-if="form.state.success">
                    The requested report will be prepared. You will get notified by email when it is ready. Now you can request a new report or <a href="{{route('transect', $transect->id)}}" title="Back to {{$transect->name}}" class="alert-link">go back</a> to the transect.
                </div>
                <div class="form-group">
                    <a href="{{route('transect', $transect->id)}}" title="Back to {{$transect->name}}" class="btn btn-default">back</a>
                    <input type="submit" name="submit" value="Request this report" title="Request this report" class="btn btn-success pull-right" data-ng-disabled="form.state.loading">
                </div>
            </form>
            <p class="text-muted">
                ProTip: You can request reports for a whole project from the project overview page.
            </p>
        </div>
    </div>
</div>
@endsection
