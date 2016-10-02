/*jslint latedef:false */
/*global D3RGraph:true, Handlebars:true, APA:true */

(function(){

  'use strict';


  var AUTHORS_URL = 'http://www.indiana.edu/~cogsci25/ruth/authors.php';
  var HEADSHOTS_URL = './images/headshots@34.json';
  var HEADSHOT_DEFAULT = './images/headshot-default.jpg';
  var API_REPRESENTATION_PUBLICATIONS = 'http://nupubs.cogs.indiana.edu/citation/rep_pubs/';
  var API_CITATIONS = 'http://nupubs.cogs.indiana.edu/citation/'

  var headshots;
  var  departments;
  var SEARCH_RESULTS_LIMIT = 7;

  var LINK_COAUTHORED = 'ca';
  var LINK_COMMITTEE = 'dc';
  var LINK_COAUTHORED_COMMITTEE = 'cadc';
  var LINK_ADVISOR_ADVISEE = 'adav';
  var LINK_STYLES = {};
  LINK_STYLES[LINK_COMMITTEE] = {
    lineStrokeDasharray: '10,5'
  };
  LINK_STYLES[LINK_COAUTHORED_COMMITTEE] = {
    lineStrokeDasharray: '20,3,3,3,3,3'
  };
  LINK_STYLES[LINK_ADVISOR_ADVISEE] = {
    lineStrokeDasharray: '15, 10, 5, 10, 15'
  };

  var NODE_STYLES = {
    'faculty': {
      circleStroke: '#4F8F00'
    },
    'alumni': {
      circleStroke: '#005493'
    },
    'undergrad': {
      circleStroke: '#FF9300'
    },
    'grad': {
      circleStroke: '#941100'
    }
  };


  $(function(){
    jQueryConfig();
    updateElementPositions();
    $(window).resize(updateElementPositions);

    if(isUnsupportedBrowser()){
      $('#unsupported').removeClass('hidden');
      return;
    }

    loadDataAndDisplayGraph(AUTHORS_URL);
  });

/*Loading the data and displaying the data using the graph-headshots-template
Loads the data using the AUTHORS_URL: 'http://www.indiana.edu/~cogsci25/ruth/authors.php'
Node structure
{"name":"Ahn, Yong-Yeol",
"departments":["SOIC"],
"titles":["Assistant Professor"],
"username":"yyahn",
"status":"faculty",
"headshot":"http:\/\/cogs.indiana.edu\/people\/faculty_pictures\/yyahn.jpg"}


Link structure
"source":"Kruschke, John",
"target":"Nosofsky, Robert",
"count":"5",
"citations":[21882,36467,36476,36500,36501],
"committees":[["Nobel, P. A.","Response Times in Recognition and Recall (April 1996)","Shiffrin, R. (Chair), Kruschke, J. K., Nosofsky, R. M., Port, R. F."],
["Treat, T. A.","Role of Cognitive Processing of Body-Size and Affect Stimulus Information in Bulimia (October 2000)","McFall, R. M. (Chair), Viken, R. J., Nosofsky, R. M., Kruschke, J. K., Mackay, D. B."],
["Erickson, M. A.","Rules and Exemplar Representation in Category Learning (June 1999)","Kruschke, J. (Co-Chair), Shiffrin, R. (Co-Chair), Gasser, M., Port, R. F., Nosofsky, R. N."],
["Bergert, Franklin Bryan","Using Response Time to Distinguish Between Lexicographic and Linear Models of Decision Making (January 2008)\r\n","Nosofsky, R. (Chair),\r\nKruschke, J.,\r\nTodd, P.,\r\nTownsend, J."],
["Vigo, Ronaldo","Mathematical Principles of Boolean Concept Learning (May 2008)","Allen, C. (Co-Chair), Kruschke, J. (Co-Chair), Goldstone, R., Nosofsky, R., Townsend, J."],
["Stanton, Roger","Dissociations of Classification: Evidence against the\r\nMultiple Learning-Systems Hypothesis (August 2007)\r\n","Nosofsky, R. (Chair),\r\nGoldstone, R.,\r\nJames, T.,\r\nKruschke, J."]],
"type":"dc"}


*/
  function loadDataAndDisplayGraph(url){
	
	$("#testContainer")
    //HEADSHOTS_URL= ./images/headshots@34.json
    d3.json(HEADSHOTS_URL, function(error, data){
      headshots = data;
      var html = render('#graph-headshots-template', headshots);
      $('#graph .svg').html(html);
      loadGraphData();
    });

    function loadGraphData() {
      
      d3.json(url, function(error, data){
		/*var actualString = "Busemeyer, Jerome"
		var sampleString = "\r\nBusemeyer, J.,\r\nFox,";
		console.log(sampleString);
		sampleString = sampleString.replace(/(\r\n|\n|\r)/gm," ");
		console.log(sampleString);
		
		var stringData= JSON.stringify(data);
		stringData = stringData.replace(/(\r\n|\n|\r)/gm,"");
		data = JSON.parse(stringData);
		console.log(data);*/
		
		
        departments = data.departments;
        data = updateGraphData(data);
		console.log(data.nodes[0]);
        var dataInfo = {
          nodesLength: data.nodes.length,
          citationsLength: data.links.length
        };
        $('#loading').html(render('#loading-template', dataInfo));
        // $('#legend').html(render('#legend-template', dataInfo));

        var graph = new D3RGraph('#graph svg', data, {
          progressiveLoading: true,
          zoomMaxScale: 1,
          zoomMinScale: 0.2,
          highlightingDelays: 20,
        });

        graph.on(D3RGraph.Events.BEFORE_LOAD, function(graph){
          graph.force.linkDistance(250);
        });

        graph.on(D3RGraph.Events.LOADING, function(graph, progress){
          $('#loading .bar').width(progress*3);
          if(progress === 100){
            $('#loading').hide();
            $('#graph').show();
          }
        });

        graph.on(D3RGraph.Events.DREW, function(){
          initializeSearch(graph, data);
          bindZoomEvents(graph, data);
          bindFilterOptionsEvents(graph);
          bindHelpEvents(graph);
          restoreSelectedAuthor(graph);
        });
        graph.draw();
      });
    }
  }

  //Binding the click events for the +,- and . butoons on the lower right corner of the graph page
  function bindZoomEvents(graph) {
    var step = 0.05;
    $('#zoom .zoom-in').click(function(){
      var scale = Math.min(graph.zoom() + step, graph.options.zoomMaxScale);
      if(graph.zoom(scale))
        $('#zoom .display .number').text(Math.ceil(scale*100));
    });

    $('#zoom .zoom-out').click(function(){
      var scale = Math.max(graph.zoom() - step, graph.options.zoomMinScale);
      if(graph.zoom(scale))
        $('#zoom .display .number').text(Math.ceil(scale*100));
    });

    $('#zoom .reset').click(function(){
      graph.zoom(1);
      $('#zoom .display .number').text(100);
    });

    graph.on(D3RGraph.Events.ZOOMED, function(graph, scale){
      $('#zoom .display .number').text(Math.round(scale*100));
    });
  }

  // Update the data format to fit with the graph.
  function updateGraphData(data) {
    var newData = {
      nodes:[],
      links:[]
    };
    var copy = getUrlParameter('copy', 1);
    for(var i = 1; i <= copy; i++){
      var nameSuffix = (i === 1 ? '' : ' (' + i + ')');
      //nameSuffix tinkers something with the URL which we get in the top of the page
      //ex: http://www.indiana.edu/~cogsci2/graph.html#g0-fbreitha-1
	  var custom_flag =0;
      for (var ni = 0; ni < data.nodes.length; ni++) {
        var node = data.nodes[ni];

		
        var user = {
          //Id and userName comes twice? 
          id: node.username + '-' + i,
          name: node.name + nameSuffix,
          titles: (node.titles instanceof Array ? node.titles : []).join(', '),
          departmentCode: node.departments[0],
          status: node.status,
          username: node.username,
          email: node.username+'@iu.edu',
          profileLink: node.status === 'faculty' ? 'http://cogs.indiana.edu/people/profile.php?u='+node.username : null,
          headshotUrl: node.headshot,
          tempName: node.name,
        };
		/*if(custom_flag<1){
			console.log("In this");
			var new_node = user;
			custom_flag++;
      console.log(new_node)
		}*/

        var departmentName = data.departments[user.departmentCode];
        if(!departmentName){
          //console.log(user.username, 'has invalid department code:', user.departmentCode);
          user.departmentCode = null;
        }
        user.department = departmentName || user.departmentCode;

        newData.nodes.push(user);
        //Building nodes done
      }
	  for(var abc = 0; abc< newData.nodes.length; abc++){
	  	console.log("The username is "+newData.nodes[abc].username+" the name is"+newData.nodes[abc].name+"hello");
	  }
	  
		console.log("Building Links");
      for (var li = 0; li < data.links.length; li++) {
/*        Link structure
"source":"Kruschke, John",
"target":"Nosofsky, Robert",
"count":"5",
"citations":[21882,36467,36476,36500,36501],
"committees":[["Nobel, P. A.","Response Times in Recognition and Recall (April 1996)","Shiffrin, R. (Chair), Kruschke, J. K., Nosofsky, R. M., Port, R. F."],
["Treat, T. A.","Role of Cognitive Processing of Body-Size and Affect Stimulus Information in Bulimia (October 2000)","McFall, R. M. (Chair), Viken, R. J., Nosofsky, R. M., Kruschke, J. K., Mackay, D. B."],
["Erickson, M. A.","Rules and Exemplar Representation in Category Learning (June 1999)","Kruschke, J. (Co-Chair), Shiffrin, R. (Co-Chair), Gasser, M., Port, R. F., Nosofsky, R. N."],
["Bergert, Franklin Bryan","Using Response Time to Distinguish Between Lexicographic and Linear Models of Decision Making (January 2008)\r\n","Nosofsky, R. (Chair),\r\nKruschke, J.,\r\nTodd, P.,\r\nTownsend, J."],
["Vigo, Ronaldo","Mathematical Principles of Boolean Concept Learning (May 2008)","Allen, C. (Co-Chair), Kruschke, J. (Co-Chair), Goldstone, R., Nosofsky, R., Townsend, J."],
["Stanton, Roger","Dissociations of Classification: Evidence against the\r\nMultiple Learning-Systems Hypothesis (August 2007)\r\n","Nosofsky, R. (Chair),\r\nGoldstone, R.,\r\nJames, T.,\r\nKruschke, J."]],
"type":"dc"}*/
        var link = data.links[li];
		
        var newLink = {
          source: link.source + nameSuffix,
          target: link.target + nameSuffix,
          value: link.value,
          citationIds: link.citations
        };
		

        if(link.committees){
          newLink.committees = [];
          /*
          ["Nobel, P. A.",
          "Response Times in Recognition and Recall (April 1996)",
          "Shiffrin, R. (Chair), Kruschke, J. K., Nosofsky, R. M., Port, R. F."]
          */
          link.committees.forEach(function(committee){
          	/*var temp_author= committee[0];
          	var temp_flag= false;
          	for(var abc=0;abc<newData.nodes.length;abc++){
          		if(newData.nodes[abc].tempName==temp_author){
          			temp_flag= true;
          		}
          	}
          	if(temp_flag == false){
          		console.log("This alumni ",temp_author," has not been found");
          	}*/

            newLink.committees.push({
              author: committee[0],
              title: committee[1],
              members: committee[2]
            });
          });
        }

        //Setting the link type to LINK_COAUTHORED_COMMITTEE or LINK_COAUTHORED or LINK_COMMITTEE
        newLink.type = (newLink.citationIds && newLink.committees) ?
          LINK_COAUTHORED_COMMITTEE :
          (newLink.citationIds ? LINK_COAUTHORED : LINK_COMMITTEE);
        newLink.styles = LINK_STYLES[newLink.type];
        newData.links.push(newLink);

        //Building a link done
      }
	
	      var newLink = {
          source: "Ahn, Yong-Yeol",
          target: "Johns, Brendan",
        };
		newLink.type = 'adav';
		newLink.styles = LINK_STYLES[newLink.type];
		newLink.advCommittees = [];
		newLink.advCommittees.push({
			chair: "Ahn, Yong-Yeol",
			advisee: "Johns, Brendan",
			title: "This is a dummy paper inserted between Ahn, Yong-Yeol and Johns, Brendan",
			members: "The members on the committee are ABC, DEF, XYZ"
		});
		newData.links.push(newLink);
	
    }

    //What does this nameMapIndex do?
    var nameMapIndex = {};
    var VALID_STATUS = ['faculty', 'alumni', 'undergrad', 'grad'];
    for(i = 0; i < newData.nodes.length; i++){
      var node = newData.nodes[i];
	  if(node.name == "Ahn, Yong-Yeol"){
	  	console.log("-------------------Johns, Brendan");
	  }
      node.index = i;
      node.title = node.name;
      
      if(VALID_STATUS.indexOf(node.status) === -1){
        console.log(node.username, ' has invalid status:', node.status);
        continue;
      }
      node.filter = node.departmentCode ? [node.status, node.departmentCode] : [node.status];
	  
      var headshotId = headshots.headshots[node.username] ? node.username : 'default';
      node.headshotId = headshotId;
      node.headshotUrl = headshotId === 'default' ? HEADSHOT_DEFAULT : node.headshotUrl;
      node.headshot = headshots.headshots[node.headshotId];
      node.headshots = headshots;
      node.styles = {
        circleFill: 'url(#headshot-'+node.headshotId+')',
        circleStroke: NODE_STYLES[node.status].circleStroke
      };
      nameMapIndex[node.name] = node.index;

    }
	console.log(nameMapIndex["Johns, Brendan"]);
	console.log(nameMapIndex["Ahn, Yong-Yeol"]);

    for(var j = 0; j < newData.links.length; j++){
      var link = newData.links[j];
	 console.log("Source :"+link.source+" at index "+ nameMapIndex[link.source]+"and Target: "+link.target+" at index "+nameMapIndex[link.target]);
      /*if(!nameMapIndex[link.source] || !nameMapIndex[link.target])
        throw 'Invalid link, source:' + link.source + ', target:' + link.target;*/
      link.source = nameMapIndex[link.source];
      link.target = nameMapIndex[link.target];
    }

    newData.styles = {
      circleR: 19,
      circleStrokeWidth: 2,
      lineStrokeWidth: 2.5,
      lineStroke: '#CCC',
      lineHighlightedStroke: '#AAA',
    };
	

    return newData;
  }

  function updateElementPositions() {
    var windowHeight = $(window).height();
    var footerHeight = 52; // $('#footer').outerHeight();
    var brandingHeight = $('#branding-bar').outerHeight();
    var topBarHeight = $('#top-bar-wrapper').outerHeight();
    var contentHeight = windowHeight - footerHeight - brandingHeight - topBarHeight;
    $('#graph, #loading').height(contentHeight);
    $('#footer').removeClass('hidden');

    var profilePanelMaxHeight = contentHeight - 100;
    $('.profile .content').css('max-height', profilePanelMaxHeight);
  }

  function initializeSearch(graph, data) {
    var inputEle = $('#search .input input');
    var clearInputEle = $('#search .clear-input');
    var namesMapAuthors = {};
    for(var i = 0; i < data.nodes.length; i++){
      var author = data.nodes[i];
      namesMapAuthors[author.name] = author;
    }

    inputEle.keyup(function(){
      var inputEle = $(this);
      var query = inputEle.val();
      if(query.length === 0){
        clearInputEle.hide();
        $('#search .results').hide();
      }else{
        var authors = searchAuthorsByNameOrDept(query, SEARCH_RESULTS_LIMIT);
        clearInputEle.show();

        $('#search .results').html(render('#results-template', {authors: authors, headshots: headshots}));
        $('#search .results').show();
        bindItemsEvents();
      }
    });

    inputEle.focus(function(){
      inputEle.trigger('keyup');
    });

    clearInputEle.click(function(){
      inputEle.val('');
      inputEle.trigger('keyup');
    });

    function bindItemsEvents() {
      $('#search .results .item').click(function(){
        $('#search .results').hide();
        var authorName = $(this).data('author-name');
        if(!authorName) return false;

        var author = namesMapAuthors[authorName];
        graph.centerItem(author.id);
        graph.highlightNode(author.id, {keepHighlighting: true});
        showAuthorProfile(author, graph);
      });
    }

    graph.on(D3RGraph.Events.ITEM_CLICK, function(graph, item){
      if(item.isNode){
        showAuthorProfile(item, graph);
      }else{
        showLinkProfile(item, graph);
      }
    });

    function searchAuthorsByNameOrDept(q, limit) {
      var matchedNames = [];
      var substrRegex = new RegExp(q, 'i');

      for(var name in namesMapAuthors){
        if (substrRegex.test(name) || substrRegex.test(namesMapAuthors[name].department)) {
          matchedNames.push(name);
          if(limit && matchedNames.length === limit) break;
        }
      }
      matchedNames.sort();

      var matchedAuthors = [];
      for(var nameIndex in matchedNames){
        var author = namesMapAuthors[matchedNames[nameIndex]];
        if(author.hidden) continue;

        author.searchName = toMatches(author.name, q);
        author.searchDept = author.department ? toMatches(author.department, q) : null;
        matchedAuthors.push(author);
      }

      return matchedAuthors;

      function toMatches(str, q) {
        var regex = new RegExp('^(.*?)('+q+')(.*)$', 'i');
        var match = str.match(regex);
        if(match){
          return [
            {text: match[1]},
            {text: match[2], isMatch: true},
            {text: match[3]},
          ];
        }else{
          return [{text: str}];
        }
      }
    }

    $('#search .profile .close').click(function(){
      $('#search .profile').hide();
      graph.unhighlightAll();
    });
  } // end of initializeSearch


  function showAuthorProfile(author, graph, showDetail) {
	  console.log("IN showAuthorProfile");
    var url = API_REPRESENTATION_PUBLICATIONS+author.username//+'?q=select&callback=?';
    var MAX_TOP_CITATIONS = 5;

    $('#search .profile .content').html('');

    if(author.repPublications){
      _showAuthorProfile(author);
	  console.log("In if")
	  console.log(author.repPublications);
    }else{
    	console.log("In else");
      $.getJSON(url).done(function(publications){
        if(!(publications instanceof Array)){
          publications = [];
        }
        publications = addAPACitation(publications);
        // publications.reverse();
        publications.sort(function(a, b){
          return parseInt(b.year) - parseInt(a.year);
        });

        location.hash = author.id;
        author.repPublications = publications;
        author.topRepPublications = publications.slice(0, MAX_TOP_CITATIONS);
        author.hasMoreRepPublications = publications.length > MAX_TOP_CITATIONS;

        var relations = graph.getNodeRelations(author.id);
        author.relations = [];
        if(relations){
          author.relations = $.map(relations.links, function(link){
            return {
              link: link,
              author: link.source === author ? link.target : link.source
            };
          });
        }
        _showAuthorProfile(author);
      });
    }

    function _showAuthorProfile(author){
		console.log("IN _showAuthorProfile");
      $('#search .profile .content').html(render('#profile-template', author));
      $('#search .profile').show();
      $('#search .profile .more').click(function(){
        _showAuthorDetailedProfile(author.id, author);
        return false;
      });
      $('#search .collaborators .headshot').hover(function(){
        var linkId = $(this).data('id');
        graph.highlightLink(linkId, {keepHighlighting: true});
        return false;
      });
      $('#search .collaborators .headshot').click(function(){
        var linkId = $(this).data('id');
        graph.centerItem(linkId);
        showLinkProfile(graph.getItem(linkId), graph);
        return false;
      });
      $('#search .collaborators .headshot').mouseout(function(){
        graph.highlightNode(author.id, {keepHighlighting: true});
        return false;
      });
      $('#search .author').click(function(e){
        if($(e.target).is('a')) return true;

        var authorId = $(this).data('id');
        if(authorId === author.id) return false;
        graph.highlightNode(authorId, {keepHighlighting: true});
        showAuthorProfile(graph.getItem(authorId), graph);
        return false;
      });
      if(showDetail){
        _showAuthorDetailedProfile(author.id, author);
      }
    }

    function _showAuthorDetailedProfile(authorId, author) {
		console.log("IN _showAuthorDetailedProfile");
      location.hash = authorId+'/more';
      $('#detailed-profile').html(render('#detailed-profile-template', author));
      $('#detailed-profile .modal').on('hidden.bs.modal', function(){location.hash = authorId;});
      $('#detailed-profile .modal-content').height($(window).height()-90);

      $('#detailed-profile .modal').modal('show');
      var headerHeight = $('#detailed-profile .modal-header').innerHeight();
      var titleHeight = $('#detailed-profile .modal-title').innerHeight();
      var contentHeight = $('#detailed-profile .modal-content').height();
      $('#detailed-profile .citations-section')
          .height(contentHeight-headerHeight-titleHeight)
          .removeClass('hidden');

    }
  }

  function showLinkProfile(link, graph, showMore) {
	  console.log("IN showLinkProfile");
    if(!link.citationIds || link.citationIds.length === 0) link.citations = [];
	
    link.authors = link.authors || [link.source, link.target];
	if(link.type == "adav"){
	console.log("Set it");
		link.advCommittees = link.advCommittees; 
	}
    if(!link.citations && link.type !== LINK_COMMITTEE){
      var url = API_CITATIONS+link.citationIds.join(',');
      $.getJSON(url)
        .done(function(citations){
          var MAX_TOP_CITATIONS = link.committees ? 2 : 2;
          var MAX_TOP_COMMITTEES = 2;

          location.hash = link.id;
          citations = [].concat(citations);

          citations = addAPACitation(citations);
          link.citations = citations;
          link.topCitations = citations.slice(0, MAX_TOP_CITATIONS);
          link.hasMoreCoPublications = citations.length > MAX_TOP_CITATIONS;
		
          link.committees = link.committees || [];
          link.topCommittees = link.committees.slice(0, MAX_TOP_COMMITTEES);
          link.hasMoreCommittees = link.committees.length > MAX_TOP_COMMITTEES;
          _showProfile(link);
        });
    }else{
      _showProfile(link);
    }

    function _showProfile(link) {
		
      $('#search .profile .content').html(render('#citations-template', link));
      $('#search .profile').show();
      $('#search .profile .more').click(function(){
        _showLinkDetailedProfile(link.id, link);
        return false;
      });
      $('#search .author').click(function(e){
        if($(e.target).is('a')) return true;

        var authorId = $(this).data('id');
        graph.highlightNode(authorId, {keepHighlighting: true});
        showAuthorProfile(graph.getItem(authorId), graph);
        return false;
      });
      if(showMore){
        _showLinkDetailedProfile(link.id, link);
      }
    }

    function _showLinkDetailedProfile(linkId, link) {
		console.log("IN _showLinkDetailedProfile");
      location.hash = linkId+'/more';
      $('#detailed-link').html(render('#detailed-link-template', link));
      $('#detailed-link .modal').on('hidden.bs.modal', function(){location.hash = linkId;});
      $('#detailed-link .modal-content').height($(window).height()-90);

      $('#detailed-link .modal').modal('show');
      var headerHeight = $('#detailed-link .modal-header').innerHeight();
      var contentHeight = $('#detailed-link .modal-content').height();
      $('#detailed-link .citations')
          .height(contentHeight-headerHeight)
          .removeClass('hidden');
    }
  }


  function restoreSelectedAuthor(graph) {
    var params = location.hash.replace('#', '').split('/');
    var id = params[0];
    var showMore = params[1] === 'more';
    var item = graph.getItem(id);
    if(!item) return;

    if(item.isNode){
      graph.centerItem(id);
      graph.highlightNode(id, {keepHighlighting: true});
      showAuthorProfile(item, graph, showMore);
    }else{
      graph.centerItem(id);
      graph.highlightLink(id, {keepHighlighting: true});
      showLinkProfile(item, graph, showMore);
    }
  }


  function getUrlParameter(sParam, defaultVal){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++){
      var sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] === sParam){
        return sParameterName[1];
      }
    }
    return defaultVal;
  }

  function render(templateId, data) {
    var source = $(templateId).html();
    var template = Handlebars.compile(source);
    var html = template(data);
    return html;
  }

  function addAPACitation(publications) {
    for(var i = 0; i < publications.length; i++){
      var pub = publications[i];
      // Deal with
      // '[{"lastname": "Leff", "author_id": 5892L, "firstname": "H. S."}, {"lastname": "Rex", "author_id": 16907L, "firstname": "A. F."}]'
      if(typeof pub.authors === 'string'){
        try{
          pub.authors = JSON.parse(pub.authors.replace(/(u\')|(\')/g, '"').replace(/L\,/g, ','));
        }catch(e){
          console.log(e);
          console.log(pub.authors);
        }
      }

      // Deal with invalid pubtype
      if(pub.pubtype === 'inproceedings') pub.pubtype = 'proceedings';

      pub.apa = APA.render(pub);
    }
    return publications;
  }

  function bindFilterOptionsEvents(graph) {
    var visibleCount = 0;
    var types = {
      'faculty': {title: 'Faculty', type: 'faculty', display: true, count: 0},
      'alumni': {title: 'Alumni', type: 'alumni', display: true, count: 0},
      'grad': {title: 'Grad Students', type: 'grad', display: true, count: 0},
      'undergrad': {title: 'Undergrads', type: 'undergrad', display: true, count: 0},
    };

    var departmentOptions = {};
    //Set the departments value in the loadGraphData function
    for(var code in departments){
      departmentOptions[code] = {
        code: code,
        title: departments[code],
        checked: true,
        count: 0,
      };
    }
    /*
    An example object looks like this
    {checked:true
    code:"ANTH"
    count:0
    title:"Anthropology"}
    */
    renderFilters();

    /*
    var NODE_STYLES = {
    'faculty': {
      circleStroke: '#4F8F00'
    },
    'alumni': {
      circleStroke: '#005493'
    },
    'undergrad': {
      circleStroke: '#FF9300'
    },
    'grad': {
      circleStroke: '#941100'
    }
  };
    */

    /*Toggling when we click on the button of Faculty, Alumni, undergrad and grad and updating the status*/
    for(var type in NODE_STYLES){
      (function(type){
        $('#filters .users .status.bg-color-'+type).click(function(){
          types[type].display = graph.toggleNodes(type);
          $(this).toggleClass('disabled');
          // updateFilterCounts();
          updateStatusInfo();
        });
      })(type);
    }


    $('.status-show-options-btn, #filters .close').click(function(){
      $('#filters').toggleClass('opened');
      $('.status-show-options-btn').toggleClass('opened');
      return false;
    });

    $('#filters .department-checkbox input').click(function(){
      var departmentCode = $(this).val();
      var checked = $(this).is(':checked');

      if(departmentCode === 'all'){
        for(var code in departmentOptions){
          if(departmentOptions[code].checked !== checked){
            departmentOptions[code].checked = checked;
            graph.toggleNodes(code);
          }
        }
      }else{
        if(departmentOptions[departmentCode].checked !== checked){
          departmentOptions[departmentCode].checked = checked;
          graph.toggleNodes(departmentCode);
        }
      }

      var allChecked = true;
      for(var code in departmentOptions){
        var checked = departmentOptions[code].checked;
        if(!checked) allChecked = false;
        $('.department-checkbox.filter-'+code+' input').prop('checked', checked);
      }
      $('.department-checkbox.all input').prop('checked', allChecked);

      // updateFilterCounts();
      updateStatusInfo();
    });


    updateFilterCounts();
    updateStatusInfo();

    /*The visibleType has all the current showing users*/
    function updateStatusInfo(){
      var visibleTypes = [];
      for(var type in types){
        if(types[type].display) visibleTypes.push(types[type]);
      }

      var data = {
        count: visibleCount,
        nothing: visibleCount === 0,
        commas: visibleTypes.slice(0, visibleTypes.length-1),
        last: visibleTypes.slice(-1)[0],
        selectedAllDeparments: $('.department-checkbox.all input:checked').length === 1,
      };

      $('#status .info').html(render('#status-info-template', data));
      $('#search .input input').trigger('keyup');
    }

    /*Sorts the departments alphabetically and reders them to the filter-options-template*/
    function renderFilters() {
    /*
    An example departmentOptions object looks like this
    {checked:true
    code:"ANTH"
    count:0
    title:"Anthropology"}
    */
      var d = [];
      for(var code in departmentOptions){
        d.push(departmentOptions[code]);
      }
      d = d.sort(function(a, b){
        return a.title.localeCompare(b.title);
      });
	  
	  
      $('#filters').html(
        render('#filter-options-template', {departments: d, status: types})
      );
	  $("#testContainer").html(render("#testTemplate", {d: d}));
	  console.log(d);
    }

    function updateFilterCounts() {
      visibleCount = 0;
      for(var t in types){
        var type = types[t];
        type.count = countVisible(type.type);
        visibleCount += type.count;
        $('#filters .filter-'+type.type+' .count').html(type.count);
      }
      for(var code in departmentOptions){
        var dept = departmentOptions[code];
        dept.count = countVisible(code);
        if(dept.count === 0)
          $('#filters .filter-'+code+' .count').hide();
        else
          $('#filters .filter-'+code+' .count').html(dept.count);
      }

      function countVisible(filter){
        return $('svg .graph-f-'+filter).filter(function(){return $(this).css('display') !== 'none'; }).length;
      }
    }
    //End of bind filter option events
  }

  function bindHelpEvents(){
    $('#help').click(function(){
      $('#help-dialog').html(render('#help-template'));
      $('#help-dialog .modal').modal('show');
    });
  }

  var SUPPORTED_BROWSERS = {
    'Chrome': 30,
    'Firefox': 25,
    'Safari': 7,
    'MSIE': 9
  };
  function isUnsupportedBrowser(){
    var isUnsupported = true;
    var browser = D3RGraph.browser;
    for(var name in SUPPORTED_BROWSERS){
      if(browser.name === name && parseInt(browser.version) >= SUPPORTED_BROWSERS[name]){
        isUnsupported = false;
        break;
      }
    }
    return isUnsupported;
  }



  function jQueryConfig() {
    $.notify.addStyle("bootstrap", {
      html: "<div>\n<span data-notify-text></span>\n</div>",
      classes: {
        base: {
          "font-weight": "bold",
          "padding": "8px 15px 8px 14px",
          "text-shadow": "0 1px 0 rgba(255, 255, 255, 0.5)",
          "background-color": "#fcf8e3",
          "border": "1px solid #fbeed5",
          "border-radius": "4px",
          "white-space": "nowrap"
        },
        error: {
          "color": "#B94A48",
          "background-color": "#F2DEDE",
          "border-color": "#EED3D7"
        },
        success: {
          "color": "#468847",
          "background-color": "#DFF0D8",
          "border-color": "#D6E9C6",
        },
        info: {
          "color": "#3A87AD",
          "background-color": "#D9EDF7",
          "border-color": "#BCE8F1",
        },
        warn: {
          "color": "#C09853",
          "background-color": "#FCF8E3",
          "border-color": "#FBEED5",
        }
      }
    });

    //Yes

    // Support cross domain requests for IE
    // http://stackoverflow.com/questions/9160123/no-transport-error-w-jquery-ajax-call-in-ie
    $.support.cors = true;

    $.ajaxSetup({
      cache: false,
      beforeSend: function(jqXHR, settings) {
          jqXHR.url = settings.url;
      },
      error: function(jqXHR, textStatus, errorThrown){
        jqXHR.status = jqXHR.status === 0 ? 500 : jqXHR.status
        console.log( 'API error: ', errorThrown, ' - ', jqXHR.url, ' - ', jqXHR.status);
        $.notify('API error: '+jqXHR.status, 'error');
      }
    });
  }

})();
