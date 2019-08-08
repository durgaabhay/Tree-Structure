const mongoose = require('mongoose');

const treeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    nodeName : String,
    parentNode : String,
    isRootNode : String,
    isChildNode : String,
    hasChildren : String,
    childrenCount : Number,
    childNodes : [String]
});

module.exports = mongoose.model('TreeNode', treeSchema);
