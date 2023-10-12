/*
 * @version 1.0.0
 * @link https://codecanyon.net/user/designing-world
 * @author Designing World
 * @copyright (c) 2023 Designing World
 * @license https://codecanyon.net/licenses/terms/regular
 */

"use strict";
let spinnerSM = `<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>`;
const CSRF_TOKEN = $('meta[name="csrf-token"]').attr('content')
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': CSRF_TOKEN
    }
});

$.fn.initFormValidation = function () {
    var validator = $(this).validate({
        errorClass: 'is-invalid text-danger',
        highlight: function (element, errorClass) {
            var elem = $(element);
            if (elem.hasClass("select2-hidden-accessible")) {
                $("#select2-" + elem.attr("id") + "-container").parent().addClass(errorClass);
            } else if (elem.hasClass('input-group')) {
                $('#' + elem.add("id")).parents('.input-group').append(errorClass);
            } else if (elem.hasClass('chat-input')) {
                // Do nothing
            } else {
                elem.addClass(errorClass);
            }
        },
        unhighlight: function (element, errorClass) {
            var elem = $(element);
            if (elem.hasClass("select2-hidden-accessible")) {
                $("#select2-" + elem.attr("id") + "-container").parent().removeClass(errorClass);
            } else {
                elem.removeClass(errorClass);
            }
        },
        errorPlacement: function (error, element) {
            var elem = $(element);
            if (elem.hasClass("select2-hidden-accessible")) {
                element = $("#select2-" + elem.attr("id") + "-container").parent();
                error.insertAfter(element);
            } else if (elem.parents().hasClass('iti--allow-dropdown')) {
                error.insertAfter(element.parent());
            } else if (elem.parent().hasClass('form-check')) {
                error.insertAfter(element.parent());
            } else if (elem.parent().hasClass('form-floating')) {
                error.insertAfter(element.parent().css('color', 'text-danger'));
            } else if (elem.parent().hasClass('input-group')) {
                error.insertAfter(element.parent());
            } else if (elem.parent().hasClass('custom-checkbox')) {
                error.insertAfter(element.parent());
            } else if (elem.parent().hasClass('message-form-footer')) {
                error.insertAfter(element.parent());
            } else {
                error.insertAfter(element);
            }
        }
    });

    $(this).on('select2:select', function () {
        if (!$.isEmptyObject(validator.submitted)) {
            validator.form();
        }
    });

    $.fn.initEmailMask = function () {
        new Inputmask({
            mask: "*{1,20}[.*{1,20}][.*{1,20}][.*{1,20}]@*{1,20}[.*{2,6}][.*{1,2}]",
            greedy: false,
            onBeforePaste: function (pastedValue) {
                pastedValue = pastedValue.toLowerCase();
                return pastedValue.replace("mailto:", "");
            },
            definitions: {
                "*": {
                    validator: '[0-9A-Za-z!#$%&"*+/=?^_`{|}~\-]', cardinality: 1, casing: "lower"
                }
            }
        }).mask(this);
    };
};

/**
 *
 * @param { function } callBack
 */
let stopAjaxFormSubmit = false;

$.fn.initFormSubmit = function (callBack = drawDataTable) {
    $(this).initFormValidation();

    let $this = $(this);
    let insideForm = $this.find('button[type="submit"]');

    let submitButton = insideForm.length ? insideForm : $(document).find('button[form="' + $this.attr('id') + '"]');
    let submitButtonText = submitButton.html();

    $(this).ajaxForm({
        dataType: 'json',
        beforeSubmit: function (arr, $form, options) {
            submitButton.prop('disabled', true);
            submitButton.html(spinnerSM);

            $this.trigger('formSubmitBefore', [arr, $form, options]);
            $this.trigger('ajaxFormSubmitBefore', [arr, $form, options]);

            if (stopAjaxFormSubmit) {
                submitButton.prop('disabled', false);
                submitButton.html(submitButtonText);

                return false;
            }
        },
        success: function (response) {
            submitButton.prop('disabled', false);
            if (!response) {
                location.reload();
            }
            if (response.redirect) {
                //Save to local storage
                if (response.message) {
                    localStorage.setItem('messageType', response.status);
                    localStorage.setItem('message', response.message);
                    localStorage.setItem('hasMessage', response.hasMessage);
                }
                window.location.href = response.redirect;
            } else if (response.two_factor) {
                window.location.href = '/two-factor-challenge';
            } else if (response.silent) {
                // Do nothing
            } else {
                if (response.type === 'warning' || response.status === 'warning') {
                    flash('warning', response.message);
                } else if (response.message) {
                    flash('success', response.message);
                } else {
                    flash('success', 'Successfully saved');
                }
            }

            if (response.reset) {
                $this[0].reset();
            }


            submitButton.html(submitButtonText);
            // Fire event for success
            $this.trigger('formSubmitSuccess', [response]);
            $this.trigger('ajaxFormSuccess', [response]);
        },
        error: function (response) {
            submitButton.prop('disabled', false);
            if (response.status == 0) {
                submitButton.prop('disabled', false);
                submitButton.html(submitButtonText);

                flash('error', 'Device is offline. Cannot complete request.\'');
                return;
            }

            const errors = response?.responseJSON;
            if (errors.redirect) {
                //Save to local storage
                if (errors.message) {
                    localStorage.setItem('messageType', errors.status);
                    localStorage.setItem('message', errors.message);
                    localStorage.setItem('hasMessage', errors.hasMessage);
                }
                window.location.href = errors.redirect;
            }

            if (errors?.type === 'warning') {
                flash('warning', response.message || response?.responseJSON?.message || 'Something went wrong');
            } else {
                flash('error', response.message || response?.responseJSON?.message || 'Something went wrong');
            }
            showInputErrors(errors);
            submitButton.html(submitButtonText);

            $this.trigger('formSubmitError', [response]);
            $this.trigger('ajaxFormError', [response]);
        },
        complete: function () {
            submitButton.prop('disabled', false);

            // Fire event for complete
            $this.trigger('formSubmitComplete');
            $this.trigger('ajaxFormComplete');
        }
    });
};

