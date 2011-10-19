// This is a manifest file that'll be compiled into including all the files listed below.
// Add new JavaScript/Coffee code in separate files in this directory and they'll automatically
// be included in the compiled file accessible from http://example.com/assets/application.js
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
//= require jquery
//= require jquery_ujs
//= require_tree .

$(document).ready(function(){
  // join on enter
  $('#ask input').keydown(function(event) {
    if (event.keyCode == 13) {
      $('#ask a').click();
    }
  })
  
  // join on click
  $('#ask a').click(function() {
    join($('#ask input').val());
    $('#ask').hide();
    $('#channel').show();
    $('input#message').focus();
  });

  var username;

  function join(name) {
    username = name || "anonymous";
    var host = window.location.host.split(':')[0];
    var container = $('div#msgs');
    
    var client = new Faye.Client('http://localhost:9292/faye');
    var subscription = client.subscribe('/chat', function(evt) {
      var obj = evt;
      if (typeof obj != 'object') return;

      var action = obj['action'];
      var struct = container.find('li.' + action + ':first');
      if (struct.length < 1) {
        // console.log("Could not handle: " + evt.data);
        return;
      }
      
      var msg = struct.clone();
      msg.find('.time').text((new Date()).toString("HH:mm:ss"));

      if (action == 'message') {
        var matches;
        if (matches = obj['message'].match(/^\s*[\/\\]me\s(.*)/)) {
          msg.find('.user').text(obj['user'] + ' ' + matches[1]);
          msg.find('.user').css('font-weight', 'bold');
        } else {
          msg.find('.user').text(obj['user']);
          msg.find('.message').text(': ' + obj['message']);
        }
      } else if (action == 'control') {
        msg.find('.user').text(obj['user']);
        msg.find('.message').text(obj['message']);
        msg.addClass('control');
      }
      
      if (obj['user'] == username) msg.find('.user').addClass('self');
      container.find('ul').append(msg.show());
      container.scrollTop(container.find('ul').innerHeight());
    });
    
    $('#channel form').submit(function(event) {
      event.preventDefault();
      var input = $(this).find(':input');
      var msg = input.val();
      client.publish('/control', {action: 'message', message: msg, user: username});
      input.val('');
    });
    
    subscription.callback(function() {
      client.publish('/control', {action: 'join', user: username});
    });
  }
});