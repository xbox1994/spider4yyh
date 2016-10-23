var https = require('https');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var URL = require('url');
var _ = require('underscore');

require('events').EventEmitter.prototype._maxListeners = 100;

function options(hostname,path,cookie){
    return {
        hostname: hostname,
        path: path,
        method: 'GET',
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
            'cookie': cookie,
        }
    }
};

function tMailSearchResultOptions(keyword) {
    return options('list.tmall.com','/search_product.htm?q='+encodeURI(keyword),'cna=fVICEO3ORiICAT23ilKdkGPH; _med=dw:1440&dh:900&pw:2880&ph:1800&ist:0; uss=UoLZWZbnFsOnHjmuIjS%2FUw%2BcVTMOgN8EGoqsvYXVOl%2FaPe%2Bg%2FEA8HAz%2F0RY%3D; sm4=420100; tracknick=thank007007; t=c6a45bd9d1fc50228ee1f682d300d6c2; _tb_token_=hVJhXExcUJS0; cookie2=8fd25ee1eff54be9bf3b8fee265d84e5; tk_trace=1; cq=ccp%3D1; pnm_cku822=045UW5TcyMNYQwiAiwZTXFIdUh1SHJOe0BuOG4%3D%7CUm5OcktxS3dIc0d7Q31GcyU%3D%7CU2xMHDJ7G2AHYg8hAS8XLgAgDkkgS2UzZQ%3D%3D%7CVGhXd1llXGZcYF9kUGxUalFkU25MdkJ9R3xJcUtzSnFEfkJ2TGI0%7CVWldfS0SMgw2FioTMx0nAjRYKVprT3IDOgczFTttOw%3D%3D%7CVmhIGCcePgIiHicYIAA7BDkDIx8mHyICNgs2FioTKhc3Aj4BVwE%3D%7CV25Tbk5zU2xMcEl1VWtTaUlwJg%3D%3D; res=scroll%3A1425*6207-client%3A1425*298-offset%3A1425*6207-screen%3A1440*900; l=Av//g-bX78bgVZvr2M9TVc7UD9mJ5FOG; isg=AmpqwdNkxi47y0VNqq1ZjCE6u9ajse41vJ476vQjFr1IJwrh3Gs-RbBV2eTB');
};

function tMailShopRedirectOptions(user_number_id){
    return options('store.taobao.com','/search.htm?user_number_id='+user_number_id,'cna=fVICEO3ORiICAT23ilKdkGPH; pnm_cku822=; cq=ccp%3D1; l=AhMTRdCplzR9qgev7FOH6RZmI5093KeK; isg=Ag8PUpR2iw2iqo_xXZPDmZZdnqXZN2NWoUk-eSEcv36F8C_yKwTzpg2gnJc0');
}

function tMailShopDetailOptions(url,path){
    return options(url,path,'cna=fVICEO3ORiICAT23ilKdkGPH; tracknick=thank007007; t=c6a45bd9d1fc50228ee1f682d300d6c2; _tb_token_=J9Jl9HFo8gc3; cookie2=72c76320a78bd18d01283ada8585ed79; pnm_cku822=; cq=ccp%3D1; l=AkdHq6Etpy7YbVOTUFeLCqD4V/ERTBsu; isg=AtXVAIY5IRiOdgrsSRQe3VLz5NcDbYnkD0c0C1d6kcybrvWgHyKZtONsFgXi');
}

var user_number_id_index = 45;

var spider = {

    run: function (body){
        var keyword = body.keyword;
        var soleShopArray = new Array();
        var result = new Array();

        //1.主页开始搜索
        var req = https.request(tMailSearchResultOptions(keyword), function(res){
            var htmlContent = new BufferHelper();
            console.log(res.statusCode);

            res.on('data', function (chunk) {
                htmlContent.concat(chunk);
            });

            res.on('end', function () {
                var $ = cheerio.load(iconv.decode(htmlContent.toBuffer(), 'gbk'));
                for(var i = 0 ; i < $('.productShop-name').length ; i++){
                    var shopNameDom = $('.productShop-name')[i];
                    var shopNameId = shopNameDom.attribs.href.substring(user_number_id_index,shopNameDom.attribs.href.indexOf('&'));

                    if(_.contains(soleShopArray,shopNameId)){
                        continue;
                    }else{
                        soleShopArray.push(shopNameId);
                    }

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
                                    var $ = cheerio.load(iconv.decode(htmlContent.toBuffer(), 'gbk'));
                                    var area = $("li.locus div.right").text().trim();
                                    //匹配输入地区的店铺
                                    if(body.area.indexOf(area) >= 0){
                                        var output = ress.headers.location;
                                        result.push(output);
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

        })
        req.end();
        return result;
    }
};

module.exports = spider;