/**
 * Initialize Show error to each input
 * @param {Array} errors
 */

let showInputErrors = function (errors) {
    if (typeof errors !== 'object') {
        return;
    }

    $.each(errors['errors'], function (index, value) {
        $('#' + index + '-error').remove();

        let elem = $('#' + index);

        if (elem.parent().hasClass('input-group')) {
            elem.addClass('is-invalid')
                .parent()
                .after('<label id="' + index + '-error" class="is-invalid text-danger" for="' + index + '">' + value + '</label>')

        } else if (elem.parent().hasClass('form-check')) {
            elem.addClass('is-invalid')
                .parent()
                .after('<label id="' + index + '-error" class="is-invalid text-danger" for="' + index + '">' + value + '</label>')

        } else if (elem.parent().hasClass('form-floating')) {
            elem.addClass('is-invalid')
                .parent()
                .after('<label id="' + index + '-error" class="is-invalid text-danger" for="' + index + '">' + value + '</label>')

        } else {
            elem.addClass('is-invalid')
                .after('<label id="' + index + '-error" class="is-invalid text-danger" for="' + index + '">' + value + '</label>')
        }
    });
}

let drawDataTable = function () {
    if (typeof $.fn.DataTable === 'undefined') {
        return;
    }
    $('.dataTable').DataTable().draw(false);
    $('.check-all').prop('checked', false);
}

// Select2 Initialization
var select2FocusFixInitialized = false;
var initSelect2 = function () {
    // Check if jQuery included
    if (typeof jQuery == 'undefined') {
        return;
    }

    // Check if select2 included
    if (typeof $.fn.select2 === 'undefined') {
        return;
    }

    var elements = [].slice.call(document.querySelectorAll('[data-control="select2"]'));

    elements.map(function (element) {
        var options = {
            dir: document.body.getAttribute('direction')
        };

        if (element.getAttribute('data-hide-search')) {
            options.minimumResultsForSearch = Infinity;
        }

        if (element.hasAttribute('data-placeholder')) {
            options.placeholder = element.getAttribute('data-placeholder');
        }

        if (element.hasAttribute('data-tags')) {
            options.tags = true;
        }

        if (element.hasAttribute('data-allow-clear')) {
            options.allowClear = true;
        }

        options.theme = 'bootstrap-5';
        options.width = '100%';

        $(element).select2(options);
    });

    if (select2FocusFixInitialized === false) {
        select2FocusFixInitialized = true;

        $(document).on('select2:open', function () {
            var elements = document.querySelectorAll('.select2-container--open .select2-search__field');
            if (elements.length > 0) {
                elements[elements.length - 1].focus();
            }
        });
    }
};

let flash = function (type, message) {
    flasher.flash(type, message, {
        timeout: 3000,
    });
}


$(document).ready(function () {
    initSelect2();
});

$('.ajaxform').each(function () {
    $(this).initFormSubmit();
});

