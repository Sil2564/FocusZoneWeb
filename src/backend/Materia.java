package backend;

public class Materia {
    public String id;
    public String nome;
    public String colore; // Es: "#FF6B6B"

    public Materia() {}

    public Materia(String id, String nome, String colore) {
        this.id = id;
        this.nome = nome;
        this.colore = colore;
    }
}
