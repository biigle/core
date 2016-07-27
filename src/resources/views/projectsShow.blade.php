<div class="panel panel-default" data-ng-controller="ExportController">
    <div class="panel-heading">
        Reports
    </div>
    <div class="panel-body" data-ng-switch="isRequested()">
        <div class="ng-cloak alert alert-success" data-ng-switch-when="true">
            The <strong data-ng-bind="selected.type"></strong> report will be prepared for you. You will get notified by email when it is ready.
        </div>
        <form class="form-inline" data-ng-switch-default="">
            <div class="checkbox">
                <label>
                    <input type="checkbox" data-ng-model="selected.restrict" title="Discard annotations outside of the annotation area"> Restrict to export area
                </label>
            </div>
            <div class="form-group">
                <select id="type" name="type" data-ng-model="selected.type" class="form-control">
                    <option value="basic" selected="">basic</option>
                    <option value="extended">extended</option>
                    <option value="full">full</option>
                </select>
            </div>
            <div class="form-group">
                <input class="btn btn-default" type="submit" name="request" value="Request report" data-ng-click="requestReport()" title="Request a new @{{selected.type}} report">
            </div>
            <div data-ng-switch="selected.type">
                <div class="help-block" data-ng-switch-when="basic">
                    The basic report contains graphical plots of abundances of the different annotation labels for each transect of this project (as PDF).
                </div>
                <div class="help-block ng-cloak" data-ng-switch-when="extended">
                    The extended report lists the abundances of annotation labels for each image in all transects of this project (as XLSX).
                </div>
                <div class="help-block ng-cloak" data-ng-switch-when="full">
                    The full report lists the labels, shape and coordinates of all annotations in all transects of this project (as XLSX).
                </div>
            </div>
            <div class="ng-cloak help-block" data-ng-if="selected.restrict">
                Annotations that are outside of the export area will be discarded for this report.
            </div>
        </form>
    </div>
</div>
