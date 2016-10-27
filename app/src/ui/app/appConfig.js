(function () {
    "use strict";

    angular
        .module('Natao')
        .config(AppConfig);


    function AppConfig($translateProvider,tmhDynamicLocaleProvider, $locationProvider, $showdownProvider) {

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });

        $showdownProvider.loadExtension(myToc);

        $translateProvider.useStaticFilesLoader({
            prefix: './languages/locale-',
            suffix: '.json'
        }).registerAvailableLanguageKeys(['en', 'fr'], {
            'en*': 'en',
            'fr*': 'fr'
        }).determinePreferredLanguage(function() {
            if (!window.navigator.languages[0].startsWith(window.navigator.language)) {
                return window.navigator.language;
            } else {
                return window.navigator.languages[0];
            }
            }).fallbackLanguage(['en']);


        //$translateProvider.useSanitizeValueStrategy('sanitize');
        $translateProvider.useSanitizeValueStrategy('escape');

        tmhDynamicLocaleProvider.localeLocationPattern('./bower_components/angular-i18n/angular-locale_{{locale}}.js');
        
    }

    var toc = function(converter) {
        return [

            {
                type: 'output',
                filter: function(source) {
                    console.log('source', source);
                    var elements = $(source);
                    var output = [];
                    var headingLevel = null;
                    var tocId = null;
                    for (var i=0; i<elements.length; i++) {
                        var element = $(elements[i]);
                        var results = null;

                        // Does the element consist only of [toc]?
                        // If so, we can replace this element with out list.
                        if (element.text().trim()=='[toc]') {
                            element = $('<ol>',{'class':'showdown-toc'});
                            headingLevel = null;
                            tocId = output.length;
                        }

                        // Does this item contain a [toc] with other stuff?
                        // If so, we'll split the element into two
                        else if (results = element.text().trim().match(/^([\s\S]*?)((?:\\)?\[toc\])([\s\S]*)$/)) {

                            // If there was a \ before the [toc] they're trying to escape it,
                            // so return the [toc] string without the \ and carry on. For
                            // some reason (I'm guessing a bug in showdown) you actually
                            // appear to need two \ (\\) in order to get this to show up for
                            // the filter. Leaving this code here anyway for now because it's
                            // "the right thing to do"(tm).
                            if (results[2][0]=='\\') {
                                element.text(results[1]+results[2].substr(1)+results[3]);
                            }

                            // Otherwise start building a new table of contents.
                            else {
                                var before = null;
                                var after = null;

                                // Create two of the same element.
                                if (element.prop('tagName')) {
                                    if (results[1].trim().length>0) {
                                        before = $('<'+element.prop('tagName')+'>').text(results[1]);
                                    }
                                    if (results[3].trim().length>0) {
                                        after = $('<'+element.prop('tagName')+'>').text(results[3]);
                                    }
                                }

                                // Otherwise if there's no tagName assume it's a text node
                                // and create two of those.
                                else {
                                    if (results[1].trim().length>0) {
                                        before = document.createTextNode(results[1]);
                                    }
                                    if (results[3].trim().length>0) {
                                        after = document.createTextNode(results[3]);
                                    }
                                }

                                // Our new table of contents container.
                                toc = $('<ol>',{'class':'showdown-toc'});

                                // If there was text before our [toc], add that in
                                if (before) {
                                    output.push(before);
                                }

                                // Keep track of where our current table is in the elements array.
                                tocId = output.length;

                                // If there was text after, push the contents onto the array and
                                // use the after part as our current element.
                                if (after) {
                                    output.push(toc);
                                    element = after;
                                }

                                // Otherwise use the contents as the current element.
                                else {
                                    element = toc;
                                }

                                // Reset the heading level - we're going to start looking for new
                                // headings again
                                headingLevel = null;

                            }
                        }

                        // If we've started a table of contents, but have nothing in it yet,
                        // look for the first header tag we encounter (after the [toc]).
                        // That's going to be what we use as contents entries for this table
                        // of contents.
                        else if (tocId && !headingLevel && element.prop("tagName")) {
                            switch (element.prop("tagName")) {
                                case 'H1':
                                case 'H2':
                                case 'H3':
                                case 'H4':
                                case 'H5':
                                case 'H6':
                                    headingLevel = parseInt(element.prop('tagName').substr(1));
                                    break;
                            }
                        }

                        // If we know what header level we're looking for (either we just
                        // found it above, or we're continuing to look for more) then check to
                        // see if this heading should be added to the contents.
                        if (tocId && headingLevel) {
                            switch (element.prop('tagName')) {
                                case 'H1':
                                case 'H2':
                                case 'H3':
                                case 'H4':
                                case 'H5':
                                case 'H6':
                                    var thisLevel = parseInt(element.prop('tagName').substr(1));
                                    if (thisLevel==headingLevel) {
                                        output[tocId] = $(output[tocId]).append($('<li>').append($('<a>',{href:'#'+element.attr('id'),target:'_self',text:element.text()})));
                                    }
                                    // If we move up in what would be the document tree
                                    // (eg: if we're looking for H2 and we suddenly find an
                                    // H1) then we can probably safely assume that we want
                                    // the table of contents to end for this section.
                                    else if (thisLevel<headingLevel) {
                                        toc = null
                                        tocId = null;
                                        headingLevel = null;
                                    }
                                    break;
                            }
                        }
                        // Push whatever element we've been looking at onto the output array.
                        output.push(element);
                    }
                    // Build some HTML to return
                    // Return it.
                    return $('<div>').append(output).html();
                }
            }

        ];
    };

    var myToc = function(converter) {
        return [

            {
                type: 'output',
                filter: function(source) {
                    if (source.indexOf('[toc]') > 0) {
                        var elements = $('<div></div>');
                        elements.html(source);
                        var titles = $('h1,h2,h3,h4,h5,h6', elements);

                        var toc = $('<ol>',{'class':'showdown-toc'});

                        var previousNodeName;
                        titles.each((index, item) => {
                            console.log(index,item);
                            if (previousNodeName) {
                                if (item.nodeName === previousNodeName) {
                                    console.log('=');
                                } else {
                                    if (item.nodeName >= previousNodeName) {
                                        console.log('>');
                                    } else {
                                        console.log('<');
                                    }
                                }
                            }
                            previousNodeName = item.nodeName;
                        });
                    }




                    return source;
                }
            }

        ];
    };

}());