var crypto = require('crypto');

module.exports = {

generateHash : function(nameAndNumber){
return crypto.createHash('md5').update(nameAndNumber).digest("hex");
}
};
