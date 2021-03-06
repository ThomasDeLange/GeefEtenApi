//CRUD Operaties deelnemer
const ApiError = require("../model/ApiError")
const DeelnemerResponse = require("../model/DeelnemerResponse")
const Deelnemer = require("../model/Deelnemer")
const authentication = require("../util/auth/authentication");
const db = require("../config/db");
const assert = require("assert")

module.exports = {
  
  /***********************************************************\
  ***** Registreer voor maaltijd met huisID en maaltijdID *****
  \***********************************************************/
  registreerVoorMaaltijd(req, res, next) {

    //Testen
    const huisId = Number(req.params.huisId)
    const maaltijdId = Number(req.params.maaltijdId)
    try {
      assert(typeof (huisId) === 'number', 'huisId must be a number.')
      assert(typeof (maaltijdId) === 'number', 'maaltijdId must be a number.')
      assert(!isNaN(huisId), 'huisId must be a number.')
      assert(!isNaN(maaltijdId), 'maaltijdId must be a number.')
    }

    catch (ex) {
        next(new ApiError(ex.toString(), 412))
        return
    }


    //Deelnemer maken
    const deelnemer = new Deelnemer(huisId, maaltijdId)

    //Token uit header halen
    const token = req.header('x-access-token') || ''
    
    //Token decoderen
    authentication.decodeToken(token, (err, payload) => {

      if (err) {

        //Foutief token, ga naar error endpoint
        next(new ApiError(err.message || err, 401))

      } else {

        //Deelnemer toevoegen
        db.query({
            sql: "INSERT INTO deelnemers VALUES(" + payload.sub.id + "," + deelnemer.huisId + ", " + deelnemer.maaltijdId + ")",
            timeout: 2000
          }, (ex, rows, fields) => {
            if (ex) {
              
              //Dubbele waarde of onbestaande kolom
              if (ex.errno == 1062) { next(new ApiError("User has already signed in for this combination of HuisId and MaaltijdId", 409));}
              else if (ex.errno == 1452) { next(new ApiError("Combination of HuisId and MaaltijdId does not exist", 404));}
              else {next(new ApiError(ex, 404));}
            } else {

              //Deelnemer van view verkrijgen
              db.query({
                  sql: "SELECT * FROM view_deelnemers WHERE StudentenhuisID=" + deelnemer.huisId + " AND MaaltijdID=" + deelnemer.maaltijdId + " AND Email=(SELECT Email FROM user WHERE ID=" + payload.sub.id + ")",
                  timeout: 2000
                },(ex, rows, fields) => {
                  if (ex) {

                    //Error
                    next(new ApiError(ex, 412));
                  } else {

                    //Array maken en alles omzetten
                    const row = rows[0];
                    const response = new DeelnemerResponse(row.Voornaam, row.Achternaam, row.Email)

                    //Correct, stuur deelnemer terug
                    res.status(200).json(response).end();
                  }
                }
              );
            }
          }
        );
      }
    })
  },

  /***************************************************\
  ***** Krijg deelnemers met huisID en maaltijdID *****
  \***************************************************/
  krijgDeelnemers(req, res, next) {

    //Testen
    const huisId = Number(req.params.huisId)
    const maaltijdId = Number(req.params.maaltijdId)
    try {
      assert(typeof (huisId) === 'number', 'huisId must be a number.')
      assert(typeof (maaltijdId) === 'number', 'maaltijdId must be a number.')
      assert(!isNaN(huisId), 'huisId must be a number.')
      assert(!isNaN(maaltijdId), 'maaltijdId must be a number.')
    }

    catch (ex) {
        next(new ApiError(ex.toString(), 412))
        return
    }

    //Deelnemer maken
    const deelnemer = new Deelnemer(huisId, maaltijdId)

    //Voer query uit die alle items uit deelnemers haalt
    db.query({
      sql: "SELECT * FROM view_deelnemers WHERE StudentenhuisID = " + deelnemer.huisId + " AND MaaltijdID = " + deelnemer.maaltijdId,
      timeout: 2000
    }, (ex, rows, fields) => {

      //Error
      if (ex) {
        next(new ApiError(ex.toString(), 422));
      } else {

        //Array leeg?
        if (rows.length == 0) {
          next(new ApiError("HuisID " + deelnemer.huisId + " with MaaltijdId " + deelnemer.maaltijdId + " has no record(s)", 404));

        } else {

          //Array maken en rows omzetten naar DeelnemerResponses
          let response = new Array();
          rows.forEach(row => {
            response.push(new DeelnemerResponse(row.Voornaam, row.Achternaam, row.Email));
          });

          //Stuur deelnemers terug
          res.status(200).json(response).end();
        }
      }
    })
  },

  /*******************************************************\
  ***** Verwijder deelnemers met huisID en maaltijdID *****
  \*******************************************************/
  verwijderDeelnemer(req, res, next) {

    //Testen
    const huisId = Number(req.params.huisId)
    const maaltijdId = Number(req.params.maaltijdId)
    try {
      assert(typeof (huisId) === 'number', 'huisId must be a number.')
      assert(typeof (maaltijdId) === 'number', 'maaltijdId must be a number.')
      assert(!isNaN(huisId), 'huisId must be a number.')
      assert(!isNaN(maaltijdId), 'maaltijdId must be a number.')
    }

    catch (ex) {
        next(new ApiError(ex.toString(), 412))
        return
    }

    //Deelnemer maken
    const deelnemer = new Deelnemer(huisId, maaltijdId)

    //Token uit header halen
    const token = req.header('x-access-token') || ''

    //Token decoderen
    authentication.decodeToken(token, (err, payload) => {

      if (err) {

        //Foutief token, ga naar error endpoint
        next(new ApiError(err.message || err, 401))

      } else {

        //Voer query uit die het item in deelnemer verwijderd
        db.query({
          sql: "SELECT UserID FROM deelnemers WHERE StudentenhuisID=" + deelnemer.huisId + " AND MaaltijdID=" + deelnemer.maaltijdId,
          timeout: 2000
        }, (ex, rows, fields) => {

          //Error
          if (ex) {

            next(new ApiError(ex.toString(), 404));

          } else if (rows.length == 0) {

            //Geen rows geselecteerd, deelnemer is niet gevonden
            next(new ApiError("Deelnemer not found", 404))

          } else {

            //Voer query uit die het item in deelnemers verwijderd
            db.query({
              sql: 'DELETE FROM deelnemers WHERE UserID=' + payload.sub.id + " AND StudentenhuisID=" + deelnemer.huisId + " AND MaaltijdID=" + deelnemer.maaltijdId,
              timeout: 2000
            }, (ex, rows, fields) => {

              //Error
              if (ex) {

                next(new ApiError(ex.toString(), 404));

              } else if (rows.affectedRows == 0) {

                //Geen rows veranderd, deelnemer is niet gevonden
                next(new ApiError("User is not authorized to remove StudentenhuisID " + deelnemer.huisId + " with MaaltijdID " + deelnemer.maaltijdId, 409));

              } else {

                //Correct, stuur succes terug
                res.status(200).json({'removed': 'succesfull'}).end()
              }
            })
          }
        })
      }
    })
  }
}
