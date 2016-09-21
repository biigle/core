<div class="panel panel-default" data-ng-controller="AnnotationSessionController" data-ng-class="{'panel-warning': isEditing()}">
    <div class="panel-heading">
        <h3 class="panel-title">
            Annotation sessions
            <span class="pull-right">
                {{-- put image filter toggle here --}}
                <button class="btn btn-default btn-xs" title="Edit annotation sessions" data-ng-click="toggleEditing()" data-ng-class="{active: isEditing()}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
            </span>
        </h3>
    </div>
    <div class="panel-body ng-cloak" data-ng-if="isEditing()">
        <form role="form" class="form" data-ng-submit="addSession()">
            <div class="row">
                <div class="form-group col-xs-6" data-ng-class="{'has-error':hasError('name')}">
                    <label class="control-label" for="as-name">Name</label>
                    <input type="text" class="form-control" name="name" id="as-name" placeholder="My annotation session" data-ng-model="newSession.name" title="Annotation session name" required>
                    <p class="help-block ng-cloak" data-ng-bind="getError('name')" data-ng-if="hasError('name')"></p>
                </div>
                <div class="form-group col-xs-6" data-ng-class="{'has-error':hasError('description')}">
                    <label class="control-label" for="as-description">Description</label>
                    <input type="text" class="form-control" name="description" id="as-description" placeholder="This is my new session." data-ng-model="newSession.description" title="Short annotation session description">
                    <p class="help-block ng-cloak" data-ng-bind="getError('description')" data-ng-if="hasError('description')"></p>
                </div>
            </div>
            <div class="row">
                <div class="form-group col-xs-6" data-ng-class="{'has-error':hasError('starts_at')}">
                    <label class="control-label" for="as-starts-at">Start date</label>
                    <div class="input-group">
                        <input type="text" class="form-control" name="starts_at" id="as-starts-at" uib-datepicker-popup="yyyy-MM-dd" data-ng-model="newSession.starts_at" is-open="open.starts_at" close-text="Close" alt-input-formats="formats" show-button-bar="false" title="Start date of the annotation session" placeholder="{{$today->toDateString()}}" required />
                        <span class="input-group-btn">
                            <button type="button" class="btn btn-default" ng-click="openStartsAt()" data-ng-class="{'btn-danger':hasError('starts_at')}"><i class="glyphicon glyphicon-calendar"></i></button>
                        </span>
                    </div>
                    <p class="help-block ng-cloak" data-ng-bind="getError('starts_at')" data-ng-if="hasError('starts_at')"></p>
                </div>
                <div class="form-group col-xs-6" data-ng-class="{'has-error':hasError('ends_at')}">
                    <label class="control-label" for="as-ends-at">End date</label>
                    <div class="input-group">
                        <input type="text" class="form-control" name="ends_at" id="as-ends-at" uib-datepicker-popup="yyyy-MM-dd" data-ng-model="newSession.ends_at" is-open="open.ends_at" close-text="Close" alt-input-formats="formats" show-button-bar="false" title="End date of the annotation session" placeholder="{{$today->addDay()->toDateString()}}" required />
                        <span class="input-group-btn">
                            <button type="button" class="btn btn-default" ng-click="openEndsAt()"  data-ng-class="{'btn-danger':hasError('ends_at')}"><i class="glyphicon glyphicon-calendar"></i></button>
                        </span>
                    </div>
                    <p class="help-block ng-cloak" data-ng-bind="getError('ends_at')" data-ng-if="hasError('ends_at')"></p>
                </div>
            </div>
            <div class="row">
                <div class="form-group col-xs-6" data-ng-class="{'has-error':hasError('hide_other_users_annotations')}">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" name="as-hide-other-users" data-ng-model="newSession.hide_other_users_annotations"> Hide annotations of other users while the annotation session is active.
                        </label>
                    </div>
                    <p class="help-block ng-cloak" data-ng-bind="getError('hide_other_users_annotations')" data-ng-if="hasError('hide_other_users_annotations')"></p>
                </div>
                <div class="form-group col-xs-6" data-ng-class="{'has-error':hasError('hide_own_annotations')}">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" name="as-hide-own-users" data-ng-model="newSession.hide_own_annotations"> Hide annotations of the own user that were created before the annotation session started.
                        </label>
                    </div>
                    <p class="help-block ng-cloak" data-ng-bind="getError('hide_own_annotations')" data-ng-if="hasError('hide_own_annotations')"></p>
                </div>
            </div>
            <button type="submit" class="btn btn-success" title="Create new annotation session">Create</button>
        </form>
    </div>
    <ul class="list-group images-list ng-cloak">
            <li class="list-group-item session" data-ng-repeat="session in getSessions() | orderBy: 'starts_at_iso8691':dateComparator track by session.id" data-ng-if="hasSessions()" data-ng-class="{'session--active':isActive(session)}">
                <div class="clearfix">
                    <span class="session__dates"><span data-ng-bind="session.starts_at_iso8601 | date: 'yyyy-MM-dd HH:mm'"></span> - <span data-ng-bind="session.ends_at_iso8601 | date: 'yyyy-MM-dd HH:mm'"></span></span> <strong data-ng-bind="session.name"></strong>
                    <button type="button" class="close" title="Delete this annotation session" data-ng-click="confirm('Are you sure you want to delete the annotation session \'' + session.name + '\'?') && deleteSession(session)" data-ng-if="isEditing()"><span aria-hidden="true">&times;</span></button>
                </div>
                <div data-ng-bind="session.description">
                </div>
                <div>
                    <span class="label label-default" data-ng-if="session.hide_other_users_annotations" title="Hide annotations of other users while this annotation session is active">hide&nbsp;other</span>
                    <span class="label label-default" data-ng-if="session.hide_own_annotations" title="Hide own annotations that were created before this annotation session started while it is active">hide&nbsp;own</span>
                </div>
            </li>
            <li class="list-group-item text-muted" data-ng-if="!hasSessions()">There are no annotation sessions.</li>
    </ul>
</div>
