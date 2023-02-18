process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// Environment Variables
require('dotenv').config({ path: '.env' });
// Helmet is required for securing the request response headers
const helmet = require('helmet');

const express = require("express");
const cors = require('cors');
const port = process.env.PORT || 3000
let path = require('path');
let session = require('express-session');
const morgan = require('morgan');

// swagger docs
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

//Initializing Express
const app = express();


//const server = require('http').Server(app);


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Credentials', true);
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});


// body parser
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(express.json({ limit: '50mb' }))


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.use(express.static(path.join(__dirname, 'public')));


app.set('view-engine', 'ejs');

//CORS Middleware
app.use(cors());
app.options('*', cors());


// Middleware is enabled to use helmet default options
app.use(helmet());

//CORS Middleware
app.use(cors());

//Logging Format
morgan.format('combined', '(:date[clf]) -> ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms');
app.use(morgan('combined'));


//Initializing Passport
// app.use(passport.initialize());
// app.use(passport.session());
// require('./app/config/passport')(passport);


const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ULP Mddleware',
      description: 'This is ulp desciption',
      termsOfService: 'http://swagger.io/terms/',
      contact:
        {email: `apiteam@swagger.io`},
      version: '1.0.0',
    },
servers: [
  {
    url: 'http://localhost:3000/'
  }
]
  },
apis: ['./index.js', './app/modules/api.routes.js'] // files containing annotations as above
};

const openapiSpecification = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification, { explorer: true }));


// /**
//  * @swagger
//  * /:
//  *   get:
//  *     summary: Test healthcheck API
//  *     responses:
//  *       200:
//  *         description: Message hi.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/'
//  *       500:
//  *         description: Some server error
//  *
//  */
app.get('/', (req, res) => res.json({ message: 'hi' }));

// /**
//  * @swagger
//  * /v1:
//  *   get:
//  *     summary: Get version
//  *     responses:
//  *       200:
//  *         description: Welcome v1.0!!!
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/'
//  *       500:
//  *         description: Some server error
//  *
//  */
app.get("/v1", (req, res) => {
  res.send("Welcome v1.0!!!");
});

const api = require('./app/modules/api.routes');

app.use('/v1/credentials', api);


app.listen(port, () => {
  console.log(`Server is running on Port: ${port}`);
});