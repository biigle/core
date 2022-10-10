<div class="panel panel-default" id="annotation-session-panel" :class="classObject">
    <div class="panel-heading">
        Annotation sessions
        <span class="pull-right">
            <loader :active="loading"></loader>
            <a class="btn btn-default btn-xs" href="{{route('manual-tutorials', ['volumes', 'annotation-sessions'])}}" title="Learn more on annotation sessions" target="_blank"><span class="fa fa-info-circle" aria-hidden="true"></span></a>
            <button class="btn btn-default btn-xs" title="Edit annotation sessions" v-on:click="toggleEditing" :class="{active: editing}"><span class="fa fa-pencil-alt" aria-hidden="true"></span></button>
        </span>
    </div>
    <div class="panel-body" v-cloak v-if="editing">
        <form role="form" class="form clearfix" v-on:submit.prevent="submit">
            <div class="row">
                <div class="form-group col-xs-6" :class="{'has-error':hasError('name')}">
                    <label class="control-label" for="as-name">Name</label>
                    <input type="text" class="form-control" name="name" id="as-name" placeholder="My annotation session" v-model="editedSession.name" title="Annotation session name" required>
                    <p class="help-block" v-text="getError('name')" v-if="hasError('name')"></p>
                </div>
                <div class="form-group col-xs-6" :class="{'has-error':hasError('description')}">
                    <label class="control-label" for="as-description">Description</label>
                    <input type="text" class="form-control" name="description" id="as-description" placeholder="This is my new session." v-model="editedSession.description" title="Short annotation session description">
                    <p class="help-block" v-text="getError('description')" v-if="hasError('description')"></p>
                </div>
            </div>
            <div class="row">
                <div class="form-group col-xs-6" :class="{'has-error':hasError('starts_at')}">
                    <label class="control-label" for="as-starts-at">Start date</label>
                    <datepicker-dropdown v-model="editedSession.starts_at" placeholder="{{$today->toDateString()}}"></datepicker-dropdown>
                    <p class="help-block" v-text="getError('starts_at')" v-if="hasError('starts_at')"></p>
                </div>
                <div class="form-group col-xs-6" :class="{'has-error':hasError('ends_at')}">
                    <label class="control-label" for="as-ends-at">End date</label>
                    <datepicker-dropdown v-model="editedSession.ends_at" placeholder="{{$today->addDay()->toDateString()}}"></datepicker-dropdown>
                    <p class="help-block" v-text="getError('ends_at')" v-if="hasError('ends_at')"></p>
                </div>
            </div>
            <div class="row">
                <div class="form-group col-xs-6" :class="{'has-error':hasError('users')}">
                    <label class="control-label" for="new-user">New user</label>
                    <typeahead class="typeahead--block" :items="availableUsers" title="Add a new user to the session" placeholder="Joe User" v-on:select="selectUser" :clear-on-select="true" more-info="affiliation"></typeahead>
                </div>
                <div class="form-group col-xs-6" :class="{'has-error':hasError('users')}">
                    <label class="control-label" for="users">Users</label>
                    <div class="form-control tag-list" readonly>
                        <user-tag v-for="user in editedSession.users" :key="user.id" :user="user" v-on:remove="removeUser" inline-template>
                            <span class="tag label label-default">
                                <span v-text="name"></span> <button type="button" class="close" :title="title" v-on:click="remove"><span aria-hidden="true">&times;</span></button>
                            </span>
                        </user-tag>
                    </div>
                    <p class="help-block" v-text="getError('users')" v-if="hasError('users')"></p>
                </div>
            </div>
            <div class="row">
                <div class="form-group col-xs-6" :class="{'has-error':hasError('hide_other_users_annotations')}">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" name="as-hide-other-users" v-model="editedSession.hide_other_users_annotations"> Hide annotations of other users while the annotation session is active.
                        </label>
                    </div>
                    <p class="help-block" v-text="getError('hide_other_users_annotations')" v-if="hasError('hide_other_users_annotations')"></p>
                </div>
                <div class="form-group col-xs-6" :class="{'has-error':hasError('hide_own_annotations')}">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" name="as-hide-own-users" v-model="editedSession.hide_own_annotations"> Hide annotations of the own user that were created before the annotation session started.
                        </label>
                    </div>
                    <p class="help-block" v-text="getError('hide_own_annotations')" v-if="hasError('hide_own_annotations')"></p>
                </div>
            </div>
            <div v-if="hasNewSession">
                <button type="button" class="btn btn-default pull-right" title="Clear form data" v-on:click="clearEditedSession" :disabled="loading">Clear</button>
                <button type="submit" class="btn btn-success" title="Create new annotation session" :disabled="loading">Create</button>
            </div>
            <div v-else>
                <span class="pull-right">
                    <button type="button" class="btn btn-default" title="Cancel editing" v-on:click="clearEditedSession" :disabled="loading">Cancel</button>
                    <button type="button" class="btn btn-danger" title="Delete this annotation session" v-on:click="deleteSession" :disabled="loading">Delete</button>
                </span>
                <button type="submit" class="btn btn-success" title="Save changes" :disabled="loading">Save</button>
            </div>
        </form>
    </div>
    <ul class="list-group images-list" v-cloak>
        <list-item v-for="session in orderedSessions" :key="session.id" :session="session" :editing="editing" :edit-id="editedSession.id" v-on:edit="editSession" inline-template>
            <li class="list-group-item session" :title="title" :class="classObject" v-on:click="edit">
                <div>
                    <span class="session__dates"><span :title="session.starts_at_iso8601" v-text="session.starts_at"></span> - <span :title="session.ends_at_iso8601" v-text="session.ends_at"></span></span></span> <strong v-text="session.name"></strong>
                </div>
                <div v-text="session.description"></div>
                <div>
                    <span class="label label-default"><span v-text="session.users.length"></span> user(s)</span>
                    <span class="label label-default" v-if="session.hide_other_users_annotations" title="Hide annotations of other users while this annotation session is active">hide&nbsp;other</span>
                    <span class="label label-default" v-if="session.hide_own_annotations" title="Hide own annotations that were created before this annotation session started while it is active">hide&nbsp;own</span>
                </div>
            </li>
        </list-item>
        <li class="list-group-item text-muted" v-if="!hasSessions">There are no annotation sessions.</li>
    </ul>
</div>
