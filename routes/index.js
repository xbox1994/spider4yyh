var express = require('express');
var router = express.Router();
var spider = require('../tMallShopDetailSpider')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { result: '' });
});

router.post('/', function(req, res, next) {
  spider.run(req.body, res);
});

module.exports = router;