$(document).on('click', '.ajax-link', function (e) {
    e.preventDefault();

    let $this = $(this);
    let submitButton = $(this);
    let submitButtonText = submitButton.html();
    let url = $this.attr('href') || $this.data('url') || $this.attr('action');
    let method = $this.attr('method') || 'POST';

    submitButton.prop('disabled', true);
    submitButton.html(spinnerSM);

    $.ajax({
        url: url,
        method: method,
        success: function (response) {
            if (response.redirect) {
                //Save to local storage
                localStorage.setItem('messageType', response.status);
                localStorage.setItem('message', response.message);
                localStorage.setItem('hasMessage', response.hasMessage);
                window.location.href = response.redirect;
            } else {
                if (response.status === 'warning') {
                    flash('warning', response.message || response?.responseJSON?.message || trans('Operation successful'));
                } else {
                    flash('success', response.message || response?.responseJSON?.message || trans('Operation successful'));
                }
            }

            // Fire event for success
            $this.trigger('ajaxLinkSuccess', [response]);
        },
        error: function (response) {
            var errors = response?.responseJSON;
            if (errors.type === 'warning') {
                flash('warning', response.message || response?.responseJSON?.message || trans('Something went wrong'));
            } else {
                flash('error', response.message || response?.responseJSON?.message || trans('Something went wrong'));
            }
            showInputErrors(errors);
            submitButton.prop('disabled', false);
            submitButton.html(submitButtonText);

            $this.trigger('ajaxLinkError', response);
        },
        complete: function () {
            submitButton.prop('disabled', false);
            submitButton.html(submitButtonText);

            // Fire event for complete
            $this.trigger('ajaxLinkComplete');
        }
    });
})

//Find data-table and initialize
$('table').each(function () {
    // Check if table has data-table attribute
    if ($(this).attr('data-table')) {
        $(this).DataTable();
    }
});


// Check all checkbox
$(document).on('click', '.check-all', function () {
    let group = $(this).attr('data-group');

    let checkboxes = $('input[data-group-for="' + group + '"]');

    // Toggle all checkboxes
    checkboxes.prop('checked', $(this).prop('checked'));
});

// Check all checkboxes if all checkboxes are checked
$(document).on('change', 'input[data-group-for]', function () {
    let group = $(this).attr('data-group-for');

    let checkboxes = $('input[data-group-for="' + group + '"]');

    // Toggle all checkboxes
    if (checkboxes.length === checkboxes.filter(':checked').length) {
        $('.check-all[data-group="' + group + '"]').prop('checked', true);
    } else {
        $('.check-all[data-group="' + group + '"]').prop('checked', false);
    }
});

//Confirm delete
$(document).on('click', 'a.confirm-delete', function (e) {
    e.preventDefault();

    let url = $(this).attr('href');
    let dataRemovableId = $(this).attr('data-removable-id');
    let dataRemovableElement = $(this).closest('div[data-removable]');

    let button = $(this);
    let oldButton = $(this).html();

    $.confirm({
        title: 'Are you sure!',
        content: 'Request cannot be undone!',
        theme: 'modern',
        icon: ' fi-rr-trash',
        autoClose: 'cancel|8000',
        buttons: {
            confirm: {
                btnClass: 'btn-danger', action: function () {
                    button.html(spinnerSM)
                    $.ajax({
                        url: url,
                        method: 'DELETE',
                        accept: 'application/json',
                        beforeSend: function () {
                            button.addClass('disabled');
                        },
                        success: function (response) {
                            if (response.redirect) {
                                //Save to local storage
                                localStorage.setItem('messageType', response.status);
                                localStorage.setItem('message', response.message);
                                localStorage.setItem('hasMessage', response.hasMessage);
                                window.location.href = response.redirect;
                                return;
                            }

                            flash(response.status, response.message);
                            drawDataTable();

                            button.trigger('confirmDeleteSuccess', [response]);

                            if (dataRemovableId !== undefined && dataRemovableElement !== undefined) {
                                $(dataRemovableElement).remove();
                            }
                        },
                        error: function (response) {
                            button.trigger('confirmDeleteError', [response]);
                            flash('error', response.message || response.responseJSON.message || 'Something went wrong');
                            button.removeClass('disabled');
                        },
                        complete: function () {
                            button.trigger('confirmDeleteComplete');
                            button.html(oldButton);
                            button.removeClass('disabled')
                        }
                    })
                }
            }, cancel: function () {
            }
        }
    });
})

