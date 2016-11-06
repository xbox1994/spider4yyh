var https = require('https');
var fs = require('fs');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var BufferHelper = require('bufferhelper');
var URL = require('url');
var _ = require('underscore');
var async = require('async');

require('events').EventEmitter.prototype._maxListeners = 100;
var user_number_id_index = 45;

function options(hostname, path) {
    return {
        hostname: hostname,
        path: path,
        method: 'GET',
        headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
            'cookie': 'cna=fVICEO3ORiICAT23ilKdkGPH; ck1=; _m_user_unitinfo_=center; _m_h5_tk=ff4b22bd9a333175d59e7a6c63071f9a_1477237768514; _m_h5_tk_enc=fa419f5f70d71db7fdefc22738f1debe; pnm_cku822=; _tb_token_=J9Jl9HFo8gc3; uc3=nk2=F55rWnbBGzFgPwU%3D&id2=UoH8WADqwMSrzA%3D%3D&vt3=F8dAS18%2BAw2mv7IdRkY%3D&lg2=W5iHLLyFOGW7aA%3D%3D; uss=UIHwfPgem4he4CYU33wj%2FPacZjGiPU6OPK%2FVv054ZuKnBaN6faSnmk6palI%3D; lgc=thank007007; tracknick=thank007007; skt=ceca18d5fd290b92; _l_g_=Ug%3D%3D; hng=CN%7Czh-cn%7CCNY; cookie2=72c76320a78bd18d01283ada8585ed79; cookie1=UoM7yWpINCvuAeiCY0%2FnCXZ4%2Fe0DHznpMIrungsLrRs%3D; uc1=cookie15=VT5L2FSpMGV7TQ%3D%3D&existShop=false; unb=1035160900; t=c6a45bd9d1fc50228ee1f682d300d6c2; _nk_=thank007007; cookie17=UoH8WADqwMSrzA%3D%3D; login=true; l=ApOTxOVtu0psMYcvbNMHbgxpox29UicK; isg=As7OlTB7GjUBHqGZprl1YOVmH6IvAZJJ-NIfHvgXIFGMW261YN_iWXQb_TDN',
        }
    }
};

function tMailSearchResultOptions(keyword, s) {
    return options('list.tmall.com', '/search_product.htm?q=' + encodeURI(keyword) + "&s=" + s);
};

function tMailShopRedirectOptions(user_number_id) {
    return options('store.taobao.com', '/search.htm?user_number_id=' + user_number_id);
}

function tMailShopDetailOptions(url, path) {
    return options(url, path);
}

var tMallShopDetailSpider = {

    run: function (body, callback) {
        var soleShopArray = new Array();
        var processedCount = 0;

        //0.请求pageCount个页面
        var tasksToGo = body.pageCount;
        console.log(body.pageCount);
        for (var i = 1; i <= tasksToGo; i++) {
            var s = i * 60;
            requestTMallSearchResult(s);
        }

        function render(){
            if(++processedCount === soleShopArray.length){
                callback("finished!");
            }
        }

        //4.具体店铺信息,真实URL

        function requestShopDetail(realUrl) {
            var realUrl = URL.parse(realUrl);
            var realShopReq = https.request(tMailShopDetailOptions(realUrl.hostname, realUrl.path), function (res) {

                console.log(res.headers.location,res.statusCode);

                if(res.statusCode == 302){
                    requestShopDetail(res.headers.location);
                    return;
                }
                var htmlContent = new BufferHelper();

                res.on('data', function (chunk) {
                    htmlContent.concat(chunk);
                });
                res.on('end', function () {
                    var $ = cheerio.load(iconv.decode(htmlContent.toBuffer(), 'gbk'));
                    var area = $("li.locus div.right").text().trim();
                    if(area.length === 0){
                        area = $(".tb-certificate").text().trim();
                    }
                    console.log(area);
                    //匹配输入地区的店铺
                    if (area.indexOf(body.area) >= 0) {
                        console.log("!!!", "found", "!!!", area);
                        callback({url:realUrl.href, progress:processedCount + "/" + soleShopArray.length});
                    }
                    render();
                    console.log(processedCount + "/" + soleShopArray.length);
                });
            });
            realShopReq.on('error', function (e) {
                console.log(e);
                render();
            });
            realShopReq.end();
        }

        //3.第二次重定向
        function requestRedirect2(redirect1Url) {
            var redirectReq2 = https.get(redirect1Url, function (res) {
                console.log(res.headers.location,res.statusCode);
                if (res.headers.location !== undefined) {
                    requestShopDetail(res.headers.location);
                } else {
                    render();
                }
            });
            redirectReq2.on('error', function (e) {
                console.log(e);
                render();
            });
            redirectReq2.end();
        }

        //2.第一次重定向
        function requestRedirect1(shopNameId) {
            var redirectReq1 = https.request(tMailShopRedirectOptions(shopNameId), function (res) {
                console.log(res.headers.location,res.statusCode);
                var redirect1Url = res.headers.location;
                requestRedirect2(redirect1Url);
            });
            redirectReq1.on('error', function (e) {
                console.log(e);
                render();
            });
            redirectReq1.end();
            return redirectReq1;
        }


        function ready_GetShopsArray($) {
            console.log("sum in current page: ", $('.productShop-name').length);
            for (var i = 0; i < $('.productShop-name').length; i++) {
                var shopNameDom = $('.productShop-name')[i];
                var shopNameId = shopNameDom.attribs.href.substring(user_number_id_index, shopNameDom.attribs.href.indexOf('&'));
                if (_.contains(soleShopArray, shopNameId)) {
                    continue;
                } else {
                    console.log(i + ">>" + soleShopArray.length);
                    soleShopArray.push(shopNameId);
                }
            }
            if (--tasksToGo === 0) {
                soleShopArray.forEach(function (key) {
                    requestRedirect1(key);
                });
            }
        }

        //1.按关键词搜索某一页所有产品
        function requestTMallSearchResult(s) {
            https.request(tMailSearchResultOptions(body.keyword, s), function (res) {
                var htmlContent = new BufferHelper();
                res.on('data', function (chunk) {
                    htmlContent.concat(chunk);
                });

                res.on('end', function () {
                    ready_GetShopsArray(cheerio.load(iconv.decode(htmlContent.toBuffer(), 'gbk')));
                });
            }).end();
        }
    }
};

module.exports = tMallShopDetailSpider;

//1.如何延时发送异步请求
//2.多次请求之间导致的错误情况复杂难以统计导致无法统计已经处理过的数量
//3.socket一打开页面就保持了,能不能点击打开处理完成后关闭