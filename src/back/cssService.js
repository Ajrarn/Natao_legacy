(function () {
    "use strict";

    var _ = require('lodash')
        ,fs = require('fs');


    angular
        .module('Natao')
        .service('CssService', CssService)
        .run(run);

    //Start of the service
    function run() {
        console.log('run');
    }


    //Service itself
    function CssService() {
        console.log('CssService');

        var self = this;

        self.init = function(db,nameCss) {
            self.db = db;
            self.initCss(nameCss);
        };

        self.initCss = function(nameCss) {
             self.db.find({docName:'css'},function(err,docs) {
                 if (err) {
                     console.error(err);
                 } else {
                     if (docs.length === 0) {
                         self.defaultCss();
                     } else {
                         self.availableCss = docs;
                         console.log('css',docs);
                         if (nameCss) {
                             self.initCurrent(nameCss);
                         }
                     }
                 }
             });
        };

        self.defaultCss = function() {
            var pathCss = './default_css';
            self.availableCss = [];

            var defaultFilesCss = fs.readdirSync(pathCss);


            defaultFilesCss.forEach(function(file) {
                var cssContent = fs.readFileSync(pathCss + '/' + file,'utf8');
                var docCss = {
                    docName:'css',
                    name: file,
                    css: cssContent
                };

                self.db.insert(docCss,function(err,doc) {
                    if (err) {
                        console.error(err);
                    } else {
                        self.availableCss.push(doc);
                    }
                });
            });

        };

        self.addCss = function(newCss) {
             self.db.insert(newCss, function(err) {
                if (err) {
                    console.error(err);
                }
                 self.initCss();
             });
        };

        self.initCurrent = function(nameCss) {
            self.currentCss = _.find(self.availableCss,{name:nameCss});
        };

        return self;
    }

}());