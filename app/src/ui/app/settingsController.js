(function () {
    "use strict";

    var beautify_html = require('js-beautify').html;

    angular
        .module('Natao')
        .controller('SettingsController', SettingsController);


    function SettingsController($rootScope,$scope,PreferencesService,DatabaseService,$location,$sce,fileDialog,CssService,DocumentsService,TemplateTreeService,$showdown,focus) {

        var self = this;

        self.PreferencesService = PreferencesService;
        self.$sce = $sce;
        self.DatabaseService = DatabaseService;
        self.$scope = $scope;

        self.fileDialog = fileDialog;
        self.CssService = CssService;
        self.DocumentsService = DocumentsService;
        self.TemplateTreeService = TemplateTreeService;
        self.$showdown = $showdown;
        self.focus = focus;
        self.viewer = true;

        //for codeMirror
        self.cssEditorOptions = {
            lineWrapping : true,
            lineNumbers: true,
            mode: 'text/css',
            extraKeys: {"Ctrl-Space": "autocomplete"}
        };

        // Define an extended mixed-mode that understands vbscript and
        // leaves mustache/handlebars embedded templates in html mode
        /*var mixedMode = {
            name: "htmlmixed",
            scriptTypes: [{matches: /\/x-handlebars-template|\/x-mustache/i,
                mode: null},
                {matches: /(text|application)\/(x-)?vb(a|script)/i,
                    mode: "vbscript"}]
        };*/

        self.htmlEditorOptions = {
            lineWrapping : true,
            lineNumbers: true,
            readOnly: 'nocursor'
        };


        if (self.CssService && self.CssService.availableCss && self.CssService.availableCss.length> 0) {
            self.currentCss = self.CssService.availableCss[0];
        }



        self.documentsPromise = self.DocumentsService.getDocuments();
        self.documentsPromise.then(function(docs) {
            self.documents = docs;
            if (self.documents && self.documents.length > 0){
                self.currentDoc = self.documents[0];
                self.changeDocument();
            }
        });


        self.settingsValide = function() {
            self.valid = self.PreferencesService.isValid();
        };

        self.changeName = function() {
            self.settingsValide();
            if (self.PreferencesService.preferences.name && self.PreferencesService.preferences.firstName && self.PreferencesService.preferences.name !== '' && self.PreferencesService.preferences.firstName !== '') {
                self.step = 4;
            }
        };

        self.save = function() {
            self.PreferencesService.save();
            $location.path( '/editor' );
        };

        self.changeLanguage = function(language) {
            self.PreferencesService.changeLanguage(language);
            self.settingsValide();
            self.step = 2;
        };


        self.newDatabase = function() {
            self.fileDialog.saveAs(function(filename) {
                self.PreferencesService.settings.fileDatabase = filename;
                self.step = 3;
                self.$scope.$apply();
            },'Natao.db',['db']);
        };

        self.chooseDatabase = function() {
            self.fileDialog.openFile(function(filename){
                self.PreferencesService.settings.fileDatabase = filename;
                self.PreferencesService.init();
                self.$scope.$apply();
            }, false, ['db']);

        };

        self.saveCss = function(e) {
            if (self.currentCss) {
                self.CssService.initCurrentByContent(self.currentCss.css);
                self.CssService.saveCss(self.currentCss);
            }
        };

        self.changeDocument = function() {
            self.currentHTML = self.$showdown.makeHtml(self.currentDoc.md);
            self.allHtml();
        };

        self.changeCss = function() {
            self.CssService.initCurrentByContent(self.currentCss.css);
            self.focus('cssEditor');
        };

        self.initAddCss= function() {
            self.newCssName = null;
            self.focus('addCssName');
        };

        self.addCss = function(hide) {
            self.CssService.addCssNamed(self.newCssName)
                .then(function(res) {
                    self.currentCss = res;
                    self.changeCss();
                })
                .catch(function(err) {
                    console.error(err);
                });
            self.focus('cssEditor');
            hide();
        };

        self.deleteCss = function(hide) {
            self.CssService.deleteCss(self.currentCss);
            self.currentCss = null;
            self.CssService.initCurrentByContent('');
            hide();
        };

        self.editorReadOnly = function(_editor) {
            // Options
            _editor.setReadOnly(true);
        };

        self.allHtml = function() {

            var completeHtml = '<div class="haut" layout="row" layout-align="start stretch">' +
                '<div class="identity" layout="column" layout-align="center center">' +
                '<p>' + self.PreferencesService.preferences.name +'</p>' +
                '<p>' + self.PreferencesService.preferences.firstName +'</p>' +
                '</div>' +
                '<div class="title-zone" flex layout="column" layout-align="center center">' +
                '<h1>' + self.currentDoc.title +'</h1>' +
                '<p id="dateCreated">' + self.currentDoc.created + '</p>' +
                '</div>' +
                '</div>' +
                '<div class="notation"></div>' +
                '<div class="devoir" flex layout="row" layout-align="start stretch">' +
                '<div class="marge"></div>' +
                '<div id="rendu" flex>'+ self.currentHTML +'</div>' +
                '</div>';

            self.currentHtmlAll = beautify_html(completeHtml);
        };

        self.treeOptions = {
            nodeChildren: "children",
            dirSelectable: true,
            injectClasses: {
                ul: "a1",
                li: "a2",
                liSelected: "a7",
                iExpanded: "a3",
                iCollapsed: "a4",
                iLeaf: "a5",
                label: "a6",
                labelSelected: "a8"
            },
            isLeaf: function(node) {
                return node.leaf;
            }
        };


        self.settingsValide();

    }

}());