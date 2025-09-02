package backend;

import java.util.Random;

public class SimulatoreSessione implements Runnable {

    private final StudioSession sessione;
    private final String materia;
    private final String note;
    private final Random random = new Random();

    public SimulatoreSessione(StudioSession sessione, String materia, String note) {
        this.sessione = sessione;
        this.materia = materia;
        this.note = note;
    }

    public void start() {
        Thread t = new Thread(this);
        t.start();
    }

    @Override
    public void run() {
        // Avvia sessione simulata con materia e note dell'utente
        sessione.startSession(materia, note);

        int durataTotale = random.nextInt(60, 120); // 1–2 minuti
        int tempoTrascorso = 0;

        while (tempoTrascorso < durataTotale && sessione.isInSession()) {

            int studio = random.nextInt(15, 30);
            for (int i = 0; i < studio && sessione.isInSession(); i++) {
                sessione.update(true);
                dormiUnSecondo();
                tempoTrascorso++;
                if (tempoTrascorso >= durataTotale) break;
            }

            int pausa = random.nextInt(3, 6);
            for (int i = 0; i < pausa && sessione.isInSession(); i++) {
                sessione.update(false);
                dormiUnSecondo();
                tempoTrascorso++;
                if (tempoTrascorso >= durataTotale) break;
            }
        }

        if (sessione.isInSession()) {
            sessione.endSession();
        }

        System.out.println("✅ Simulazione completata per materia: " + materia);
    }

    private void dormiUnSecondo() {
        try {
            Thread.sleep(1000); // 1 sec = 1 min
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
