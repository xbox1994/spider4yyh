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

function tMailSearchResultOptions(keyword,s) {
    console.log('/search_product.htm?q='+encodeURI(keyword)+"&s="+s);
    return options('list.tmall.com','/search_product.htm?q='+encodeURI(keyword)+"&s="+s,'cna=fVICEO3ORiICAT23ilKdkGPH; _med=dw:1440&dh:900&pw:2880&ph:1800&ist:0; cq=ccp%3D0; _tb_token_=J9Jl9HFo8gc3; ck1=; uc1=cookie14=UoWwI9%2BGZ8dSGg%3D%3D&lng=zh_CN&cookie16=WqG3DMC9UpAPBHGz5QBErFxlCA%3D%3D&existShop=false&cookie21=U%2BGCWk%2F7pY%2FF&tag=7&cookie15=UIHiLt3xD8xYTw%3D%3D&pas=0; uc3=sg2=VFc2%2F%2BBTaxORR3JhOsLot0m%2Fo03VpzpmJ7%2BMidM7UCM%3D&nk2=F55rWnbBGzFgPwU%3D&id2=UoH8WADqwMSrzA%3D%3D&vt3=F8dAS18%2BAw2mv7IdRkY%3D&lg2=UIHiLt3xD8xYTw%3D%3D; lgc=thank007007; tracknick=thank007007; cookie2=72c76320a78bd18d01283ada8585ed79; cookie1=UoM7yWpINCvuAeiCY0%2FnCXZ4%2Fe0DHznpMIrungsLrRs%3D; unb=1035160900; t=c6a45bd9d1fc50228ee1f682d300d6c2; skt=ceca18d5fd290b92; _nk_=thank007007; _l_g_=Ug%3D%3D; cookie17=UoH8WADqwMSrzA%3D%3D; hng=; uss=UIHwfPgem4he4CYU33wj%2FPacZjGiPU6OPK%2FVv054ZuKnBaN6faSnmk6palI%3D; login=true; _m_user_unitinfo_=center; _m_h5_tk=ff4b22bd9a333175d59e7a6c63071f9a_1477237768514; _m_h5_tk_enc=fa419f5f70d71db7fdefc22738f1debe; tt=tmall-main; pnm_cku822=201UW5TcyMNYQwiAiwZTXFIdUh1SHJOe0BuOG4%3D%7CUm5OcktxS3RKdE13Q3dKcCY%3D%7CU2xMHDJ7G2AHYg8hAS8XLgAgDkkgS2UzZQ%3D%3D%7CVGhXd1llXGZcY11jWmBUYF1nUG1PekZ4TXdNckp0SnRMc0x1S2Uz%7CVWldfS0QMAUxBCQYJAQqASQSZhI8ajw%3D%7CVmhIGCccPAEhHSQbIwM4BzoAIBwlHCEBNQg1FSkQKRQ0AT0CVAI%3D%7CV25Tbk5zU2xMcEl1VWtTaUlwJg%3D%3D; res=scroll%3A1425*6207-client%3A1425*342-offset%3A1425*6207-screen%3A1440*900; l=AtfX/qKqN97IHcNjQAc7WjDH50EhQKt-; isg=AmRk09UH4Ns3XhufoEu_vvu0NWTY04hnFuBFmH6FrC_yKQXzpg7g99TLhzbL');
};

function tMailShopRedirectOptions(user_number_id){
    return options('store.taobao.com','/search.htm?user_number_id='+user_number_id,'cna=fVICEO3ORiICAT23ilKdkGPH; pnm_cku822=; cq=ccp%3D1; l=AhMTRdCplzR9qgev7FOH6RZmI5093KeK; isg=Ag8PUpR2iw2iqo_xXZPDmZZdnqXZN2NWoUk-eSEcv36F8C_yKwTzpg2gnJc0');
}

