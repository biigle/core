import AnnotationsApi from '@/core/api/annotations.js';
import Echo from '@/core/echo.js';
import EditorMixin from '@/core/mixins/editor.vue';
import FileBrowserComponent from '@/core/components/fileBrowser.vue';
import FileBrowserDirectoryComponent from '@/core/components/fileBrowserDirectory.vue';
import ImagesApi from '@/core/api/images.js';
import LabelsApi from '@/core/api/labels.js';
import LabelSourceApi from '@/core/api/labelSource.js';
import LabelTreeApi from '@/core/api/labelTree.js';
import LabelTreeVersionApi from '@/core/api/labelTreeVersion.js';
import LoaderBlockComponent from '@/core/components/loaderBlock.vue';
import LoaderComponent from '@/core/components/loader.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import Messages from '@/core/messages/store.js';
import NotificationsApi from '@/core/api/notifications.js';
import NotificationSettingsMixin from '@/core/mixins/notificationSettings.vue';
import PowerToggleComponent from '@/core/components/powerToggle.vue';
import ProjectsApi from '@/core/api/projects.js';
import SettingsModel from '@/core/models/Settings.js';
import SidebarComponent from '@/core/components/sidebar.vue';
import SidebarTabComponent from '@/core/components/sidebarTab.vue';
import TypeaheadComponent from '@/core/components/typeahead.vue';
import UsersApi from '@/core/api/users.js';
import VolumesApi from '@/core/api/volumes.js';
import {mount, declare, require} from './utils.js';

import {debounce, urlParams, throttle} from '@/core/utils.js';

import Events from '@/core/events.js';
import Keyboard from '@/core/keyboard.js';

import {Popover, Tab, Tabs} from 'uiv';

import {Resource} from 'vue-resource';

window.biigle = {};
window.biigle.$mount = mount;
window.biigle.$declare = declare;
window.biigle.$require = require;

biigle.$declare('api.annotations', AnnotationsApi);
biigle.$declare('api.images', ImagesApi);
biigle.$declare('api.labels', LabelsApi);
biigle.$declare('api.labelSource', LabelSourceApi);
biigle.$declare('api.labelTree', LabelTreeApi);
biigle.$declare('api.labelTreeVersion', LabelTreeVersionApi);
biigle.$declare('api.notifications', NotificationsApi);
biigle.$declare('api.projects', ProjectsApi);
biigle.$declare('api.users', UsersApi);
biigle.$declare('api.volumes', VolumesApi);
biigle.$declare('core.components.fileBrowser', FileBrowserComponent);
biigle.$declare('core.components.fileBrowserDirectory', FileBrowserDirectoryComponent);
biigle.$declare('core.components.loader', LoaderComponent);
biigle.$declare('core.components.loaderBlock', LoaderBlockComponent);
biigle.$declare('core.components.powerToggle', PowerToggleComponent);
biigle.$declare('core.components.sidebar', SidebarComponent);
biigle.$declare('core.components.sidebarTab', SidebarTabComponent);
biigle.$declare('core.components.typeahead', TypeaheadComponent);
biigle.$declare('messages', Messages);
biigle.$declare('messages.store', Messages); // Legacy support.
window.$biiglePostMessage = Messages.post; // Legacy support.
biigle.$declare('core.mixins.editor', EditorMixin);
biigle.$declare('core.mixins.loader', LoaderMixin);
biigle.$declare('core.mixins.notificationSettings', NotificationSettingsMixin);
biigle.$declare('core.models.Settings', SettingsModel);

biigle.$declare('utils.debounce', debounce);
biigle.$declare('utils.urlParams', urlParams);
biigle.$declare('urlParams', urlParams); // Legacy support.
biigle.$declare('utils.throttle', throttle);

biigle.$declare('echo', Echo);
biigle.$declare('events', Events);
biigle.$declare('keyboard', Keyboard);
biigle.$declare('core.keyboard', Keyboard); // Legacy support.

biigle.$declare('uiv.popover', Popover);
biigle.$declare('uiv.tab', Tab);
biigle.$declare('uiv.tabs', Tabs);

biigle.$declare('resource', Resource);
