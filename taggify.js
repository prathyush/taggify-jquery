/* jQuery library for slack style search  */

(function($) {
  'use strict';

  var debug_level = 2;
  var debug = function(msg) {
    if (debug_level > 0) {
      console.log(msg);
    }
  };

  var IS_MAC        = /Mac/.test(navigator.userAgent);

  var KEY_A         = 65;
  var KEY_COMMA     = 188;
  var KEY_RETURN    = 13;
  var KEY_ESC       = 27;
  var KEY_LEFT      = 37;
  var KEY_UP        = 38;
  var KEY_P         = 80;
  var KEY_RIGHT     = 39;
  var KEY_DOWN      = 40;
  var KEY_N         = 78;
  var KEY_BACKSPACE = 8;
  var KEY_DELETE    = 46;
  var KEY_SHIFT     = 16;
  var KEY_CMD       = IS_MAC ? 91 : 17;
  var KEY_CTRL      = IS_MAC ? 18 : 17;
  var KEY_TAB       = 9;
  var KEY_SPACE     = 32;

  var KEY_META      = 91;

  var delimitter = ' ';

  var modifier_help_key = '+';

  var modifier_helper_message = '';

  var modifiers = {'in:' : 'any component', 'function:': 'any function',
  'function_call:': 'any function'};

  // TODO: Look at sifter.

  var items = {
    'in': ['kernel', 'filesystems', 'drivers'],
    'function' : ['get_host_version', 'dummy_function'],
    'function_call' : ['same_stuff'],
  }

  var token_replace = function(src, token) {
    src = src.trim();
    return (src.substring(0, src.lastIndexOf(" ") + 1) + token)
  };

  $.fn.taggify = function(options) {
    debug($(this))
    var $input = $(this);

    var init_message = `
    <div id="searchbox-popover" class="autocompletebox default">
      <div class="header"><strong>Assisted Search</strong></div>
      <div class="content">Narrow your search with the following tags: in: => component, <definition type>: => definition</div>
    </div>`;

    var default_message = `
      <div class="header"><strong>Assisted Search</strong></div>
      <div class="content">Narrow your search with the following tags: in: => component, <definition type>: => definition</div>`;

    var popover_options = {
      trigger: 'click focus',
      placement: 'bottom',
      html: 'true',
      content: init_message
    };

    // For toggling the hover on suggestions.
    $('div.suggestion').on('hover focus', function() {
      var $this = $(this);
      var $children = $this.parent().find('suggestion');
      
      $children.removeClass('hovered');
      $this.addClass('hovered');
    });

/*
    $input.click(function() {
      var e = $(this);
      e.off('focus');
      if (e.val() == "") {
        e.popover(popover_options).popover('show');
      }
    });
*/
    //http://stackoverflow.com/questions/17437818/twitter-bootstrap-popover-trigger-how-to-set-multiple-triggers
    $input.popover(popover_options)
      .on('keyup', function(e) {

        debug(e);
        var inputbox = $(this);
        var show_default_message = false;

        /* Helper functions */
        var update_popover = function(message) {
          // TODO: This shouldn't be reloading the popover!. Dynamically load the
          // divs!.
          //var popover = inputbox.attr('data-content', message).data('bs.popover');
          //popover.setContent();
          inputbox.popover('show');
          $('.autocompletebox').html(message);
          return;
        };

        var update_query = function(query) {
          $('.autocompletebox .header .query').html('"'+query+'"');
        };
      
        var update_suggestions = function(suggestions) {
          debug(suggestions);
          // From AJAX.
        };

        /*
         tokens = {
            token : {
              modifier : "in:cerebro",
              text : "",
              hint-value: ""
            }
         }
         */
        var update_searchbox = function(token) {
          var input_val;
          var background_val;
          var hint_value_text;
          var hint_value = $('.background-container .hint-value');
          hint_value.text(' ');
          var token_classes;

          // Build up hint-value based on first suggestion
          var first_suggestion = $('div.suggestion').first();

          // For a space in the end or when a valid token is sent across
          // - we have to remove the incomplete class and move on.
          // So, if a span as token and modifier, we don't touch it.

          // Handle spaces.
          if (token == undefined) {
            var tokens = inputbox.val().split(' ');
            token = tokens[tokens.length - 1]
            if (token == "") {
              debug('oh a space')
              //TODO: Need to ease the spaces through.
              token = tokens[tokens.length - 2]
            }
          }

          if (token == undefined) {
            return;
          }
          debug('searchbox '+token)
          debug(modifiers)
          if (token in modifiers) {
            debug('got a modifier')
            token_classes = "modifier incomplete token";
            //inputbox.val(token_replace(inputbox.val(), token));
            hint_value_text = modifiers[token]
          }

          if ($('.background-container .token').length == 0) {
            debug('first token of the day')
            // Insert background_val before hint_value.
            $('.background-container .hint-value').
              before('<span class="token">'+token+'</span>')
          } else {
            // Update the last token.
            debug('updating the last token <'+token+'>')
            var last_token = $('.background-container .token').last();
            last_token.text(token);
            last_token.removeClass('modifier incomplete');
            last_token.addClass(token_classes);
            hint_value.text(hint_value_text);
            inputbox.val(token_replace(inputbox.val(), token));
          }
        };

        switch(e.keyCode) {
          case KEY_TAB:
            debug('tab it is');
            e.preventDefault();
            if (inputbox.val().trim().length == 0) {
              show_default_message = true;
              break;
            }
            // If the results are shown go find the next suggestion.
            if ($('#searchbox-popover').hasClass('results')) {
              debug('got results man');
              var first_suggestion = $('div.suggestion').first();
              var last_suggestion = $('div.suggestion').last();
              if ($('div.suggestion').hasClass('hovered')) {
                debug('already got a hover');
                var active_suggestion = $('div.suggestion.hovered');
                active_suggestion.removeClass('hovered');
                if (active_suggestion.is(last_suggestion)) {
                  debug('active is last')
                  first_suggestion.addClass('hovered');
                } else {
                  active_suggestion.next().addClass('hovered')
                }
              } else {
                first_suggestion.addClass('hovered');
              }
            }

            var replacement = $('div.suggestion.hovered').data('replacement')
            // Update the input value with a space separator.
            //inputbox.val(token_replace(inputbox.val(), replacement));
            update_searchbox(replacement);
            break;
          case KEY_META:
            if (inputbox.val().trim().length == 0) {
              show_default_message = true;
            }
            return;
          case KEY_ESC:
            debug('escape happened');
            inputbox.popover('hide');
            return;
          case KEY_BACKSPACE:
            debug('backspace<'+inputbox.val()+'>'+inputbox.val().length);
            if (inputbox.val().trim().length == 0) {
              show_default_message = true;
            }
            break;
          case KEY_RETURN:
            debug('fake submit');
            inputbox.popover('hide');
            return;
          case KEY_SPACE:
            debug('space happened, a lot of work to do here');
            break;
          default:
            break;
        }

        var update_results = false;
        if (show_default_message == true) {
          debug('showing default message')
          $('#searchbox-popover').removeClass('results').addClass('default');
          update_popover(default_message);
          // NOTE:
          $('.background-container .token').remove();
          $('.background-container .hint-value').text('');
          return;
        } else {
          debug(1)
          if ($('#searchbox-popover').hasClass('results')) {
            debug('got results, so updating them');
            update_results = true;
          } else {
            debug('showing results from default');
            $('#searchbox-popover').removeClass('default').addClass('results');
          }/*
          if ($('#searchbox-popover').hasClass('default')) {
            $('#searchbox-popover').removeClass('default').addClass('results');
            debug(2)
          } else if ($('#searcbox-popover').hasClass('results')){
            debug(3)
            update_results = true;
          } */
        }



        if (update_results == true) {
          debug('update_results is true')
          update_query(inputbox.val().trim());
          update_searchbox();
          return;
        }

        var tokens = inputbox.val().trim().split(delimitter);
        var last_token = tokens[tokens.length - 1];
        debug('value ' + inputbox.val().trim());
        var title  = '<div class="header"><span class="text-muted">Search ' +
                     'flash for </span><strong class="query">"' + inputbox.val() +
                     '"</strong><span class="text-muted">..</span>' +
                     '<span class="text-muted enter-key pull-right">Enter &crarr;</span></div>';

        var suggestions  = `
        <div class="content">
        <div class="modifier table">
          <div class="text-muted table-row modifier-header"><span "header-content">Components</span></div>
          <div class="suggestion table-row" data-replacement="in:cerebro">Cerebro</div>
          <div class="suggestion table-row" data-replacement="in:stargate">Stargate</div>
        </div>
        </div>`;

        var new_content = title + suggestions;
        update_popover(new_content);
        update_searchbox();
        $('#searchbox-popover').removeClass('default').addClass('results');

      }).on('keydown', function(e) {
        switch(e.keyCode) {
          case KEY_TAB:
            e.preventDefault();
            return;
          default:
          return;
        }
      }).on('focus', function(e) {
        // TODO: Handle the autocomplete menu here.
      }).on('blur', function(e) {
        // TODO: Always focus out.
        debug('blur');
      });
  };
})(jQuery);
