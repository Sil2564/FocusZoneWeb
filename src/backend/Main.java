package backend;

import static spark.Spark.*;
import com.google.gson.Gson;

public class Main {
    public static void main(String[] args) {

        // Porta del server
        port(4567);

        // Serve i file statici (HTML, CSS, JS)
        staticFiles.externalLocation("web");

        // ✅ CORS
        options("/*", (request, response) -> {
            String headers = request.headers("Access-Control-Request-Headers");
            if (headers != null) response.header("Access-Control-Allow-Headers", headers);
            String methods = request.headers("Access-Control-Request-Method");
            if (methods != null) response.header("Access-Control-Allow-Methods", methods);
            return "OK";
        });

        before((req, res) -> {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            res.header("Access-Control-Allow-Headers", "*");
        });

        // Home
        get("/", (req, res) -> {
            res.redirect("/index.html");
            return null;
        });

        // Rotta test
        get("/ping", (req, res) -> "pong");

        // Backend logica sessione
        StudioSession sessione = new StudioSession();
        Gson gson = new Gson();

        // ✅ UNICA route /start che registra e simula la sessione
        post("/start", (req, res) -> {
            StartRequest json = gson.fromJson(req.body(), StartRequest.class);

            // 1️⃣ Avvia sessione con materia e note
            sessione.startSession(json.materia, json.note);

            // 2️⃣ Avvia simulazione automatica
            SimulatoreSessione simulatore = new SimulatoreSessione(sessione, json.materia, json.note);
            simulatore.start();

            return "Sessione avviata e simulazione partita per materia: " + json.materia;
        });

        // Aggiorna stato sessione
        post("/update", (req, res) -> {
            UpdateRequest json = gson.fromJson(req.body(), UpdateRequest.class);
            sessione.update(json.presente);
            return "Aggiornamento ricevuto.";
        });

        // Termina sessione
        post("/end", (req, res) -> {
            sessione.endSession();
            return "Sessione terminata.";
        });

        // Report
        get("/report", (req, res) -> {
            res.type("application/json");
            return gson.toJson(sessione.getReportSalvati());
        });

        // Stato sessione corrente
        get("/sessione/corrente", (req, res) -> {
            res.type("application/json");
            if (!sessione.isInSession()) {
                return "{\"attiva\": false}";
            }
            return gson.toJson(sessione.toStatusDTO());
        });


        // ✅ API Materie
        get("/materie", (req, res) -> {
            res.type("application/json");
            return gson.toJson(MateriaStore.caricaMaterie());
        });

        post("/materie", (req, res) -> {
            res.type("application/json");
            Materia nuova = gson.fromJson(req.body(), Materia.class);
            nuova.id = java.util.UUID.randomUUID().toString();
            var materie = MateriaStore.caricaMaterie();
            materie.add(nuova);
            MateriaStore.salvaMaterie(materie);
            return gson.toJson(nuova);
        });

        put("/materie/:id", (req, res) -> {
            res.type("application/json");
            String id = req.params(":id");
            Materia update = gson.fromJson(req.body(), Materia.class);
            var materie = MateriaStore.caricaMaterie();
            for (Materia m : materie) {
                if (m.id.equals(id)) {
                    m.nome = update.nome;
                    m.colore = update.colore;
                    break;
                }
            }
            MateriaStore.salvaMaterie(materie);
            return gson.toJson("Aggiornata");
        });

        delete("/materie/:id", (req, res) -> {
            res.type("application/json");
            String id = req.params(":id");
            var materie = MateriaStore.caricaMaterie();
            materie.removeIf(m -> m.id.equals(id));
            MateriaStore.salvaMaterie(materie);
            return gson.toJson("Eliminata");
        });
    }
}
