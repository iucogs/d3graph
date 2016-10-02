
'use strict';

var APA = {
  render: function(publication){
    publication.authors = this.render_apa_authors(publication.authors);
    return Mustache.render(this.apa_templates[publication.pubtype], publication);
  },

  // source: https://github.com/iucogs/pubssite/blob/3407249318498a894f9335209edf0efb2da2f5bd/pubssite/static/js/citations.js#L44
  // usage: https://github.com/iucogs/pubssite/blob/master/pubssite/static/js/citations.js#L211
  // temp_cit.authors = render_apa_authors(temp_cit.authors);
  render_apa_authors: function(authors_array){
    var formatted_author_array = [];
    $.each(authors_array, function (index, author) {
        var initials_array = [];
        var temp_auth = "";

        if (author.firstname.split(" ").length > 1)
            initials_array = author.firstname.split(" ");
        else
            initials_array.push(author.firstname);

        if (index > 0) temp_auth += " ";

        temp_auth += author.lastname + ", ";

        $.each(initials_array, function (index, firstname) {
            temp_auth += firstname.substring(0, 1) + ". ";
        });

        //remove trailing space
        temp_auth = temp_auth.slice(0, -1);

        formatted_author_array.push(temp_auth);
    });


    // This block handles the actual APA-defined layout for a given number of
    // authors.
    var num_authors = formatted_author_array.length;

    if (num_authors > 3) {
      return formatted_author_array[0] + ", et al.";
    } else if (num_authors == 3) {
      return formatted_author_array[0] + ", " + formatted_author_array[1] + " & " + formatted_author_array[2];
    } else if (num_authors == 2) {
      return formatted_author_array[0] + ", " + formatted_author_array[1];
    } else {
      return formatted_author_array[0];
    }
  },

  // source: https://raw.githubusercontent.com/iucogs/pubssite/master/pubssite/static/js/apa_templates.js
  // usage: https://github.com/iucogs/pubssite/blob/master/pubssite/static/js/citations.js#L217
  // Mustache.render(template[citation.pubtype], temp_cit)
  apa_templates: {
    "": "{{#authors}}{{authors}}{{/authors}} {{^authors}}[UNKNOWN AUTHOR(S)]. {{/authors}} \
      {{#year}} ({{year}}). {{/year}}{{^year}} [UNKNOWN YEAR]. {{/year}} \
      {{#title}}{{title}}. {{/title}}{{^title}} [UNKNOWN TITLE]. {{/title}} \
      {{#editor}} In {{apaEds}},{{/editor}}{{^editor}}[UNKNOWN EDITOR], {{/editor}} \
      {{#booktitle}} {{booktitle}} {{/booktitle}}{{^booktitle}}[UNKNOWN BOOKTITLE] {{/booktitle}} \
      {{#pages}}(pp. {{pages}}).{{/pages}}{{^pages}}[UNKNOWN PAGES].{{/pages}} \
      {{#location}} {{location}}:{{/location}}{{^location}} [UNKNOWN LOCATION]: {{/location}} \
      {{#publisher}} {{publisher}}.{{/publisher}}{{^publisher}} [UNKNOWN PUBLISHER].{{/publisher}}",

    "unknown": "{{#authors}}{{authors}}{{/authors}} {{^authors}}[UNKNOWN AUTHOR(S)]. {{/authors}} \
        {{#year}} ({{year}}). {{/year}}{{^year}} [UNKNOWN YEAR]. {{/year}} \
        {{#title}}{{title}}. {{/title}}{{^title}} [UNKNOWN TITLE]. {{/title}} \
        {{#editor}} In {{apaEds}},{{/editor}}{{^editor}}[UNKNOWN EDITOR], {{/editor}} \
        {{#booktitle}} {{booktitle}} {{/booktitle}}{{^booktitle}}[UNKNOWN BOOKTITLE] {{/booktitle}} \
        {{#pages}}(pp. {{pages}}).{{/pages}}{{^pages}}[UNKNOWN PAGES].{{/pages}} \
        {{#location}} {{location}}:{{/location}}{{^location}} [UNKNOWN LOCATION]: {{/location}} \
        {{#publisher}} {{publisher}}.{{/publisher}}{{^publisher}} [UNKNOWN PUBLISHER].{{/publisher}}",

    "book": "{{#authors}}{{authors}}{{/authors}}{{^authors}}[UNKNOWN AUTHOR].{{/authors}} \
            {{#year}} ({{year}}). {{/year}}{{^year}}[UNKNOWN YEAR]. {{/year}} \
            {{#title}}{{title}}. {{/title}}{{^title}} [UNKNOWN TITLE]. {{/title}} \
            {{#location}}{{location}}: {{/location}}{{^location}}[UNKNOWN LOCATION]: {{/location}} \
            {{#publisher}}{{publisher}}.{{/publisher}}{{^publisher}}[UNKNOWN PUBLISHER].{{/publisher}}",

    "article": "{{#authors}}{{authors}}{{/authors}} {{^authors}}[UNKNOWN AUTHOR].{{/authors}} \
               {{#year}} ({{year}}). {{/year}}{{^year}} [UNKNOWN YEAR]. {{/year}} \
               {{#title}}{{title}}.{{/title}}{{^title}}[UNKNOWN TITLE]. {{/title}} \
               {{#journal}} {{journal}},{{/journal}}{{^journal}} [UNKNOWN JOURNAL] {{/journal}} \
               {{#volume}} {{volume}}{{#number}}({{number}}){{/number}}, {{/volume}}{{^volume}}[UNKNOWN VOLUME] {{/volume}} \
               {{#pages}} {{pages}}{{/pages}}.{{^pages}}[UNKNOWN PAGES].{{/pages}}",

    "inbook": "{{#authors}}{{authors}}{{/authors}} {{^authors}}[UNKNOWN AUTHOR]. {{/authors}} \
              {{#year}} ({{year}}). {{/year}}{{^year}} [UNKNOWN YEAR]. {{/year}} \
              {{#title}}{{title}}. {{/title}}{{^title}} [UNKNOWN TITLE]. {{/title}} \
              {{#editor}} In {{apaEds}},{{/editor}}{{^editor}}[UNKNOWN EDITOR], {{/editor}} \
              {{#booktitle}} {{booktitle}} {{/booktitle}}{{^booktitle}}[UNKNOWN BOOKTITLE] {{/booktitle}} \
              {{#pages}}(pp. {{pages}}).{{/pages}}{{^pages}}[UNKNOWN PAGES].{{/pages}} \
              {{#location}} {{location}}:{{/location}}{{^location}} [UNKNOWN LOCATION]: {{/location}} \
              {{#publisher}} {{publisher}}.{{/publisher}}{{^publisher}} [UNKNOWN PUBLISHER].{{/publisher}}",

    "translated_book": "{{#authors}}{{authors}}{{/authors}}{{^authors}}[UNKNOWN AUTHOR]. {{/authors}} \
                       {{#year}} ({{year}}). {{/year}}{{^year}} [UNKNOWN YEAR]. {{/year}} \
                       {{#title}}{{title}}. {{/title}}{{^title}}[UNKNOWN TITLE]. {{/title}} \
                       {{#translator}}({{apaTrans}}, Trans.){{/translator}}{{^translator}}[UNKNOWN TRANSLATOR].{{/translator}} \
                       {{#location}} {{location}}: {{/location}}{{^location}} [UNKNOWN LOCATION]: {{/location}} \
                       {{#publisher}}{{publisher}}.{{/publisher}}{{^publisher}}[UNKNOWN PUBLISHER].{{/publisher}}",

    "edited_book": "{{#authors}}{{authors}} {{/authors}}{{^authors}}[UNKNOWN AUTHOR]{{/authors}} \
                   {{#year}} ({{year}}). {{/year}}{{^year}}[UNKNOWN YEAR]. {{/year}} \
                   {{#title}}{{title}}. {{/title}}{{^title}} [UNKNOWN TITLE]. {{/title}} \
                   {{#location}} {{location}}:{{/location}}{{^location}} [UNKNOWN LOCATION]: {{/location}} \
                   {{#publisher}} {{publisher}}.{{/publisher}}{{^publisher}} [UNKNOWN PUBLISHER].{{/publisher}}",

    "web_published": "{{#authors}}{{authors}}{{/authors}}{{^authors}}[UNKNOWN AUTHOR]. {{/authors}} \
                     {{#title}} {{title}}. {{/title}}{{^title}} [UNKNOWN TITLE]. {{/title}} \
                     {{#year}} ({{year}}). {{/year}}{{^year}} [UNKNOWN YEAR]. {{/year}} \
                     Retrieved from: {{#url}}{{url}}{{/url}}{{^url}}[UNKNOWN URL]{{/url}}",

    "proceedings": "{{#authors}}{{authors}}{{/authors}}{{^authors}}[UNKNOWN AUTHOR]. {{/authors}} \
                   {{#year}} ({{year}}). {{/year}}{{^year}}[UNKNOWN YEAR]. {{/year}} \
                   {{#title}}{{title}}. {{/title}}{{^title}} [UNKNOWN TITLE]. {{/title}} \
                   {{#pages}} {{pages}}{{/pages}}.{{^pages}}[UNKNOWN PAGES].{{/pages}} \
                   {{#location}} {{location}}:{{/location}}{{^location}} [UNKNOWN LOCATION]: {{/location}} \
                   {{#publisher}} {{publisher}}.{{/publisher}}{{^publisher}} [UNKNOWN PUBLISHER].{{/publisher}}",

    "misc": "{{#authors}}{{authors}}{{/authors}}{{^authors}}[UNKNOWN AUTHOR].{{/authors}} \
            {{#year}} ({{year}}). {{/year}}{{^year}} [UNKNOWN YEAR]. {{/year}} \
            {{#title}}{{title}}. {{/title}}{{^title}} [UNKNOWN TITLE]. {{/title}}"
    }
};
