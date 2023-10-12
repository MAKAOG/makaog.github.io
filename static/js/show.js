const hasDisqus = document.getElementById('hasDisqus').value;

if (hasDisqus === 1) {
    var disqus_config = function () {
        this.page.url = document.getElementById('blogUrl').value;
        this.page.identifier = document.getElementById('blogId').value;
    };

    (function () { // DON'T EDIT BELOW THIS LINE
        var d = document, s = d.createElement('script');
        s.src = 'https://'+ document.getElementById('shortName').value +'.disqus.com/embed.js';
        s.setAttribute('data-timestamp', + new Date());
        (d.head || d.body).appendChild(s);
    })();
}


$('#likeBtn, #dislikeBtn').on('ajaxLinkSuccess', function (e, data) {
    $(this).on('ajaxLinkComplete', function () {
        $(this).find('span').text(data.count);
    })
})
