const express = require("express");
let app = express();
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const Person = require("./models/person");

app.use(cors());
app.use(express.static("build"));

morgan.token("id", (req) => {
  //creating id token
  return JSON.stringify(req.body);
});

app.use(morgan(":method :url :status :res[content-length] :response-time :id"));

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(express.json());

let persons = [];

const errorHandler = (error, request, response, next) => {
  console.log(error.message);
  if (error.name === "CastError") {
    response.status(400).send({ message: "Malformatted id" });
  }
  next(error);
};

app.get("/api/persons", (request, response) => {
  Person.find({}).then((people) => {
    response.json(people);
  });
});

app.get("/info", (request, response) => {
  Person.find({}).then((people) => {
    const pplNum = people.length;
    const date = Date();
    response.send(
      `<p>Phonebook has info for ${pplNum} people</p> <p>${date}</p>`
    );
  });
});

app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then((result) => response.status(204).end())
    .catch((error) => next(error));
});

app.post("/api/persons", (request, response) => {
  const newPersonJSON = request.body;

  if (!newPersonJSON.name || !newPersonJSON.number) {
    response.status(400).json({ error: "Name and number must be filled" });
  } else {
    const newPerson = new Person({
      name: newPersonJSON.name,
      number: newPersonJSON.number,
    });
    newPerson.save().then((savedPerson) => {
      response.json(savedPerson);
    });
  }
});

app.put("/api/persons/:id", (request, response, next) => {
  const body = request.body;

  const updatedPerson = {
    name: body.name,
    number: body.number,
  };

  Person.findByIdAndUpdate(request.params.id, updatedPerson, { new: true })
    .then((updatedPerson) => {
      response.json(updatedPerson);
    })
    .catch((error) => next(error));
});

app.use(unknownEndpoint);

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
