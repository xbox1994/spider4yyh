
var tMallShopDetailSpider = require('./tMallShopDetailSpider');

var search = function(io){
    var searchIO = io
        .on('connection', function (socket) {
            socket.on('searchInfo', function (data) {
                console.log(data);
                tMallShopDetailSpider.run(JSON.parse(data),function(result){
                    searchIO.emit("searchResult", result);
                });
            });
        });
};

module.exports = search;