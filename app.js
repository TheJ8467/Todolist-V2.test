//jshint esversion:6
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
mongoose.set("strictQuery", true);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://DeJ:910828@cluster0.98hz9ds.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const itemSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemSchema);

const firstItem = new Item({
  name: "Do excercise",
});

const secondItem = new Item({
  name: "Study with Udemy",
});

const thirdItem = new Item({
  name: "Eat food",
});

const defaultItems = [firstItem, secondItem, thirdItem];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved all");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:category", function (req, res) {
  const category = _.capitalize(req.params.category);

  List.findOne({ name: category }, function (err, results) {
    if (!err) {
      if (!results) {
        const list = new List({
          name: category,
          items: defaultItems,
        });

        list.save();
        // Item.insertMany(defaultItems, function (err) {
        //   if (err) {
        //     console.log(err);
        //   } else {
        //     console.log("Successfully made default!");
        //   }
        // });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: results.name,
          newListItems: results.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItemDocument = new Item({
    name: itemName,
    _id: new mongoose.Types.ObjectId(),
  });

  if (listName === "Today") {
    newItemDocument.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(newItemDocument);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const CheckedID = req.body.checkBox;
  const listNameForDelete = req.body.hiddenListName;

  if (listNameForDelete === "Today") {
    Item.findByIdAndRemove(CheckedID, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Removed succesfuly!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listNameForDelete },
      { $pull: { items: { _id: CheckedID } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listNameForDelete);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
