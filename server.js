//NodeJS Plugins
const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')

//Project bestanden
const ApiError = require('./model/ApiError')
const settings = require('./config/config')

//Express laden
let app = express()

//Bodyparser parsed de body van een request
app.use(bodyParser.json())

//Installeer Morgan als logger
app.use(morgan('dev'))

//Deze routes mogen worden bereikt zonder Authenticatie

	app.use('/api', routes/authentication.routes.js)

//Authenticatie voor alle standaard endpoints

    app.all('*', AuthController.validateToken);

//Standaard endpoints

		app.use('/api/studentenhuis', routes/studentenhuis.routes.js)
		app.use('/api/maaltijd', routes/maaltijd.routes.js)
		app.use('/api/deelnemer', routes/deelnemer.routes.js)

//Niet bestaande endpoint getriggerd
app.use('*', function (req, res, next) {
	const error = new ApiError("Deze endpoint bestaat niet", 404)
	next(error)
})

//Alle errors komen hier als APIError class
app.use((err, req, res, next) => {
	// console.dir(err)
	res.status((err.code || 404)).json(err).end()
})

//Luisteren naar poort
app.listen(settings.webPort, () => {
	console.log('Server running on port ' + settings.webPort)
})

//Exporteren voor Testcases
module.exports = app
