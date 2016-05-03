(function () {
    "use strict";

    var uuid = require('node-uuid');
    var _ = require('lodash');
    var fs = require('fs');


    angular
        .module('Natao')
        .service('PrincipalTreeService', PrincipalTreeService)
        .run(run);

    //Start of the service
    function run() {
    }


    //Service itself
    function PrincipalTreeService(TreeUtilService,TemplateTreeService,$q,PendingService,$translate,DatabaseService,DocumentsService,$rootScope) {
        console.log('PrincipalTreeService');

        var self = this;
        self.TreeUtilService = TreeUtilService;
        self.TemplateTreeService = TemplateTreeService;
        self.PendingService = PendingService;
        self.$q = $q;
        self.$translate = $translate;
        self.DatabaseService = DatabaseService;
        self.DocumentsService = DocumentsService;
        self.$rootScope = $rootScope;
        self.docsMarkdown = [];
        self.principalTree = {
            docName: 'PrincipalTree',
            tree: {
                children:[]
            },
            expandedNodes: [],
            selectedNode: null
        };

        self.cutNodePending = null;
        self.exportFileName = null;
        self.docsPendingForBuffer = 0;
        self.nodesPendingPaste = 0;

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

        // if we do the save on the select node, the selected node is not yet set
        //so we have to watch it
        self.$rootScope.$watch(function(){
            return self.principalTree.selectedNode;
        },function() {
            self.save();
        });

        self.getInitTreeService = function(defaultCss) {

            return self.$q(function(resolve,reject) {

                self.DatabaseService.find({docName:'PrincipalTree'})
                    .then(function(docs){
                        if (docs.length === 0) {
                            console.log('Principal Document not found');

                            self.principalTree.tree.defaultCss = defaultCss._id;

                            self.DatabaseService
                                .insert(self.principalTree)
                                .then(function(newDoc) {
                                    self.principalTree = newDoc;
                                    console.log('principalTree',self.principalTree);

                                    //We will create the first document
                                    self.$translate('WELCOME').then(function (translation) {
                                        self.addFolderOnly(translation);
                                        var welcomeMd = fs.readFileSync('./languages/welcome-' + self.$translate.use() + '.md','utf8');
                                        self.addMarkdown(self.principalTree.selectedNode,translation,welcomeMd);
                                    });

                                    resolve();
                                })
                                .catch(function(err) {
                                    reject(err);
                                });

                        } else {
                            self.principalTree = docs[0];
                            console.log('principalTree', self.principalTree);
                            resolve();
                        }
                    }).catch(function(err) {
                    reject(err);
                });
            });
        };


        self.save = function() {
            self.PendingService.start();

            self.DatabaseService
                .update(self.principalTree._id,self.principalTree)
                .then(function(doc) {
                    self.PendingService.stop();
                    self.principalTree = doc;
                })
                .catch(function(err) {
                    self.PendingService.stop();
                    console.error('error:', err);
                });

        };


        self.addFolder = function(nodeName,nodeParent,templateName) {

            if (!nodeParent) {
                nodeParent = self.principalTree.tree;
            }
            
            if (templateName) {
                
                // To make a good copy we will pass by the buffer
                var buffer = self.TreeUtilService
                    .nodeToBuffer(self.TemplateTreeService.getTemplate(templateName))
                    .then(function(buffer) {
                        self.TreeUtilService
                            .bufferToNode(buffer)
                            .then(function(node) {
                                delete node.docName;
                                node.name = nodeName;
                                nodeParent.children.push(node);
                                self.save();
                            })
                            .catch(function(err) {
                                console.error(err);
                            })
                    })
                    .catch(function(err) {
                        console.error(err);
                    });
            } else {
                var newNode = {
                    id: uuid.v4(),
                    name: nodeName,
                    color: '#000000',
                    children:[]
                };

                nodeParent.children.push(newNode);
                self.save();
            }
        };

        //delete of a node
        self.deleteNode = function(node) {

            self.TreeUtilService
                .deleteNode(node,self.principalTree.tree)
                .then(function() {

                    //First we have to check if we have deleted the selected node
                    var selNode = self.TreeUtilService.getNode(self.principalTree.selectedNode,self.principalTree.tree);
                    if (!selNode) {
                        delete self.principalTree.selectedNode;
                    }

                    //and check the selected markdown
                    selNode = self.TreeUtilService.getNode(self.principalTree.selectedNode,self.principalTree.currentMarkdownId);
                    if (!selNode) {
                        self.principalTree.currentMarkdownId = null;
                        self.currentMarkdown = null;
                    }

                    //finally we have to clean the expandedNodes
                    var arrayOfNode = self.TreeUtilService.flatFolders(self.principalTree.tree);
                    self.expandedNodes = _.intersectionWith(self.expandedNodes,arrayOfNode,function(object,other) {
                        return object.id === other.id;
                    });

                    self.save();

                })
                .catch(function(err) {
                    console.error(err);
                });
        };


        return self;

    }
}());