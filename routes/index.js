var express = require('express');
var router = express.Router();
var spider = require('../spider')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { result: 'for yyh' });
});

router.post('/', function(req, res, next) {
  spider.run(req.body, res);
});

module.exports = router;
