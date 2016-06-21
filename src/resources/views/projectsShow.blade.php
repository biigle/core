<div class="panel panel-default" data-ng-controller="exportController">
    <div class="panel-heading">
        Export Data
    </div>
    <ul class="list-group list-group-restricted">
            <li class="list-group-item">
                <button class="btn btn-success" data-ng-click="basic({{$project->id}})">Basic Report</button>
            </li>
            <li class="list-group-item">
                <button class="btn btn-success" data-ng-click="extended({{$project->id}})">Detailed Report</button>
            </li>
            <li class="list-group-item">
                <button class="btn btn-success" data-ng-click="full({{$project->id}})">Full Report</button>
            </li>
    </ul>
</div>
