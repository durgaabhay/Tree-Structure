const express = require('express');
const mongoose = require('mongoose');
const Branch = require('../models/treeValues');

const router = express.Router();

router.get('/', function(req,res){
  res.render('index', {title : 'testing'});
});

/* GET home page. */
router.get('/buildTree', function(req, res) {
    console.log('fetching all child nodes');
    Branch.find({},{nodeName:1,parentNode:1,childNodes:1,_id:0}).exec().then(result => {
        // console.log('Tree structure - '+ result);
        const message = JSON.stringify(result , '\t', null);
        res.status(200).json({
            result
        });
    }).catch(err =>{
        res.status(500).json({err});
    })
});

router.post('/insertRoot', function(req,res){
    console.log('Inserting the root node(Parent) level One');
    const rootNode = new Branch({
        _id : new mongoose.Types.ObjectId(),
        nodeName : 'Root',
        parentNode : 'NA',
        isRootNode : 'No',
        isChildNode : 'No',
        hasChildren : 'No',
        childrenCount: 0,
        childNodes : []
    });
    rootNode.save().then(result => {
        res.status(201).json({
            message : 'Root Node Inserted',
            result : result
        })
    }).catch(err => {
        res.status(500).json({
            message : 'Error inserting root node',
            error : err
        });
    });

});

router.post('/', function(req,res){
    console.log('Inserting a new node' + req.body.nodeName + req.body.parentNode);
    Branch.find({nodeName : req.body.nodeName})
        .exec()
        .then(branchName => {
            if(branchName.length >= 1){
                //branch exists
                console.log('Branch name exists.. so send message to user informing node name should be unique');
                res.status(409).json({
                    message : 'Branch name exists.Create a branch with another name'
                })
            }else{
                //branch name does not exist
                console.log('Success activity... insert node to the parent and increment the child count on the parent.');
                Branch.find({nodeName : req.body.parentNode}).exec().then(parentFound => {
                    console.log('Parent Information found : '+ parentFound);
                    if(parentFound[0].childrenCount > 15){
                        console.log('Children count reached 15 already');
                        res.status(200).json({
                            message : 'Child count for parent reached up to 15.Add node to another parent'
                        });
                    }else{
                        //this is inserting the very first branch
                        const newBranch = new Branch({
                            _id : new mongoose.Types.ObjectId(),
                            nodeName : req.body.nodeName,
                            parentNode : req.body.parentNode,
                            isRootNode : 'no',
                            isChildNode : 'Yes',
                            hasChildren : 'no',
                            childrenCount: 0
                        });
                        newBranch.save().then(branchInserted => {
                            console.log('Branch node inserted successfully - ' + branchInserted);
                            let childNodes = [];
                            childNodes = parentFound[0].childNodes;
                            childNodes.push(req.body.nodeName);
                            console.log('Number of child nodes = ' + childNodes.length);
                            Branch.updateOne( {nodeName : parentFound[0].nodeName} ,
                                {$set: {hasChildren: 'yes', childrenCount: (parentFound[0].childrenCount + 1),
                                        childNodes : childNodes}}).exec()
                                .then(insertionComplete => {
                                    //success activity... insert node to the parent and increment the child count on the parent.
                                    res.render('index', {message : 'Child Node added'});
                                }).catch(insertError => {
                                res.status(500).json({
                                    message : 'Error inserting branch. Try later',
                                    error : insertError
                                })
                            })

                        })
                    }
                }).catch(errFindingParent => {
                    res.status(500).json({
                        message : 'Error finding parent node',
                        error : errFindingParent
                    })
                });
            }
        }).catch(err => {
        res.status(500).json({
            message : 'Nothing to display now',
            error : err
        });
    });

});

router.post('/deleteChild', function(req,res){
    console.log('inside the delete function', req.body.deleteNode);
    Branch.find({nodeName : req.body.deleteNode}).exec()
        .then(branchFound => {
            //Once branch is found, decrement the child count on the parent and then delete the node.
            console.log('Parent name of the child - ' + branchFound[0].parentNode);
            Branch.find({nodeName : branchFound[0].parentNode}).exec()
                .then(parentFound => {
                    let childNodes;
                    childNodes = parentFound[0].childNodes;
                    let arrIndex = parentFound[0].childNodes.indexOf(req.body.deleteNode);
                    console.log('index value in the array - ' + arrIndex);
                    console.log('before deletion -' + childNodes.length);
                    if(arrIndex > -1){
                        childNodes.splice(arrIndex,1);
                        console.log('after deletion - ' + childNodes.length)
                    }
                    for(let j=0;j<childNodes.length;j++){
                        console.log(childNodes[j]);
                    }
                    Branch.updateOne({nodeName : parentFound[0].nodeName},
                        {$set : {childrenCount : parentFound[0].childrenCount - 1,
                            childNodes : childNodes}}).exec()
                        .then(parentUpdated =>{
                            console.log('Updated parent - '+ parentUpdated);
                            Branch.deleteOne({nodeName : req.body.deleteNode}).exec();
                            res.render('index', {message : 'Child Node deleted'});
                        });
                }).catch(errUpdatingParent => {
                    // res.render('error', {message:'Error updating parent'});
                console.log(errUpdatingParent)
            });
        }).catch(errFindingBranch => {
        // res.render('error', {message:'Error finding branch'});
        console.log(errFindingBranch);
    });

});

module.exports = router;
