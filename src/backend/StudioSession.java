package backend;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import backend.Report;

public class StudioSession {
    private boolean inSession = false;
    private int studioSeconds = 0;
    private int pausaSeconds = 0;
    private int pauseBrevi = 0;
    private boolean richiestaFine = false;

    private final int MAX_PAUSA_BREVE = 5;  // 5 secondi = 5 minuti
    private final int MAX_PAUSA_LUNGA = 30; // 30 secondi = 30 minuti

    private String materia;
    private String note;
    private LocalDateTime data;

    private List<Boolean> storicoPresenza = new ArrayList<>();
    private List<List<Boolean>> tutteLeSessioni = new ArrayList<>();
    private List<Report> reportSalvati = new ArrayList<>();

    public StudioSession() {
        caricaReportDaFile(); // Carica i report al momento della creazione dell'oggetto
    }

    public void startSession(String materia, String note) {
        inSession = true;
        studioSeconds = 0;
        pausaSeconds = 0;
        pauseBrevi = 0;
        richiestaFine = false;
        storicoPresenza.clear();

        this.materia = materia;
        this.note = note;
        this.data = LocalDateTime.now();

        System.out.println("Sessione iniziata!");
    }

    public boolean isInSession() {
        return inSession;
    }

    public void update(boolean presenza) {
        if (!inSession) return;

        storicoPresenza.add(presenza);

        if (presenza) {
            if (pausaSeconds > 0) {
                if (pausaSeconds <= MAX_PAUSA_BREVE) {
                    pauseBrevi++;
                    System.out.println("Pausa breve terminata (" + pausaSeconds + " minuti).");
                } else {
                    System.out.println("Pausa troppo lunga. Sessione terminata.");
                    endSession();
                    return;
                }
                pausaSeconds = 0;
            }
            studioSeconds++;
        } else {
            pausaSeconds++;
        }
    }

    public void endSession() {
        inSession = false;
        tutteLeSessioni.add(new ArrayList<>(storicoPresenza));

        // 🔹 Crea report con data già formattata
        Report r = new Report(materia, note, data, studioSeconds, pauseBrevi);
        reportSalvati.add(r);

        // 🔹 Log extra per confermare valori
        System.out.println("💾 Report creato:");
        System.out.println("Materia: " + r.materia);
        System.out.println("Note: " + r.note);
        System.out.println("Data: " + r.data);
        System.out.println("Minuti studio: " + r.minutiStudio);
        System.out.println("Pause brevi: " + r.pauseBrevi);

        salvaReportSuFile();

        System.out.println("Sessione terminata.");
        stampaStorico();
    }

    private void salvaReportSuFile() {
        try (FileWriter writer = new FileWriter("report.json")) {
            Gson gson = new Gson();
            gson.toJson(reportSalvati, writer);
            System.out.println("💾 Tutti i report salvati su file!");
        } catch (IOException e) {
            System.err.println("Errore durante il salvataggio dei report: " + e.getMessage());
        }
    }

    private void caricaReportDaFile() {
        File file = new File("report.json");
        if (!file.exists()) return;

        try (FileReader reader = new FileReader(file)) {
            Gson gson = new Gson();
            Type reportListType = new TypeToken<List<Report>>() {}.getType();
            List<Report> caricati = gson.fromJson(reader, reportListType);
            if (caricati != null) {
                reportSalvati.addAll(caricati);
                System.out.println("✅ Report caricati da file: " + caricati.size());
                for (Report r : caricati) {
                    System.out.println("   [" + r.materia + "] " + r.minutiStudio + " min, " + r.pauseBrevi + " pause brevi");
                }
            }
        } catch (IOException e) {
            System.err.println("Errore durante la lettura del file dei report: " + e.getMessage());
        }
    }

    public void richiediFineSessione() {
        richiestaFine = true;
    }

    public boolean fineRichiesta() {
        return richiestaFine;
    }

    public void stampaStorico() {
        System.out.println("\n📝 Storico sessione:");
        for (int i = 0; i < storicoPresenza.size(); i++) {
            String stato = storicoPresenza.get(i) ? "Presente" : "Assente";
            System.out.println("Minuto " + (i + 1) + ": " + stato);
        }
    }

    public List<List<Boolean>> getTutteLeSessioni() {
        return tutteLeSessioni;
    }

    public int getStudioSeconds() {
        return studioSeconds;
    }

    public int getPauseBrevi() {
        return pauseBrevi;
    }

    public String getMateria() {
        return materia;
    }

    public String getNote() {
        return note;
    }

    public LocalDateTime getData() {
        return data;
    }

    public List<Report> getReportSalvati() {
        return reportSalvati;
    }

    public SessioneStatusDTO toStatusDTO() {
        SessioneStatusDTO dto = new SessioneStatusDTO();
        dto.attiva = inSession;
        dto.materia = materia;
        dto.note = note;
        dto.minutiTrascorsi = studioSeconds;  // 1 secondo = 1 minuto nella simulazione

        if (!storicoPresenza.isEmpty()) {
            boolean ultimo = storicoPresenza.get(storicoPresenza.size() - 1);
            dto.stato = ultimo ? "PRESENTE" : "ASSENTE";
        } else {
            dto.stato = "N/D";
        }

        return dto;
    }

}