function tMailShopDetailOptions(url,path){
    return options(url,path,'cna=fVICEO3ORiICAT23ilKdkGPH; _med=dw:1440&dh:900&pw:2880&ph:1800&ist:0; cq=ccp%3D0; _tb_token_=J9Jl9HFo8gc3; ck1=; uc1=cookie14=UoWwI9%2BGZ8dSGg%3D%3D&lng=zh_CN&cookie16=WqG3DMC9UpAPBHGz5QBErFxlCA%3D%3D&existShop=false&cookie21=U%2BGCWk%2F7pY%2FF&tag=7&cookie15=UIHiLt3xD8xYTw%3D%3D&pas=0; uc3=sg2=VFc2%2F%2BBTaxORR3JhOsLot0m%2Fo03VpzpmJ7%2BMidM7UCM%3D&nk2=F55rWnbBGzFgPwU%3D&id2=UoH8WADqwMSrzA%3D%3D&vt3=F8dAS18%2BAw2mv7IdRkY%3D&lg2=UIHiLt3xD8xYTw%3D%3D; lgc=thank007007; tracknick=thank007007; cookie2=72c76320a78bd18d01283ada8585ed79; cookie1=UoM7yWpINCvuAeiCY0%2FnCXZ4%2Fe0DHznpMIrungsLrRs%3D; unb=1035160900; t=c6a45bd9d1fc50228ee1f682d300d6c2; skt=ceca18d5fd290b92; _nk_=thank007007; _l_g_=Ug%3D%3D; cookie17=UoH8WADqwMSrzA%3D%3D; hng=; uss=UIHwfPgem4he4CYU33wj%2FPacZjGiPU6OPK%2FVv054ZuKnBaN6faSnmk6palI%3D; login=true; _m_user_unitinfo_=center; _m_h5_tk=ff4b22bd9a333175d59e7a6c63071f9a_1477237768514; _m_h5_tk_enc=fa419f5f70d71db7fdefc22738f1debe; tt=tmall-main; pnm_cku822=201UW5TcyMNYQwiAiwZTXFIdUh1SHJOe0BuOG4%3D%7CUm5OcktxS3RKdE13Q3dKcCY%3D%7CU2xMHDJ7G2AHYg8hAS8XLgAgDkkgS2UzZQ%3D%3D%7CVGhXd1llXGZcY11jWmBUYF1nUG1PekZ4TXdNckp0SnRMc0x1S2Uz%7CVWldfS0QMAUxBCQYJAQqASQSZhI8ajw%3D%7CVmhIGCccPAEhHSQbIwM4BzoAIBwlHCEBNQg1FSkQKRQ0AT0CVAI%3D%7CV25Tbk5zU2xMcEl1VWtTaUlwJg%3D%3D; res=scroll%3A1425*6207-client%3A1425*342-offset%3A1425*6207-screen%3A1440*900; l=AtfX/qKqN97IHcNjQAc7WjDH50EhQKt-; isg=AmRk09UH4Ns3XhufoEu_vvu0NWTY04hnFuBFmH6FrC_yKQXzpg7g99TLhzbL');
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
                    response.render('index', { result:  "搜索频率过高1!"});
                }

                res.on('data', function (chunk) {
                    htmlContent.concat(chunk);
                });

                res.on('end', function () {
                    var $ = cheerio.load(iconv.decode(htmlContent.toBuffer(), 'gbk'));
                    console.log($('.productShop-name').length);
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
                                        if(res.statusCode == 302){
                                            response.render('index', { result:  "搜索频率过高2!"});
                                        }

                                        res.on('data', function (chunk) {
                                            htmlContent.concat(chunk);
                                        });
                                        res.on('end', function () {
                                            processedCount ++;
                                            var $ = cheerio.load(iconv.decode(htmlContent.toBuffer(), 'gbk'));
                                            var area = $("li.locus div.right").text().trim();
                                            //匹配输入地区的店铺
                                            console.log(body.area,",",area,processedCount,"-",soleShopArray.length);
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