//Confirm action
$(document).on('click', 'a.confirm-action', function (e) {
    e.preventDefault();

    let url = $(this).attr('href');
    let method = $(this).attr('data-method') || 'POST';
    let icon = $(this).attr('data-icon') || 'fi-rr-seal-exclamation';
    let title = $(this).attr('data-title') || $(this).attr('title') || trans('Are you sure!');
    let message = $(this).attr('data-message') || trans('Request cannot be undone!');
    let hasLoader = $(this).attr('data-has-loader') || false;
    let thisEl = $(this);
    let oldButton = $(this).html();

    $.confirm({
        title: title,
        content: message,
        theme: 'modern',
        icon: icon + ' text-warning mb-3',
        autoClose: 'cancel|8000',
        buttons: {
            confirm: {
                btnClass: 'btn-warning', action: function () {
                    $.ajax({
                        beforeSend: function (xhr) {
                            if (hasLoader) {
                                thisEl.html(spinnerSM);
                            }
                        },
                        url: url,
                        method: method,
                        accept: 'application/json',
                        success: function (response) {
                            if (response.redirect) {
                                //Save to local storage
                                localStorage.setItem('messageType', response.status);
                                localStorage.setItem('message', response.message);
                                localStorage.setItem('hasMessage', response.hasMessage);
                                window.location.href = response.redirect;
                                return;
                            }

                            flash(response.status, response.message);
                            drawDataTable();

                            $(document).trigger('confirmActionSuccess', [response]);
                            thisEl.html(oldButton);

                            if (dataRemovableId !== undefined && dataRemovableElement !== undefined) {
                                $(dataRemovableElement).remove();
                            }
                        },
                        error: function (response) {
                            $(document).trigger('confirmActionError', [response]);
                            flash('error', response.message || response.responseJSON.message || 'Something went wrong');
                            thisEl.html(oldButton);
                        },
                    })
                }
            }, cancel: function () {
            }
        }
    });
})

// Show message from local storage
$(document).ready(function () {
    let hasMessage = localStorage.getItem('hasMessage') || false;
    let message = localStorage.getItem('message') || null;
    let type = localStorage.getItem('messageType') || null;

    if (hasMessage && message !== null && type !== null) {
        flash(type, message);
        localStorage.removeItem('hasMessage');
        localStorage.removeItem('message');
        localStorage.removeItem('messageType');
    }
})

// Clipboard
let initClipboard = function () {
    if ($(document).find('.btn-clipboard').length > 0) {
        if (typeof ClipboardJS === 'undefined') {
            alert('ClipboardJS is not loaded');
            return;
        }

        var clipboard = new ClipboardJS('.btn-clipboard');

        // Add check icon on success and remove icon after 2 seconds

        clipboard.on('success', function (e) {
            flash('success', 'Copied to clipboard');
            e.clearSelection();

            let $btn = $(e.trigger);
            let $btnText = $btn.html();

            $btn.html('<i class="fi-rr-check"></i>');
            setTimeout(function () {
                $btn.html($btnText);
            }, 1000)
        });

        clipboard.on('error', function (e) {
            flash('error', 'Something went wrong');
        });
    }
}
initClipboard();

function initCkeditor5() {
    const $ckeditor5 = document.querySelectorAll('[data-control="ckeditor5"]')

    $ckeditor5.forEach(function (el) {
        createCkeditor5(el)
    })
}

let ckeditors = []

function createCkeditor5(element) {
    // Check if ClassicEditor is loaded
    if (typeof ClassicEditor === 'undefined') {
        flash('error', 'ClassicEditor is not loaded');
        return;
    }

    if (typeof element === 'string') {
        element = document.querySelector(element)
    }

    return ClassicEditor
        .create(element, {
            on: {
                pluginsLoaded: function (event) {
                    event.editor.dataProcessor.dataFilter.addRules({
                        elements: {
                            script: function (element) {
                                alert('Script tags are not allowed');
                                return false;
                            }
                        }
                    });
                }
            }
        })
        .then(newEditor => {
            newEditor.model.document.on('change:data', (evt, data) => {
                element.value = newEditor.getData();
            });

            ckeditors[element.id] = newEditor;

            return newEditor;
        })
        .catch(error => {
            flash('error', error)
        });
}

initCkeditor5()

function initRichText() {
    let $richText = $('[data-control="richText"]');
    if ($richText.length > 0) {
        $richText.each(function () {
            let $this = $(this);

            $($this).richText();
        })
    }
}

initRichText()

/**
 * Create a new instance of FilePond
 * @param name
 * @param id
 * @param image
 */
