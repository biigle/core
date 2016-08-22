<div class="panel panel-default" data-ng-controller="ExportController">
    <div class="panel-heading">
        Reports
    </div>
    <div class="panel-body" data-ng-switch="isRequested()">
        <div class="ng-cloak alert alert-success" data-ng-switch-when="true">
            The <strong data-ng-bind="selected.type"></strong> report will be prepared for you. You will get notified by email when it is ready.
        </div>
        <form class="form-inline" data-ng-switch-default="">
            <div class="form-group">
                <select id="type" name="type" data-ng-model="selected.type" class="form-control">
                    <option value="basic" selected="">basic annotations</option>
                    <option value="extended">extended annotations</option>
                    <option value="full">full annotations</option>
                    <option value="image label">image labels</option>
                </select>
            </div>
            <div class="form-group">
                <input class="btn btn-default" type="submit" name="request" value="Request report" data-ng-click="requestReport()" title="Request a new @{{selected.type}} report">
            </div>
            <div data-ng-switch="selected.type">
                <div class="help-block" data-ng-switch-when="basic">
                    The basic annotation report contains graphical plots of abundances of the different annotation labels for each transect of this project (as PDF).
                </div>
                <div class="help-block ng-cloak" data-ng-switch-when="extended">
                    The extended annotation report lists the abundances of annotation labels for each image in all transects of this project (as XLSX).
                </div>
                <div class="help-block ng-cloak" data-ng-switch-when="full">
                    The full annotation report lists the labels, shape and coordinates of all annotations in all transects of this project (as XLSX).
                </div>
                <div class="help-block ng-cloak" data-ng-switch-when="image label">
                    The image label report lists the image labels of all images of all transects of this projects (as XLSX).
                </div>
            </div>
        </form>
    </div>
</div>
