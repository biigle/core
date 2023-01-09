import AnnotationsApi from './core/api/annotations';
import Echo from './core/echo';
import EditorMixin from './core/mixins/editor';
import FileBrowserComponent from './core/components/fileBrowser';
import FileBrowserDirectoryComponent from './core/components/fileBrowserDirectory';
import ImagesApi from './core/api/images';
import LabelsApi from './core/api/labels';
import LabelSourceApi from './core/api/labelSource';
import LabelTreeApi from './core/api/labelTree';
import LabelTreeVersionApi from './core/api/labelTreeVersion';
import LoaderBlockComponent from './core/components/loaderBlock';
import LoaderComponent from './core/components/loader';
import LoaderMixin from './core/mixins/loader';
import Messages from './core/messages/store';
import NotificationsApi from './core/api/notifications';
import NotificationSettingsMixin from './core/mixins/notificationSettings';
import PowerToggleComponent from './core/components/powerToggle';
import ProjectsApi from './core/api/projects';
import SettingsModel from './core/models/Settings';
import SidebarComponent from './core/components/sidebar';
import SidebarTabComponent from './core/components/sidebarTab';
import TypeaheadComponent from './core/components/typeahead';
import UsersApi from './core/api/users';
import VolumesApi from './core/api/volumes';
import {mount, declare, require} from './utils';

import {debounce, urlParams, throttle} from './core/utils';

import Events from './core/events';
import Keyboard from './core/keyboard';

import Popover from 'uiv/dist/Popover';
import Tab from 'uiv/dist/Tab';
import Tabs from 'uiv/dist/Tabs';

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