let initMediaLibrary = function (name, id, image = null) {
    let url = route('admin.customization.media-library.index');
    let input = document.getElementById(id);

    FilePond.registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateSize);

    const inputElement = document.getElementById(`filepond_${id}`);

    const pond = FilePond.create(inputElement, {
        credits: false,
        allowMultiple: false,
        labelIdle: `<button type="button" class="border-0 filepond--label-action open-by-input" data-input-id="${id}" data-bs-toggle="modal" data-bs-target="#mediaLibrary">File Manager</button>, Drop & Drag or <span class="filepond--label-action">Browse</span>`, // labelIdle: `<button type="button" class="border-0 filepond--label-action open-by-input" data-input-id="${id}" data-bs-toggle="modal" data-bs-target="#mediaLibrary">File Manager</button>`,
        server: {
            process: (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
                const formData = new FormData();
                formData.append(fieldName, file, file.name);

                const request = new XMLHttpRequest();
                request.open('POST', url);
                request.setRequestHeader('X-CSRF-TOKEN', $('meta[name="csrf-token"]').attr('content'));

                request.upload.onprogress = (e) => {
                    progress(e.lengthComputable, e.loaded, e.total);
                };

                request.onload = function () {
                    if (request.status >= 200 && request.status < 300) {
                        load(request.responseText);

                        // Append the uploaded file to the file manager
                        let file = JSON.parse(request.responseText);
                        document.getElementById(input.value = file.url);

                    } else {
                        // Can call the error method if something is wrong, should exit after
                        error('oh no');
                    }
                };

                request.send(formData);

                // Should expose an abort method so the request can be cancelled
                return {
                    abort: () => {
                        // This function is entered if the user has tapped the cancel button
                        request.abort();

                        // Let FilePond know the request has been cancelled
                        abort();
                    },
                };
            },
        },
    })

    if (image) {
        pond.addFile(image)
        pond.setOptions({
            instantUpload: false, allowProcess: false,
        })
        document.getElementById(input.value = image);
    }

    // Event listener for when a file is removed
    pond.on('removefile', (e) => {
        input.value = '';

        pond.setOptions({
            instantUpload: true, allowProcess: true,
        })
    });
}

/**
 * Configure FilePond Assets
 */
let initFilePondAssets = function () {
    let mediaLibraryPage = 1;
    let mediaLibraryUrl = route('admin.customization.media-library.index');
    let loaded = false;
    let setUrlInput = null;
    let inputId = null;

    $(document).on('click', '.open-by-input', function (e) {
        let input = $(this).data('input-id');
        setUrlInput = $(`#${input}`);
        inputId = input;
    })

    $(document).on('click', '.btn-use-media', function (e) {
        let url = $(this).data('media-url');

        if (setUrlInput) {
            setUrlInput.val(url);

            $('#mediaLibrary').modal('hide')

            let pond = FilePond.find(document.getElementById('filepond_' + inputId))

            pond.setOptions({
                allowDrop: false,
                allowBrowse: false,
                allowPaste: false,
                allowMultiple: false,
                allowReorder: false,
                allowReplace: false,
                allowRevert: false,
                allowProcess: false,
                instantUpload: false,
                maxFileSize: '2MB',
                files: [{
                    source: url
                }]
            })

            pond.on('removefile', (e) => {
                setUrlInput.val('');
            });
        }
    })

    let mediaLibraryLoadMedia = function () {
        let mediaLibraryFileNotFound = $('#mediaLibraryFileNotFound');
        let mediaLibraryLoadMoreButton = $('#mediaLibraryLoadMore');
        let mediaLibraryLoadMoreHtml = mediaLibraryLoadMoreButton.html();

        mediaLibraryLoadMoreButton.html(spinnerSM)

        $.ajax({
            url: mediaLibraryUrl,
            type: 'GET',
            data: {
                page: mediaLibraryPage
            },
            success: function (data) {
                if (data.data.length > 0) {
                    mediaLibraryFileNotFound.remove();
                    if (data.links.next == null) {
                        mediaLibraryLoadMoreButton.remove()
                    }
                    mediaLibraryPage++;

                    $.each(data.data, function (index, value) {
                        mediaLibraryAddItem(value)
                    })
                }
            },
            complete: function () {
                mediaLibraryLoadMoreButton.html(mediaLibraryLoadMoreHtml);

                initClipboard();
                initTooltip();
                lazyLoad();
            }
        })
    }

    let mediaLibraryAddItem = function (value, type = 'append') {
        //ignore if already exists
        if ($(`[data-removable-id="${value.id}"]`).length) {
            return
        }

        let html = `
        <div class="col-sm-6 col-lg-3" data-removable>
            <div class="card wow fadeInUp shadow-sm" data-wow-delay="0.2s">
                <div class="p-4">
                    <div class="text-center">
                        <div class="mb-4">
                            <img class="rounded-2" src="/assets/images/loading.webp" data-src="${value.thumb}" alt="" loading="lazy">
                        </div>
                        <h6>${value.name}</h6>
                        <p class="text-small">${value.size}</p>

                        <button type="button" class="btn btn-circle btn-secondary btn-sm btn-use-media" data-media-url="${value.url}" title="Click to use">
                            <i class="fi-rr-cursor"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`
        if (type === 'append') {
            $('#media-library-modal-container').append(html)
        } else {
            $('#media-library-modal-container').prepend(html)
        }
    }

    const myModalEl = document.getElementById('mediaLibrary')
    myModalEl.addEventListener('shown.bs.modal', event => {
        // Load Images
        if (!loaded) {
            mediaLibraryLoadMedia()

            $('#mediaLibraryLoadMore').on('click', function () {
                mediaLibraryLoadMedia()
            })

            loaded = true;
        }

        initClipboard();
        lazyLoad();
        initTooltip();
    })
}

