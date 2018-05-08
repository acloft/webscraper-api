const express = require("express");
const app = express();
const cheerio = require("cheerio");
const rp = require("request-promise");
const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.post("/", getIngredientsFrom);

app.listen(9090);

function getIngredientsFrom(req, res) {
  const options = {
    uri: req.body.recipe,
    transform: function(body) {
      return cheerio.load(body);
    }
  };

  rp(options)
    .then($ => {
      let ingredients = [];
      $("#g_ingredients li").each(function(index, element) {
        if ($(this).text()) {
          ingredients.push($(this).text());
        }
      });
      res.status(200).json(ingredients);
    })
    .catch(err => {
      res.status(500).send(err);
    });
}
