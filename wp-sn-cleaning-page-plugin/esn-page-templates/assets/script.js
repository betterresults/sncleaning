/**
 * ESN Page Templates JavaScript
 */

jQuery(document).ready(function($) {
    
    // FAQ Toggle functionality
    window.toggleFAQ = function(index) {
        const content = document.getElementById('content-' + index);
        const icon = document.getElementById('icon-' + index);
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.textContent = '-';
            icon.style.transform = 'rotate(180deg)';
        } else {
            content.style.display = 'none';
            icon.textContent = '+';
            icon.style.transform = 'rotate(0deg)';
        }
    };

    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(event) {
        var target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 100
            }, 1000);
        }
    });

    // Phone number formatting
    $('a[href^="tel:"]').each(function() {
        var phoneNumber = $(this).attr('href').replace('tel:', '');
        var formattedNumber = phoneNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
        if ($(this).text().indexOf('Call') !== -1) {
            $(this).html($(this).html().replace(/\d+/, formattedNumber));
        }
    });

    // Add loading animation for buttons
    $('.btn-primary, .btn-secondary').on('click', function() {
        var $btn = $(this);
        var originalText = $btn.text();
        
        if (!$btn.hasClass('loading')) {
            $btn.addClass('loading');
            $btn.text('Loading...');
            
            setTimeout(function() {
                $btn.removeClass('loading');
                $btn.text(originalText);
            }, 2000);
        }
    });

});