/**
 * Initialize Media Library
 */
$('[data-init-media-library]').each(function () {
    const name = $(this).data('name');
    const id = $(this).data('id');
    const image = $(this).data('image');

    initMediaLibrary(name, id, image);
})

/**
 * Initialize FilePond Assets
 *
 */
if ($('#initFilePondAssets').val() == 1) {
    initFilePondAssets();
}

// select2 change to visit
$("[data-select2-url]").each(function () {
    $(this).on('change', function () {
        window.location.href = $(this).select2().find(":selected").data("url");
    })
});

// Init select2 ajax search
$('[data-control="search"]').each(function () {
    let url = $(this).data('url');
    $(this).select2({
        width: '100%', theme: 'bootstrap-5', ajax: {
            url: url, dataType: 'json', delay: 250, data: function (params) {
                return {
                    q: params.term, // search term
                    page: params.page
                };
            }, processResults: function (data, params) {
                params.page = params.page || 1;

                return {
                    results: data.data, pagination: {
                        more: (params.page * 30) < data.total
                    }
                };
            }, cache: true
        }, minimumInputLength: 1, templateResult: formatTemplate, templateSelection: formatTemplateSelection
    });

    function formatTemplate(customer) {
        if (customer.loading) {
            return customer.text;
        }

        return $("<div>" + customer.text + "</div>");
    }

    function formatTemplateSelection(repo) {
        return repo.text;
    }

});

let initRequiredLabel = function () {
    $('input[required], select[required], textarea[required]').each(function () {
        // Check if label already has asterisk
        if ($(this).parents('.form-group').find('label:first').text().indexOf('*') == -1) {
            $(this).parents('.form-group').find('label:first').append(' <span class="text-danger">*</span>')
        } else {
            $(this).parents('.form-group')
                .find('label:first').addClass('required')
        }
    })

    // Remove required label
    $('input:not([required]), select:not([required]), textarea:not([required])').each(function () {
        $(this).parents('.form-group')
            .find('label:first').removeClass('required')
    })
}

$(document).ready(function () {
    initRequiredLabel();
})

function randomString(length = 10) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function stripTags(html) {
    return html.replace(/(<([^>]+)>)/gi, "");
}

function exportPlainText(text, filename) {
    const blob = new Blob([text], {type: 'text/plain'});
    saveAs(blob, filename);

    flash('success', trans('Text Exported successfully'))
}

function exportDocx(content, filename) {
    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>New Document</title></head><body>";
    const postHtml = "</body></html>";
    const html = preHtml + content + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });

    saveAs(blob, filename);

    flash('success', trans('Document Exported successfully'))
}

function exportPDF(content, filename) {

}

function saveAs(blob, filename) {
    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        let elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}

function trans(key, replaces = null) {
    let translations = JSON.parse(localStorage.getItem('translations'));
    const locale = $('html').attr('lang');

    const expirationTime = localStorage.getItem('translationsExpirationTime');

    // Check if expiration time is expired
    if (expirationTime && expirationTime < new Date().getTime()) {
        localStorage.removeItem('translations');
        localStorage.removeItem('translationsExpirationTime');
        translations = null;
    }

    let notFoundKey = function (key) {
        for (const placeholder in replaces) {
            if (replaces.hasOwnProperty(placeholder)) {
                const value = replaces[placeholder];
                key = key.replace(':' + placeholder, value);
            }
        }

        return key;
    }

    // Check if translations is null
    if (!translations) {
        $.ajax({
            url: route('translations', {locale}),
            dataType: 'json',
            type: 'GET',
            success: function (translations) {
                const expirationTime = new Date().getTime() + (30 * 60 * 1000);
                localStorage.setItem('translationsExpirationTime', expirationTime.toString());

                localStorage.setItem('translations', JSON.stringify(translations));
            }
        });

        return getTranslation()
    } else {
        return getTranslation()
    }

    function getTranslation() {
        if (translations && translations.hasOwnProperty(key)) {
            for (const placeholder in replaces) {
                if (replaces.hasOwnProperty(placeholder)) {
                    const value = replaces[placeholder];
                    translations[key] = translations[key].replace(':' + placeholder, value);
                }
            }

            return translations[key];
        } else {
            return notFoundKey(key);
        }
    }
}

// Demo login buttons
$('#demoLoginSuperadmin').on('click', function () {
    $('#email').val('superadmin@demo.com');
    $('#password').val('password');

    $('.ajaxform').submit();
});

