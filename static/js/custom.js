"use strict";

// :: Header

let header = document.getElementById('header');
let navbarToggler = document.getElementById('navbarToggler');


if (header) {
    function stickyHeader() {
        if (window.pageYOffset > 50) {
            header.classList.add("sticky");
        } else {
            header.classList.remove("sticky");
        }
    }

    window.addEventListener('load', stickyHeader);
    window.addEventListener('scroll', stickyHeader);

    navbarToggler.addEventListener('click', function () {
        header.classList.toggle("menu-expand");
    });
}

function mobileDropdownMenu() {
    let xenithAIdropdown = document.querySelectorAll('.dropdown-list').length;

    if (xenithAIdropdown > 0) {
        let navUrl = document.querySelectorAll('.navbar-nav li ul');
        let navUrlLen = navUrl.length;

        for (let i = 0; i < navUrlLen; i++) {
            navUrl[i].insertAdjacentHTML('beforebegin', '<div class="dropdown-toggler"><i class="fi-rr-angle-small-down"></i></div>');
        }

        let ddtroggler = document.querySelectorAll('.dropdown-toggler');
        let ddtrogglerlen = ddtroggler.length;

        for (let i = 0; i < ddtrogglerlen; i++) {
            ddtroggler[i].addEventListener('click', function () {
                let ddNext = ddtroggler[i].nextElementSibling;
                slideToggle(ddNext, 300);
            });
        }
    }
}

window.addEventListener('load', mobileDropdownMenu);

// :: Prevent default "a" click

let anchor = document.querySelectorAll('a[href="#"]');
let anchorLength = anchor.length;

if (anchorLength > 0) {
    for (let i = 0; i < anchorLength; i++) {
        anchor[i].addEventListener('click', function (e) {
            e.preventDefault();
        });
    }
}

// :: Service Card

const serviceCard = document.querySelectorAll('.service-card');

if (serviceCard.length > 0) {
    serviceCard.forEach((item) => {
        item.addEventListener('mouseover', () => {
            serviceCard.forEach((s) => {
                s.classList.remove('active');
            });

            item.classList.add('active');
        });
    });
}

const featureCard = document.querySelectorAll('.service-card-two');

if (featureCard.length > 0) {
    featureCard.forEach((item) => {
        item.addEventListener('mouseover', () => {
            featureCard.forEach((s) => {
                s.classList.remove('active');
            });

            item.classList.add('active');
        });
    });
}

// :: Password Visibility

let inputPasswordId = document.getElementById('Password');
let passwordButton = document.querySelector('.password-label');

if (inputPasswordId) {
    function passwordHideShow() {
        if (inputPasswordId.type === 'password') {
            inputPasswordId.type = 'text';
            passwordButton.innerHTML = '<i class="fi-rr-eye-crossed"></i>';
        } else {
            inputPasswordId.type = 'password';
            passwordButton.innerHTML = '<i class="fi-rr-eye"></i>';
        }
    }
    passwordButton.addEventListener('click', passwordHideShow);
}

// :: Scroll to Top

let scrollButton = document.getElementById('scrollToTop');
let topdistance = 600;

if (scrollButton) {
    window.addEventListener('scroll', function () {
        if (document.body.scrollTop > topdistance || document.documentElement.scrollTop > topdistance) {
            scrollButton.classList.add('scrolltop-show');
            scrollButton.classList.remove('scrolltop-hide');
        } else {
            scrollButton.classList.add('scrolltop-hide');
            scrollButton.classList.remove('scrolltop-show');
        }
    });

    scrollButton.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    });
}

// :: Testimonial Slider

if (document.querySelectorAll('.testimonial-slider').length > 0) {
    tns({
        'container': '.testimonial-slider',
        'items': 3,
        'gutter': 32,
        'slideBy': 1,
        'autoplay': true,
        'autoplayButtonOutput': false,
        'autoplayTimeout': 5000,
        'speed': 900,
        'loop': true,
        'mouseDrag': true,
        'nav': true,
        'navPosition': 'bottom',
        'controls': false,
        'center': true,
        'responsive': {
            320: {
                'items': 1
            },
            480: {
                'items': 1.4
            },
            576: {
                'items': 2
            },
            992: {
                'items': 3
            },
            1400: {
                'items': 4
            }
        }
    });
}

// :: Tooltip Activation

let tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
let tooltipList = tooltips.map(function (tooltipss) {
    return new bootstrap.Tooltip(tooltipss);
});

// :: Toast Activation

let toasts = [].slice.call(document.querySelectorAll('.toast'));
let toastList = toasts.map(function (toastss) {
    return new bootstrap.Toast(toastss);
});
toastList.forEach(toast => toast.show());

// :: Popover Activation

let popovers = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
let popoverList = popovers.map(function (popoverss) {
    return new bootstrap.Popover(popoverss);
});

// :: WOW Activation
const WowContainer = document.querySelectorAll('.wow');

if (WowContainer.length > 0) {
    new WOW().init();
}

// Dark Mode
var toggleSwitch = document.getElementById("darkSwitch");
var currentTheme = localStorage.getItem("theme");

if (currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
    if (currentTheme === "dark") {
        if (toggleSwitch) {
            toggleSwitch.checked = true;
        }
    }
}

function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    }
}

if (toggleSwitch) {
    toggleSwitch.addEventListener("change", switchTheme, false);
}

// :: Preloader

let preloader = document.getElementById('preloader');

if (preloader) {
    window.addEventListener('load', function () {
        let fadeOut = setInterval(function () {
            if (!preloader.style.opacity) {
                preloader.style.opacity = 1;
            }
            if (preloader.style.opacity > 0) {
                preloader.style.opacity -= 0.1;
            } else {
                clearInterval(fadeOut);
                preloader.remove();
            }
        }, 50);
    });
}
