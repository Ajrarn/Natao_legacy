(function () {
    "use strict";

    var beautify_html = require('js-beautify').html;
    var fs = require('fs');
    var uuid = require('node-uuid');
    var _ = require('lodash');

    angular
        .module('Natao')
        .controller('SettingsController', SettingsController);


    function SettingsController($rootScope,$scope,PreferencesService,DatabaseService,$location,$sce,fileDialog,OnBoardingService, ShowDownUtilService,
                                CssService,DocumentsService,TemplateTreeService,$showdown,focus,$timeout,TreeUtilService,MessageService, PrincipalTreeService) {

        var self = this;

        self.PreferencesService = PreferencesService;
        self.$sce = $sce;
        self.DatabaseService = DatabaseService;
        self.$scope = $scope;
        self.$rootScope = $rootScope;

        self.fileDialog = fileDialog;
        self.CssService = CssService;
        self.DocumentsService = DocumentsService;
        self.TemplateTreeService = TemplateTreeService;
        self.$showdown = $showdown;
        self.focus = focus;
        self.$timeout = $timeout;
        self.TreeUtilService = TreeUtilService;
        self.MessageService = MessageService;
        self.OnBoardingService = OnBoardingService;
        self.PrincipalTreeService = PrincipalTreeService;
        self.ShowDownUtilService = ShowDownUtilService;
        self.MessageService.changeMessage('');
        self.viewer = true;
        self.checkmark = false;

        //init currentDoc
        self.currentDoc = {
            md:''
        };

        self.buffer = null;
        self.nodesPendingPaste = 0;

        //for codeMirror
        self.cssEditorOptions = {
            lineWrapping : true,
            lineNumbers: true,
            mode: 'css',
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {"Ctrl-Space": "autocomplete"}
        };


        self.htmlEditorOptions = {
            lineWrapping : true,
            lineNumbers: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            readOnly: 'nocursor'
        };

        // to ensure that the <a href> wil open in a browser not in Natao
        // We have to watch the current markdown and force the behavior of all <a href>
        self.$rootScope.$watch(function(){
            return self.currentDoc.md;
        },function() {
            self.ShowDownUtilService.showDownHooks();
        });



        self.documentsPromise = self.DocumentsService.getDocuments();
        self.documentsPromise.then(function(docs) {
            self.documents = docs;
        });
        
        self.setCssEditor = function(editor) {
            self.cssEditor = editor;
            Inlet(editor);
        };


        self.settingsValide = function() {
            self.valid = self.PreferencesService.isValid();
        };

       

        self.save = function() {
            self.PreferencesService.save();
            $location.path( '/editor' );
        };

        self.newDatabase = function() {
            self.fileDialog.saveAs(function(filename) {
                self.PreferencesService.settings.fileDatabase = filename;
                if (fs.existsSync(filename)) {
                    fs.unlinkSync(filename);
                }
                self.$scope.$apply();
            },'Natao.db',['db']);
        };

        self.chooseDatabase = function() {
            self.fileDialog.openFile(function(filename){
                self.PreferencesService.settings.fileDatabase = filename;
                self.PreferencesService.saveSettings();
                self.PreferencesService.init();
            }, false, ['db']);
        };


        /* *************CSS**************** */

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

            var completeHtml = '<div flex layout="column" layout-align="start stretch">' +
                '<div id="header" layout="row" layout-align="start stretch">' +
                '<div id="identity" layout="column" layout-align="center center">' +
                '<p>' + self.PreferencesService.preferences.name +'</p>' +
                '<p>' + self.PreferencesService.preferences.firstName +'</p>' +
                '<p>' + self.PreferencesService.preferences.className + '</p>' +
                '</div>' +
                '<div id="titleZone" flex layout="column" layout-align="center center">' +
                '<h1>' + self.currentDoc.title +'</h1>' +
                '<p id="dateCreated">' + self.currentDoc.created + '</p>' +
                '</div>' +
                '</div>' +
                '<div id="separator"></div>' +
                '<div id="content" flex layout="row" layout-align="start stretch">' +
                '<div id="margin"></div>' +
                '<div id="made" flex>'+ self.currentHTML +'</div>' +
                '</div></div>';

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


        /* *************Templates**************** */

        self.saveTemplate = function(e) {
            if (self.currentTemplate) {
                self.TemplateTreeService.saveTemplate(self.currentTemplate);
            }
        };
        

        self.initAddTemplate= function() {
            self.newTemplateName = null;
            self.focus('addTemplateName');
        };

        self.addTemplate = function(hide) {
            self.TemplateTreeService.addTemplate(self.newTemplateName)
                .then(function(res) {
                    self.currentTemplate = res;
                })
                .catch(function(err) {
                    console.error(err);
                });
            hide();
        };

        self.deleteTemplate = function(hide) {
            self.TemplateTreeService.deleteTemplate(self.currentTemplate);
            self.currentTemplate = null;
            hide();
        };

        // the possible values of folderPopover are ['buttonBar','edit','addFolder','delete']
        self.openFolderPopover = function(node) {
            self.currentNode = node;
            self.newNameFolder = node.name;
            self.newDefaultCss = node.defaultCss;
            self.folderPopover = 'buttonBar';
            self.newColor = node.color;
        };

        self.pasteButtonDisabled = function() {
            return !(self.buffer);
        };

        self.editFolder = function() {
            self.folderPopover = 'edit';
            self.focus('folderName');
        };


        self.openAddFolder = function() {
            self.newFolderName = null;
            self.folderPopover = 'addFolder';
            self.templateName = null;
            self.focus('addFolderName');
        };


        self.openDelete = function() {
            self.folderPopover = 'delete';
            self.cancel = false;
        };

        self.openConfirmTemplate = function() {
            self.folderPopover = 'confirmTemplate';
            self.cancel = false;
        };

        self.cancelAction = function(hide) {
            self.cancel = true;
            hide();
        };

        self.submitFolderPopover = function(hide){
            switch (self.folderPopover) {
                case 'edit':
                    self.saveFolder(hide);
                    break;
                case 'addFolder':
                    self.addFolder(hide);
                    break;
                case 'delete':
                    if (!self.cancel) {
                        self.deleteNode(self.currentNode);
                    } else {
                        hide();
                    }
                    break;
                default: break;
            }
        };

        self.copyFolder = function(hide) {

            self.TreeUtilService
                .nodeToBuffer(self.currentNode)
                .then(function(buffer) {
                    self.buffer = buffer;
                })
                .catch(function(err) {
                    console.error(err);
                });
            hide();
        };

        self.cutFolder = function(hide) {

            self.TreeUtilService
                .nodeToBuffer(self.currentNode)
                .then(function(buffer) {
                    self.buffer = buffer;
                    self.deleteNode(self.currentNode);
                })
                .catch(function(err) {
                    console.error(err);
                });

            hide();
        };


        self.pasteFolder = function(hide) {

            if (self.buffer) {
                self.TreeUtilService
                    .bufferToNode(self.buffer)
                    .then(function(node) {
                        if (self.currentNode && self.currentNode.children) {
                            self.currentNode.children.push(node);
                            self.buffer = null;
                            self.TemplateTreeService.saveTemplate(self.currentTemplate,self.currentTemplate.name);
                        }
                    })
                    .catch(function(err) {
                        console.error(err);
                    });
            }
            hide();

        };

        self.addFolder = function(hide) {
            if (self.newFolderName && self.newFolderName.length > 0) {
                var newNode = {
                    id: uuid.v4(),
                    name: self.newFolderName,
                    color: '#000000',
                    children:[]
                };

                newNode.defaultCss = self.currentNode.defaultCss;
                self.currentNode.children.push(newNode);

                //and we open the node parent
                self.expandedNodes.push(self.currentNode);

                // if the new folder is the first one
                if (!self.selectedNode) {
                    self.selectedNode = newNode;
                }
            }
            //And we save the modifications
            self.TemplateTreeService.saveTemplate(self.currentTemplate,self.currentTemplate.name);
            hide();
        };

        self.saveFolder = function(hide) {
            if (self.newNameFolder && self.newNameFolder.length > 0) {
                self.currentNode.name = self.newNameFolder;
                self.currentNode.color = self.newColor;
                self.currentNode.defaultCss = self.newDefaultCss;

                //And we save the modifications
                self.TemplateTreeService.saveTemplate(self.currentTemplate,self.currentTemplate.name);
                hide();
            }
        };

        self.deleteNode = function(node) {

            // delete the selectednode if it is the current node
            if (angular.equals(node,self.selectedNode)) {
                delete self.selectedNode;
            }

            // In all case we have to delete it from the tree
            self.TreeUtilService
                .deleteNode(node,self.currentTemplate)
                .then(function() {
                    //And we save the modifications
                    self.TemplateTreeService.saveTemplate(self.currentTemplate,self.currentTemplate.name);

                    //we have to clean the expandedNodes
                    var arrayOfNode = self.TreeUtilService.flatFolders(self.currentTemplate);
                    self.expandedNodes = _.intersectionWith(self.expandedNodes,arrayOfNode,function(object,other) {
                        return object.id === other.id;
                    });
                })
                .catch(function(err) {
                    console.error(err);
                });


        };
        

        self.expand = function(node) {
            if (self.expandedNodes.indexOf(node) < 0) {
                self.expandedNodes.push(node);
            }
        };


        /* ***************************** */
        self.handleDrop = function(item, bin) {

            var nodeDrag = self.TreeUtilService.getNode(item,self.currentTemplate);
            var nodeDrop = null;

            if (bin.startsWith('before')) {
                nodeDrop = self.TreeUtilService.getNode(bin.replace('before',''),self.currentTemplate);
                self.TreeUtilService.moveBefore(nodeDrag,nodeDrop,self.currentTemplate);
            } else {
                if (bin.startsWith('after')) {
                    nodeDrop = self.TreeUtilService.getNode(bin.replace('after',''),self.currentTemplate);
                    self.TreeUtilService.moveAfter(nodeDrag,nodeDrop,self.currentTemplate);
                } else {
                    nodeDrop = self.TreeUtilService.getNode(bin,self.currentTemplate);
                    self.TreeUtilService.moveIn(nodeDrag,nodeDrop,self.currentTemplate);
                    self.expand(nodeDrop);
                }
            }
        };

        self.isFirstChild = function(node) {
            return self.TreeUtilService.isFirstChild(node,self.currentTemplate);
        };
        
        self.isExpanded = function(node) {
            return self.expandedNodes && self.expandedNodes.indexOf(node) >= 0;
        };

        self.showAfter = function(node) {
            return !(self.isExpanded(node) && node.children.length > 0);
        };

        self.changeButtonText = function(message) {
            self.MessageService.changeMessage(message);
        };



        self.settingsValide();



        /************onBoarding Style******/
        self.onBoardingStepsStyle = self.OnBoardingService.getSteps('Style').steps;

        self.onboardingEnabledStyle = self.OnBoardingService.startFirstTour('Style');

        self.finishTourStyle = function() {
            self.OnBoardingService.finishTour('Style');
            self.onboardingEnabledStyle = false;
        };

        self.startTourStyle = function() {
            self.onboardingIndexStyle = 0;
            self.onboardingEnabledStyle = true;
        };

        /************onBoarding Template******/
        self.onBoardingStepsTemplate = self.OnBoardingService.getSteps('Template').steps;

        self.onboardingEnabledTemplate = self.OnBoardingService.startFirstTour('Template');

        self.finishTourTemplate = function() {
            self.OnBoardingService.finishTour('Template');
            self.onboardingEnabledTemplate = false;
        };

        self.startTourTemplate = function() {
            self.onboardingIndexTemplate = 0;
            self.onboardingEnabledTemplate = true;
        };


        self.importHelpFiles = () => {
            self.PrincipalTreeService.addHelpFiles()
                .then(() => {
                    self.checkmark = true;
                })
                .catch((err) => {
                    console.error(err);
                })
        };

    }

}());