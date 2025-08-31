package backend;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

public class MateriaStore {
    private static final String FILE_PATH = "data/materie.json";
    private static final Gson gson = new Gson();

    // Legge le materie dal file
    public static List<Materia> caricaMaterie() {
        try (FileReader reader = new FileReader(FILE_PATH)) {
            Type listType = new TypeToken<List<Materia>>() {}.getType();
            List<Materia> materie = gson.fromJson(reader, listType);
            return (materie != null) ? materie : new ArrayList<>();
        } catch (IOException e) {
            return new ArrayList<>();
        }
    }

    // Salva la lista di materie su file
    public static void salvaMaterie(List<Materia> materie) {
        try (FileWriter writer = new FileWriter(FILE_PATH)) {
            gson.toJson(materie, writer);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
