/**
 * Created by tywang on 11/7/16.
 */
var s = "http://tuomailin.world.tmall.com/search.htm?user_number_id=1646350473";
var worldStr = ".world";
var index = s.indexOf(worldStr);
console.log(s.substring(0,index).concat(s.substr(index+ worldStr.length, s.length)));
console.log(s.replace("\.world",""));