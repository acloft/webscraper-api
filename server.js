const express = require("express");
const app = express();
const cheerio = require("cheerio");
const rp = require("request-promise");
const bodyParser = require("body-parser");
const mongo = require("./mongodb");
const conn = mongo.connection;
const dotenv = require("dotenv");

dotenv.config();

const port = 9090;
app.use(bodyParser.json());

app.post("/", saveIngredientsFrom);

mongo
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(port);
  })
  .then(() => {
    console.log(`Magic happens on port ${port}`);
  });

function saveIngredientsFrom(req, res) {
  const options = {
    uri: req.body.recipe,
    transform: function(body) {
      return cheerio.load(body);
    }
  };
  rp(options)
    .then($ => {
      const recipe = {
        recipeName: $("[data-serverid='MoreTitleURL']").text(),
        recipeUrl: req.body.recipe,
        ingredients: {}
      };

      $("#g_ingredients .ingredient-group").each(function(index, element) {
        let sectionName = $(this)
          .find("[data-serverid='IngredientHeading']")
          .text()
          ? `${$(this)
              .find("[data-serverid='IngredientHeading']")
              .text()
              .toLowerCase()}`
          : "all";
        recipe.ingredients[sectionName] = [];

        $(this)
          .find("li")
          .each(function(index, element) {
            recipe.ingredients[sectionName].push($(this).text());
          });
      });
      return recipe;
    })
    .then(createRecipeEntry)
    .then(recipe => {
      res.status(200).json(recipe);
    })
    .catch(err => {
      res.status(500).send(err);
    });
}

function createRecipeEntry(recipe) {
  return conn
    .db()
    .collection("recipes")
    .insert(recipe)
    .then(data => {
      return data.ops[0];
    });
}