$('#demoLoginUser').on('click', function () {
    $('#email').val('user@demo.com');
    $('#password').val('password');
    $('.ajaxform').submit();
});

// ChartJS
let initChartJS = function (ctx, dataLabel) {
    if (typeof Chart === 'undefined') {
        alert('ChartJS is not loaded');
        return;
    }

    let chart = new Chart(ctx, {
        type: 'line', data: {
            datasets: [{
                label: dataLabel,
                backgroundColor: ['rgba(255, 193, 7, 0.2)'],
                borderColor: ['rgba(255, 193, 7, 1)'],
                pointBackgroundColor: '#ffffff',
                pointRadius: 4,
                fill: true,
                cubicInterpolationMode: 'monotone',
                tension: 0.4
            }]
        }, options: {
            plugins: {
                legend: {
                    display: false
                },
            }, responsive: true, interaction: {
                intersect: false,
            }, scales: {
                x: {
                    display: true, title: {
                        display: true
                    }
                }, y: {
                    display: true, suggestedMin: 0, suggestedMax: 10
                }
            }
        },
    });
    // Check if ctx is string
    if (typeof ctx === 'string') {
        document.getElementById(ctx).style.display = 'unset';
    }

    return chart;
}

// Payment Gateways
let initRazorpayWebCheckout = function (data) {
    if (typeof Razorpay == 'undefined') {
        alert("Razorpay SDK is not loaded. Please check your internet connection")
        return;
    }

    const planTag = document.getElementById('plan');

    let options = {
        "key": data.key,
        "amount": data.amount,
        "currency": data.currency,
        "description": data.description,
        "image": data.image,
        "prefill": {
            "name": data.prefill.name, "email": data.prefill.email, "contact": data.prefill.contact
        },
        "handler": function (response) {
            document.getElementById('razorpay_payment_id').value = response.razorpay_payment_id;
            document.getElementById('confirmForm').submit();
        },
        "modal": {
            "ondismiss": function () {
                localStorage.setItem('messageType', 'error');
                localStorage.setItem('message', trans('Payment Cancelled'));
                localStorage.setItem('hasMessage', true);

                location.href = route('user.settings.checkout.index', {plan: planTag.value});
            }
        }
    };

    let rzp1 = new Razorpay(options);

    document.onload = function (e) {
        document.getElementById('rzp-button1').click();
        e.preventDefault();
    }

    document.getElementById('rzp-button1').onclick = function (e) {
        rzp1.open();
        e.preventDefault();
    }
}

let initBraintreeDropUi = function (transaction, authorization, button, selector) {
    if (typeof braintree == 'undefined') {
        alert("Braintree SDK is not loaded. Please check your internet connection")
        return;
    }

    let braintreeSubmitBtn = document.querySelector(button);

    braintree.dropin.create({
        authorization, selector,
    }, function (err, instance) {
        braintreeSubmitBtn.addEventListener('click', function () {
            instance.requestPaymentMethod(function (err, payload) {
                if (err) {
                    console.log(err);
                    return;
                }

                braintreeSubmitBtn.remove();

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = route('payment.braintree.callback', {transaction});
                form.style.display = 'none';

                const nonce = document.createElement('input');
                nonce.type = 'hidden';
                nonce.name = 'nonce';
                nonce.value = payload.nonce;
                form.appendChild(nonce);

                const _token = document.createElement('input');
                _token.type = 'hidden';
                _token.name = '_token';
                _token.value = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                form.appendChild(_token);

                document.body.appendChild(form);
                form.submit();
            });
        })
    });
}

let initStripePayment = function (publishable_key) {

    // Create a Stripe client.
    const stripe = Stripe(publishable_key);
    // Create an instance of Elements.
    const elements = stripe.elements();
    const card = elements.create('card', {
        style: {
            base: {
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        }
    })

    // Add an instance of the card Element into the `card-element` <div>.
    card.mount('#card-element');

    // Handle real-time validation errors from the card Element.
    card.addEventListener('change', function (event) {
        var displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });


    // Handle form submission.
    const form = document.getElementById('payment-form');
    const submit_btn = document.getElementById('submit_btn');
    const submit_btn_html = submit_btn.innerHTML;

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        submit_btn.disabled = true;
        submit_btn.innerHTML = spinnerSM;

        stripe.createToken(card)
            .then(function (result) {
                if (result.error) {
                    submit_btn.disabled = false;
                    submit_btn.innerHTML = submit_btn_html;
                    // Inform the user if there was an error.
                    var errorElement = document.getElementById('card-errors');
                    errorElement.textContent = result.error.message;
                } else {
                    // Send the token to your server.
                    stripeTokenHandler(result.token);
                }
            });
    });

    // Submit the form with the token ID.
    function stripeTokenHandler(token) {
        // Insert the token ID into the form, so it gets submitted to the server
        const form = document.getElementById('payment-form');
        const hiddenInput = document.createElement('input');
        hiddenInput.setAttribute('type', 'hidden');
        hiddenInput.setAttribute('name', 'stripeToken');
        hiddenInput.setAttribute('value', token.id);
        form.appendChild(hiddenInput);
        // Submit the form
        form.submit();
    }
}

