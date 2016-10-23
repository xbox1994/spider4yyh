var https = require('https');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var URL = require('url');
var _ = require('underscore');
var async = require('async');

require('events').EventEmitter.prototype._maxListeners = 100;
var user_number_id_index = 45;

function options(hostname,path,cookie){
    return {
        hostname: hostname,
        path: path,
        method: 'GET',
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
            'cookie': cookie,
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'accept-encoding' : 'gzip, deflate, sdch, br',
            'accept-language' : 'en-US,en;q=0.8,zh-CN;q=0.6,zh;q=0.4',
            'cache-control' : 'no-cache',
            'dnt' : 1,
            'pragma' : 'no-cache',
            'upgrade-insecure-requests' : 1
        }
    }
};

function tMailSearchResultOptions(keyword,s) {
    return options('list.tmall.com','/search_product.htm?q='+encodeURI(keyword)+"&s="+s,'cna=fVICEO3ORiICAT23ilKdkGPH; _med=dw:1440&dh:900&pw:2880&ph:1800&ist:0; tracknick=thank007007; t=c6a45bd9d1fc50228ee1f682d300d6c2; _tb_token_=J9Jl9HFo8gc3; cookie2=72c76320a78bd18d01283ada8585ed79; pnm_cku822=017UW5TcyMNYQwiAiwZTXFIdUh1SHJOe0BuOG4%3D%7CUm5OcktxS3RKdkp1TXRPdyE%3D%7CU2xMHDJ7G2AHYg8hAS8XLgAgDkkgS2UzZQ%3D%3D%7CVGhXd1llXGZcY11hXWJaY1hgV2pIfUlyTnpAdEpyR31EeEF1TmA2%7CVWldfS0SMgk2FigIJlVyVXstew%3D%3D%7CVmhIGCccPAEhHSQbIwM4BTsBIR0kHSAANAk0FCgRKBU1ADwDVQM%3D%7CV25Tbk5zU2xMcEl1VWtTaUlwJg%3D%3D; res=scroll%3A1425*5979-client%3A1425*309-offset%3A1425*5979-screen%3A1440*900; cq=ccp%3D1; l=AtLSgK04qp2FaiZQlaj2-WLUopK0k9bx; isg=Avz8C_jpiIMQQrPXCFOndiM8zZwbiKAffljt0NZ9eOdGoZ0r_Qa2ryFT734j');
};

function tMailShopRedirectOptions(user_number_id){
    return options('store.taobao.com','/search.htm?user_number_id='+user_number_id,'cna=fVICEO3ORiICAT23ilKdkGPH; pnm_cku822=; cq=ccp%3D1; l=AhMTRdCplzR9qgev7FOH6RZmI5093KeK; isg=Ag8PUpR2iw2iqo_xXZPDmZZdnqXZN2NWoUk-eSEcv36F8C_yKwTzpg2gnJc0');
}

function tMailShopDetailOptions(url,path){
    return options(url,path,'cna=fVICEO3ORiICAT23ilKdkGPH; tracknick=thank007007; t=c6a45bd9d1fc50228ee1f682d300d6c2; _tb_token_=J9Jl9HFo8gc3; cookie2=72c76320a78bd18d01283ada8585ed79; pnm_cku822=; cq=ccp%3D1; l=AkdHq6Etpy7YbVOTUFeLCqD4V/ERTBsu; isg=AtXVAIY5IRiOdgrsSRQe3VLz5NcDbYnkD0c0C1d6kcybrvWgHyKZtONsFgXi');
}

var spider = {

    run: function (body,response){
        var keyword = body.keyword || "";
        var pageCount = body.pageCount || 1;
        var soleShopArray = new Array();
        var processedCount = 0;
        var result = new Array();

        //1.主页开始搜索
            var s = pageCount * 60;
            https.request(tMailSearchResultOptions(keyword,s), function(res){
                var htmlContent = new BufferHelper();

                if(res.statusCode == 302){
                    console.log(res.statusCode);
                    response.render('index', { result:  "搜索频率过高!"});
                }

                res.on('data', function (chunk) {
                    htmlContent.concat(chunk);
                });

                res.on('end', function () {
                    var $ = cheerio.load(iconv.decode(htmlContent.toBuffer(), 'gbk'));
                    for(var i = 0 ; i < $('.productShop-name').length ; i++){
                        var shopNameDom = $('.productShop-name')[i];
                        var shopNameId = shopNameDom.attribs.href.substring(user_number_id_index,shopNameDom.attribs.href.indexOf('&'));

                        console.log(i,",",soleShopArray.length,shopNameId);
                        if(_.contains(soleShopArray,shopNameId)){
                            continue;
                        }else{
                            soleShopArray.push(shopNameId);
                        }

                    }
                    for(var i = 0 ; i < soleShopArray.length ; i++){
                        //2.第一次重定向
                        var redirectReq1 = https.request(tMailShopRedirectOptions(shopNameId),function(res){
                            var redirect1Url = res.headers.location;
                            //3.第二次重定向
                            var redirectReq2 = https.get(redirect1Url,function(ress){
                                //4.真实url
                                var realUrl = URL.parse(ress.headers.location);
                                var realShopReq = https.request(tMailShopDetailOptions(realUrl.hostname,realUrl.path),function(res){
                                    var htmlContent = new BufferHelper();
                                    res.on('data', function (chunk) {
                                        htmlContent.concat(chunk);
                                    });
                                    res.on('end', function () {
                                        processedCount ++;
                                        var $ = cheerio.load(iconv.decode(htmlContent.toBuffer(), 'gbk'));
                                        var area = $("li.locus div.right").text().trim();
                                        //匹配输入地区的店铺
                                        console.log(processedCount,"-",soleShopArray.length);
                                        if(body.area.indexOf(area) >= 0){
                                            var shopUrl = ress.headers.location;
                                            result.push(shopUrl);
                                        }
                                        if(processedCount === soleShopArray.length){
                                            response.render('index', { result:  result});
                                        }
                                    });

                                })
                                realShopReq.end();
                            });
                            redirectReq2.end();
                        });
                        redirectReq1.end();
                    }
                });
            }).end();
    }
};

module.exports = spider;