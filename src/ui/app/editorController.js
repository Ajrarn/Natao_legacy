(function () {
    "use strict";

    var uuid = require('node-uuid');

    angular
        .module('Natao')
        .controller('EditorController', EditorController);


    function EditorController($showdown,$timeout,PreferencesService,PrincipalTreeService) {
        console.log('EditorController');

        var self = this;
        self.$showdown = $showdown;
        self.$timeout = $timeout;
        self.PreferencesService = PreferencesService;
        self.PrincipalTreeService = PrincipalTreeService;
        self.PrincipalTreeService.init();
        self.$showdown.setOption('tables',true);
        self.$showdown.setOption('strikethrough',true);
        self.inPrint = false;



        self.myMath = 'x+\\sqrt{1-x^2}';

        self.myMarkdown = '$$sqrt(2)/2$$ \n'
            +'$$'+self.myMath+'$$';


        self.refresh = function() {
            self.PrincipalTreeService.saveCurrent();
            //self.myHtml =  self.$showdown.makeHtml(self.myMarkdown);
            setTimeout(self.refreshMath, 100);  //without angular $digest
        };

        self.refreshMath = function() {
            MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
        };


        self.offPrint = function() {
            self.inPrint = false;
        };

        self.selectMarkdown = function(doc) {
            self.PrincipalTreeService.selectMarkdown(doc);
            self.refresh();
        };


        self.showVisualizer = function() {
            return self.PrincipalTreeService.currentMarkdown && self.PreferencesService.preferences.showVisualiser;
        };

        self.showEditor = function() {
            return self.PrincipalTreeService.currentMarkdown && self.PreferencesService.preferences.showEditor;
        };

        self.print = function() {
            self.inPrint = true;
            setTimeout(window.print, 1050);       //without angular $digest
            self.$timeout(self.offPrint, 1150);  //with angular $digest
        };

        self.openClassPopover = function() {
            self.newClass = null;
        };


        self.closePopover = function(hide){
            hide();
        };

        self.addClassPopover = function(hide){
            if (self.newClass && self.newClass !== '') {
                self.PrincipalTreeService.addClass(self.newClass);
            }
            hide();
        };

        self.openFolderPopover = function(node) {
            self.currentNode = node;
            self.oldNameFolder = node.name;
            self.showAddFolder = false;

        }

        self.switchAddFolder = function(node) {
            if (self.showAddFolder){
                self.addFolder(node);
            } else {
                self.newFolder = null;
            }

            //switch
            self.showAddFolder = !self.showAddFolder;
        }

        self.addFolder = function(node) {
            self.PrincipalTreeService.addFolder(self.newFolder, node);
        }

        self.saveFolder = function() {
            self.PrincipalTreeService.save();
        }

        self.cancelFolderPopover = function(hide) {
            self.currentNode.name = self.oldNameFolder;
            hide();
        }
    }

}());