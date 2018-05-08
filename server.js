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
      let ingredients = {};
      $("#g_ingredients .ingredient-group").each(function(index, element) {
        let sectionName = $(this)
          .find("[data-serverid='IngredientHeading']")
          .text()
          ? $(this)
              .find("[data-serverid='IngredientHeading']")
              .text()
          : "ingredients";
        ingredients[sectionName] = [];

        $(this)
          .find("li")
          .each(function(index, element) {
            ingredients[sectionName].push($(this).text());
          });
      });

      res.status(200).json(ingredients);
    })
    .catch(err => {
      res.status(500).send(err);
    });
}
