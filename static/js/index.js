$(function () {
    let mark = function () {
        // Read the keyword
        let keyword = $("input[name='search']").val();

        // Remove previous marked elements and mark
        // the new keyword inside the context
        $(".blog-title").unmark({
            element: 'span',
            className: "text-warning",
            done: function () {
                $(".blog-title").mark(keyword);
            },
        });
    };

    $("input[name='search']").on("input", mark);

    mark();
});
