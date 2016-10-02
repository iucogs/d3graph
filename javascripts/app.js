// JSHint configs
/*global Graph:false */

'use strict';

$(function(){
  var MAX_CONTENT_WIDTH = 800;
  var SMALL_SCREEN_WIDTH = 900;
  var smallScreen = false;

  $('#top-bar-wrapper').sticky({topSpacing:0});

  showScrollableContent();

  makeContentImageScrollable();

  updateElementPositionAndSize();
  $(window).resize(updateElementPositionAndSize);

  setupNavigation();

  function makeContentImageScrollable() {
    $(window).scroll(updateImagePosition);
    updateImagePosition();

    function updateImagePosition(){
      if(smallScreen) return;

      var windowHeight = $(window).height();

      $('.scroll-content').each(function(){
        var bodyScrollTop = $(window).scrollTop();
        var eleTop = $(this).position().top;
        var eleHeight = $(this).height();
        var contentVisible = (bodyScrollTop+windowHeight >= eleTop) &&
            (bodyScrollTop+windowHeight <= eleTop+eleHeight+windowHeight);

        if(contentVisible){
          var contentImage = $('.scroll-content-image', this);
          var contentImageTop = contentImage.data('initial-top');
          if(!contentImageTop){
            contentImageTop = parseInt(contentImage.css('top'));
            contentImage.data('initial-top', contentImageTop);
          }

          var imageHeight = contentImage.height();
          var scrollRange = imageHeight;
          var scrollRatial = scrollRange/(windowHeight+eleHeight);
          var scrollVal = bodyScrollTop+windowHeight - eleTop;
          var imageOffset = parseInt(scrollVal*scrollRatial);

          contentImage.css('top', contentImageTop+imageOffset);
        }
      });
    }
  }

  function updateElementPositionAndSize() {
    var offset = 20;

    var sidebarWidth = $('#sidebar').outerWidth();
    var contentWidth = $('.content-container').width();
    var windowWidth = $(window).width();
    smallScreen = windowWidth <= SMALL_SCREEN_WIDTH;

    // shrink content width when menu and sidebar overlap with main content
    if(!smallScreen){
      var newContentWidth = Math.min(windowWidth-sidebarWidth*2-offset*4, MAX_CONTENT_WIDTH);
      $('.content-container').width(newContentWidth);

      contentWidth = $('.content-container').width();
      var spaceWidth = (windowWidth-contentWidth)/2;
      var navWidth = $('#navigation').outerWidth();

      // update element positions
      var navLeft = spaceWidth - navWidth - offset;
      $('#navigation').css('left', navLeft);
      var sideRight = spaceWidth - sidebarWidth - offset;
      $('#sidebar').css('right', sideRight);
      $('#navigation, #sidebar').removeClass('hidden');
    }else{
      $('.content-container').width('');
    }

    // update cover height
    var windowHeight = $(window).height();
    var mainContentTop = $('#top-bar-wrapper').position().top;
    $('#cover').height(windowHeight-mainContentTop);


    $('#top-bar-wrapper-sticky-wrapper').height($('#top-bar-wrapper').height());
  }

  function showScrollableContent(argument) {
    $('.scroll-content').each(function(){
      var image = $('.scroll-content-image', this);
      var imageUrl = image.data('image');
      image.css('background', 'url('+imageUrl+') no-repeat center center');
      image.css('background-size', 'cover');
      $(this).removeClass('hidden');
    });
  }

  function setupNavigation() {
    var scrolling = false;
    var buttonSelector = '#navigation .button, #top-bar .menu .items a';

    $(buttonSelector).click(function(){
      var button = $(this);
      var target = $(button.data('target'));
      $('#top-bar .menu').hide();
      scrollTo(target);
      $(buttonSelector).removeClass('active');
      $(this).addClass('active');
      return false;
    });

    $('button[data-scroll-to], a[data-scroll-to]').click(function(){
      var target = $($(this).data('scroll-to'));
      scrollTo(target);
      return false;
    });

    function scrollTo(target){
      scrolling = true;
      var offset = $('#top-bar-wrapper').height();
      $('body, html').animate({'scrollTop': target.position().top-offset}, 1200, 'easeInOutQuint', function(){
        scrolling = false;
      });
    }

    $('#top-bar .menu-btn').click(function(){
      $('#top-bar .menu').show();
      return false;
    });
    $('#top-bar .close-btn').click(function(){
      $('#top-bar .menu').hide();
      return false;
    });


    $(window).scroll(function(){
      if(scrolling) return;
      checkActiveMenu();
    });

    var scrollOffset = 400;
    function checkActiveMenu() {
      console.log(smallScreen);
      var buttons = smallScreen ? $('#top-bar .menu .items a') : $('#navigation .button');
      var allInvisible = true;
      for (var i = buttons.length - 1; i >= 0; i--) {
        var button = $(buttons[i]);
        var target = $(button.data('target'));
        var visible = $(window).scrollTop()+scrollOffset > target.position().top &&
            $(window).scrollTop()+scrollOffset < (target.position().top + target.height());
        if(visible){
          buttons.removeClass('active');
          button.addClass('active');
          allInvisible = false;
          break;
        }
      }
      if(allInvisible){
        buttons.removeClass('active');
      }
    }
  }

  // d3.json('/data.json', function(error, data){
  //   updateGraphData(data);
  //   var graph = new Graph(data);
  //   graph.draw('#graph');
  //   graph.highlightHoveredNode(true);

  //   $('#graph').draggable();
  // });

  // var scale = 1;
  // var step = 0.2;
  // $('#zoom-in').click(function(){
  //   scale += step;
  //   $('#graph').css('transform', 'scale('+scale+')');
  // });

  // $('#zoom-out').click(function(){
  //   scale -= step;
  //   $('#graph').css('transform', 'scale('+scale+')');
  // });

  // $('#zoom-reset').click(function(){
  //   scale = 1;
  //   $('#graph').css('transform', 'scale('+scale+')');
  // });


  // function updateGraphData(data) {
  //   var nameMapIndex = {};
  //   for(var i = 0; i < data.nodes.length; i++){
  //     var node = data.nodes[i];
  //     node.index = i;
  //     node.title = node.name;
  //     node.type = node.group.toLowerCase();
  //     nameMapIndex[node.name] = node.index;
  //   }

  //   for(var j = 0; j < data.links.length; j++){
  //     var link = data.links[j];
  //     link.source = nameMapIndex[link.source];
  //     link.target = nameMapIndex[link.target];
  //   }
  // }
});
