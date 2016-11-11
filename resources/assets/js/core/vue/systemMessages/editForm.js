/**
 * The a form that edits/creates a system message
 */
biigle.$viewModel('system-messages-edit-form', function (element) {
    // Set the initial content of the textarea to the 'body' model and then clear the
    // textarea before initializing Vue. Else Vue will complain that v-model does not
    // support initial inline data although we want to have it from a possible failed
    // validation.
    var textarea = element.querySelector('textarea[name="body"]');
    var body = '';
    if (textarea) {
        body = textarea.value;
        textarea.innerHTML = '';
    }

    new Vue({
        el: element,
        data: {
            body: body
        }
    });
});
