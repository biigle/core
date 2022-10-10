import MessagesDisplay from './core/messages/display';
import NotificationsList from './core/notifications/list';
import NotificationsNavbarIndicator from './core/notifications/navbarIndicator';
import NotificationsUnreadCount from './core/notifications/unreadCount';
import SystemMessagesEditForm from './core/systemMessages/editForm';
import TopMenu from './core/topMenu';
import {mount} from './utils';

mount('top-menu', TopMenu);
mount('messages-display', MessagesDisplay);
mount('notifications-list', NotificationsList);
mount('notifications-navbar-indicator', NotificationsNavbarIndicator);
mount('notifications-unread-count', NotificationsUnreadCount);
mount('system-messages-edit-form', SystemMessagesEditForm);
