var express = require('express');
var router = express.Router();
var spider = require('../spider')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { result: 'for yyh' });
});

router.post('/', function(req, res, next) {
  res.render('index', { result: spider.run(req.body) });
});

module.exports = router;
