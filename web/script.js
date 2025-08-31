const API_URL = "http://localhost:4567";
let pollingSessione; // memorizza setInterval per il polling

// 🔹 Carica materie e aggiorna UI
async function caricaMaterie() {
    const res = await fetch(`${API_URL}/materie`);
    const materie = await res.json();

    const select = document.getElementById("materiaSelect");
    select.innerHTML = `<option value="">-- Seleziona materia --</option>`;
    materie.forEach(m => {
        let opt = document.createElement("option");
        opt.value = m.nome;
        opt.textContent = m.nome;
        opt.style.color = m.colore;
        select.appendChild(opt);
    });
    select.innerHTML += `<option value="__nuova__">➕ Nuova materia...</option>`;

    mostraMaterieConSessioni(materie);
}

// 🔹 Mostra/nascondi form nuova materia
function checkNuovaMateria() {
    const sel = document.getElementById("materiaSelect");
    const form = document.getElementById("nuovaMateriaForm");
    form.style.display = (sel.value === "__nuova__") ? "block" : "none";
}

// 🔹 Aggiungi nuova materia
async function aggiungiMateria() {
    const nome = document.getElementById("nuovaMateriaNome").value;
    const colore = document.getElementById("nuovaMateriaColore").value;

    if (!nome) { alert("Inserisci un nome per la materia"); return; }

    await fetch(`${API_URL}/materie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, colore })
    });

    document.getElementById("nuovaMateriaNome").value = "";
    document.getElementById("nuovaMateriaForm").style.display = "none";

    caricaMaterie();
}

// 🔹 Restituisce colore di una materia dal select
function selezionaColoreMateria(nome) {
    const select = document.getElementById("materiaSelect");
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === nome) return select.options[i].style.color;
    }
    return "#000000";
}

// 🔹 Avvia sessione e polling per aggiornare div sessione in corso
async function startSession() {
    const materia = document.getElementById("materiaSelect").value;
    const note = document.getElementById("noteInput").value || "";

    if (!materia || materia === "__nuova__") {
        alert("Seleziona o crea una materia!");
        return;
    }

    // Avvia sessione sul server
    await fetch(`${API_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materia, note })
    });

    // Mostra subito il div sessione in corso
    const divSessione = document.getElementById("sessioneCorrente");
    divSessione.style.display = "block";
    document.getElementById("statoMateria").textContent = materia;
    document.getElementById("statoMateria").style.color = selezionaColoreMateria(materia);
    document.getElementById("statoNote").textContent = note;
    document.getElementById("minutiTrascorsi").textContent = 0;
    document.getElementById("statoPresenza").textContent = "PRESENTE";

    // Avvia polling ogni 1 secondo
    if (pollingSessione) clearInterval(pollingSessione);
    pollingSessione = setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/sessione/corrente`);
            const dati = await res.json();

            if (dati.attiva) {
                document.getElementById("minutiTrascorsi").textContent = dati.minutiTrascorsi || 0;
                document.getElementById("statoPresenza").textContent = dati.stato || "PRESENTE";
            } else {
                clearInterval(pollingSessione);
                divSessione.style.display = "none";
                document.getElementById("statoPresenza").textContent = "Terminata";
                caricaMaterie();
            }
        } catch (err) {
            console.error("Errore nel polling sessione:", err);
        }
    }, 1000);
}

// 🔹 Termina sessione manualmente
async function terminaSessione() {
    await fetch(`${API_URL}/end`, { method: "POST" });
    document.getElementById("sessioneCorrente").style.display = "none";
    if (pollingSessione) clearInterval(pollingSessione);
    caricaMaterie();
}

// 🔹 Mostra contenitori con materie e sessioni
async function mostraMaterieConSessioni(materie) {
    const res = await fetch(`${API_URL}/report`);
    const report = await res.json();

    const container = document.getElementById("materieList");
    container.innerHTML = "";

    materie.forEach(m => {
        let box = document.createElement("div");
        box.className = "materia-box";
        box.style.border = `2px solid ${m.colore}`;
        box.style.padding = "10px";
        box.style.margin = "10px 0";
        box.style.borderRadius = "8px";

        let titolo = document.createElement("h4");
        titolo.textContent = m.nome;
        titolo.style.color = m.colore;
        box.appendChild(titolo);

        let lista = document.createElement("ul");

        report.filter(s => s.materia === m.nome).forEach(s => {
            let li = document.createElement("li");

            // Converti la stringa data in oggetto Date
            const dataObj = new Date(s.data);
            let formattedData = "";

            // Controllo se la data è valida
            if (!isNaN(dataObj.getTime())) {
                formattedData = `${String(dataObj.getDate()).padStart(2,'0')}/` +
                                `${String(dataObj.getMonth()+1).padStart(2,'0')}/` +
                                `${dataObj.getFullYear()}, ` +
                                `${String(dataObj.getHours()).padStart(2,'0')}:` +
                                `${String(dataObj.getMinutes()).padStart(2,'0')}`;
            } else {
                formattedData = s.data; // fallback se la data non è valida
            }

            li.textContent = `${formattedData} - Tempo totale: ${s.minutiStudio || 0} min - Note: ${s.note || "Nessuna nota"} - Pause brevi: ${s.pauseBrevi || 0}`;
            lista.appendChild(li);
        });

        if (lista.children.length === 0) lista.innerHTML = "<li><i>Nessuna sessione ancora</i></li>";

        box.appendChild(lista);
        container.appendChild(box);
    });
}


// 🔹 Inizializza al load
window.onload = () => {
    caricaMaterie();
};