// Lazy Load Images on scroll
function lazyLoad() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
        if (img.getBoundingClientRect().top <= window.innerHeight && img.getBoundingClientRect().bottom >= 0) {
            // Create a new image object
            const newImg = new Image();

            // Add a load event listener to the new image object
            newImg.addEventListener('load', function () {
                // Replace the placeholder image with the new image
                img.src = newImg.src;
                img.removeAttribute('data-src');
            });

            // Set the source of the new image object to the data-src of the placeholder image
            newImg.src = img.dataset.src;
        }
    });
}

window.addEventListener('scroll', lazyLoad);
window.addEventListener('resize', lazyLoad);
window.addEventListener('orientationchange', lazyLoad);

lazyLoad();

// Check if dataTables is loaded
if (typeof $.fn.dataTable !== 'undefined') {
    $.extend(true, $.fn.dataTable.defaults, {
        mark: true
    });
}

const initTooltip = (options = {}) => {
    const elements = document.querySelectorAll('[title]');

    elements.forEach((element) => {
        element.addEventListener('mouseenter', (event) => {
            event.preventDefault();
        });

        element.addEventListener('mouseleave', (event) => {
            event.preventDefault();
        });

        const title = element.getAttribute('title');
        element.removeAttribute('title');

        const placement = element.dataset.placement || 'top';

        // Check if is element has #check-all-roles id
        if (element.id === 'check-all-roles') {
            return;
        }

        if (typeof tippy !== 'undefined') {
            tippy(element, {
                ...options,
                content: title,
                theme: 'material',
                allowHTML: true,
                placement,
                onShow(instance) {
                    if (instance.props.content === '') {
                        instance.hide();
                    }

                    // check if data-img is set
                    if (element.dataset.img) {
                        // create a new image element
                        const img = new Image();
                        // set the src of the image to the value of data-img
                        img.src = element.dataset.img;
                        // set the width of the image to 200px
                        img.style.width = '200px';
                        // set the height of the image to 200px
                        img.style.height = '200px';
                        // set the content of the tooltip to the image
                        instance.setContent(img);
                    }
                },
            });
        }
    });
};

initTooltip();

const initDateTimePicker = (selector, options) => {
    if (typeof tempusDominus === 'undefined') {
        alert("Tempus Dominus SDK is not loaded.");
        return;
    }

    let element;

    // Check if element is a jQuery object
    if (typeof selector === 'object' && selector instanceof jQuery) {
        element = selector[0];
    }

    // Check if element is a DOM element
    if (typeof selector === 'object' && selector.nodeType === 1) {
        element = selector;
    }

    // Check if element is a string
    if (typeof selector === 'string') {
        element = document.querySelector(selector);
    }

    //Disable input from keyboard
    element.setAttribute('readonly', 'true');

    return new tempusDominus.TempusDominus(element, {
        display: {
            icons: {
                type: 'icons',
                time: 'fi-rr-clock-three',
                date: ' fi-rr-calendar',
                up: 'fi-rr-up',
                down: 'fi-rr-down',
                previous: 'fi-rr-left',
                next: 'fi-rr-right',
                today: 'fi-rr-calendar-check',
                clear: ' fi-rr-apps-delete',
                close: 'fi-rr-circle-xmark'
            },
            theme: 'light',
        },
        localization: {
            format: 'MM/dd/yyyy hh:mm T',
        },
        ...options
    });
}

$('.current-plan').on('mouseenter', function () {
    $(this).find('span').text(trans('Renew Plan'));
    $(this).find('i').removeClass('fi-rr-badge-check').addClass('fi-rr-refresh');
});

$('.current-plan').on('mouseleave', function () {
    $(this).find('span').text(trans('Current Plan'));
    $(this).find('i').removeClass('fi-rr-refresh').addClass('fi-rr-badge-check');
});


if (window.self !== window.top) {
    $.confirm({
        title: trans('Iframe Detected'),
        content: trans('Please visit this page directly from your browser'),
        theme: 'modern',
        icon: 'fi-rr-window-restore',
        buttons: {
            "Live Preview": {
                btnClass: 'btn-primary',
                action: function () {
                    // Open in new tab
                    window.open(window.location.href, '_blank');

                    return false;
                }
            }
        }
    });
}

