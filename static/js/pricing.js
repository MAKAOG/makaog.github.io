$(document).on('mouseover', '.current-plan', function () {
    $(this).find('span').text(trans('Renew Now'));
    $(this).find('i').removeClass('fi-rr-badge-check').addClass('fi-rr-refresh');
});

$(document).on('mouseout', '.current-plan', function () {
    $(this).find('span').text(trans('Current Plan'));
    $(this).find('i').removeClass('fi-rr-refresh').addClass('fi-rr-badge-check');
})
