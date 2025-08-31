package backend;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.UUID;

public class MateriaController implements HttpHandler {
    private static final Gson gson = new Gson();

    // 🔹 Qui tieni la tua sessione globale
    private static StudioSession sessioneGlobale;

    public static void setSessioneGlobale(StudioSession sessione) {
        sessioneGlobale = sessione;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        List<Materia> materie = MateriaStore.caricaMaterie();
        String response = "";

        try {
            // 🔹 Lista tutte le materie
            if (method.equals("GET") && path.equals("/materie")) {
                response = gson.toJson(materie);

                // 🔹 Aggiungi materia
            } else if (method.equals("POST") && path.equals("/materie")) {
                Materia nuova = gson.fromJson(new String(exchange.getRequestBody().readAllBytes()), Materia.class);
                nuova.id = UUID.randomUUID().toString();
                materie.add(nuova);
                MateriaStore.salvaMaterie(materie);
                response = gson.toJson(nuova);

                // 🔹 Aggiorna materia
            } else if (method.equals("PUT") && path.startsWith("/materie/")) {
                String id = path.replace("/materie/", "");
                Materia update = gson.fromJson(new String(exchange.getRequestBody().readAllBytes()), Materia.class);
                for (Materia m : materie) {
                    if (m.id.equals(id)) {
                        m.nome = update.nome;
                        m.colore = update.colore;
                        break;
                    }
                }
                MateriaStore.salvaMaterie(materie);
                response = gson.toJson("Aggiornata");

                // 🔹 Elimina materia
            } else if (method.equals("DELETE") && path.startsWith("/materie/")) {
                String id = path.replace("/materie/", "");
                materie.removeIf(m -> m.id.equals(id));
                MateriaStore.salvaMaterie(materie);
                response = gson.toJson("Eliminata");

                // 🔹 Nuovo endpoint: stato sessione corrente
            } else if (method.equals("GET") && path.equals("/sessione/corrente")) {
                if (sessioneGlobale == null || !sessioneGlobale.isInSession()) {
                    response = "{\"attiva\": false}";
                } else {
                    response = gson.toJson(sessioneGlobale.toStatusDTO());
                }

                // 🔹 Percorso non trovato
            } else {
                exchange.sendResponseHeaders(404, -1);
                return;
            }

            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.getBytes().length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }

        } catch (Exception e) {
            exchange.sendResponseHeaders(500, -1);
        }
    }
}
