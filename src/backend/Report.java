package backend;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Report {
    public String materia;
    public String note;
    public String data;  // stringa già pronta per JSON
    public int minutiStudio;
    public int pauseBrevi;

    public Report(String materia, String note, LocalDateTime data, int minutiStudio, int pauseBrevi) {
        this.materia = materia;
        this.note = note;
        // 🔹 Formatta la data come dd/MM/yyyy, HH:mm
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy, HH:mm");
        this.data = data.format(formatter);

        this.minutiStudio = minutiStudio;
        this.pauseBrevi = pauseBrevi;
    }
}
