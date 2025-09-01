const BASE_URL = "http://localhost:4567";

// 🔹 Converte minuti totali in formato ore:minuti
function formatDurata(minutiTotali) {
    const ore = Math.floor(minutiTotali / 60);
    const minuti = minutiTotali % 60;
    return `${ore}h ${minuti.toString().padStart(2,'0')}min`;
}

let pollingSessione; // memorizza setInterval per il polling

// 🔹 Restituisce colore di una materia dal select
function selezionaColoreMateria(nome) {
    const select = document.getElementById("materiaSelect");
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === nome) return select.options[i].style.color;
    }
    return "#000000";
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

    await fetch(`${BASE_URL}/materie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, colore })
    });

    document.getElementById("nuovaMateriaNome").value = "";
    document.getElementById("nuovaMateriaForm").style.display = "none";

    caricaMaterie();
}

// 🔹 Carica materie e aggiorna UI
async function caricaMaterie() {
    const res = await fetch(`${BASE_URL}/materie`);
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

// 🔹 Mostra contenitori con materie e sessioni
async function mostraMaterieConSessioni(materie) {
    const res = await fetch(`${BASE_URL}/report`);
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

            if (!isNaN(dataObj.getTime())) {
                formattedData = `${String(dataObj.getDate()).padStart(2,'0')}/` +
                                `${String(dataObj.getMonth()+1).padStart(2,'0')}/` +
                                `${dataObj.getFullYear()}, ` +
                                `${String(dataObj.getHours()).padStart(2,'0')}:` +
                                `${String(dataObj.getMinutes()).padStart(2,'0')}`;
            } else {
                formattedData = s.data;
            }

            li.textContent = `${formattedData} - Tempo totale: ${formatDurata(s.minutiStudio || 0)} - Note: ${s.note || "Nessuna nota"} - Pause brevi: ${s.pauseBrevi || 0}`;
            lista.appendChild(li);
        });

        if (lista.children.length === 0) lista.innerHTML = "<li><i>Nessuna sessione ancora</i></li>";

        box.appendChild(lista);
        container.appendChild(box);
    });
}

// 🔹 Avvia sessione e polling per aggiornare div sessione in corso
async function startSession() {
    const materia = document.getElementById("materiaSelect").value;
    const note = document.getElementById("noteInput").value || "";

    if (!materia || materia === "__nuova__") {
        alert("Seleziona o crea una materia!");
        return;
    }

    await fetch(`${BASE_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materia, note })
    });

    Swal.fire({
        title: 'Sessione iniziata!',
        text: `Materia: ${materia}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });

    const divSessione = document.getElementById("sessioneCorrente");
    divSessione.style.display = "block";
    document.getElementById("statoMateria").textContent = materia;
    document.getElementById("statoMateria").style.color = selezionaColoreMateria(materia);
    document.getElementById("statoNote").textContent = note;
    document.getElementById("minutiTrascorsi").textContent = 0;
    document.getElementById("statoPresenza").textContent = "PRESENTE";

    if (pollingSessione) clearInterval(pollingSessione);
    pollingSessione = setInterval(async () => {
        try {
            const res = await fetch(`${BASE_URL}/sessione/corrente`);
            const dati = await res.json();

            if (dati.attiva) {
                document.getElementById("minutiTrascorsi").textContent = formatDurata(dati.minutiTrascorsi || 0);
                document.getElementById("statoPresenza").textContent = dati.stato || "PRESENTE";
            } else {
                clearInterval(pollingSessione);
                divSessione.style.display = "none";
                document.getElementById("statoPresenza").textContent = "Terminata";
                caricaMaterie();
                caricaCalendario(); // aggiorna calendario quando sessione termina
            }
        } catch (err) {
            console.error("Errore nel polling sessione:", err);
        }
    }, 1000);
}

// 🔹 Termina sessione manualmente
async function terminaSessione() {
    Swal.fire({
        title: 'Confermi di voler terminare la sessione?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Termina',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${BASE_URL}/end`, { method: "POST" })
                .then(() => {
                    document.getElementById("sessioneCorrente").style.display = "none";
                    if (pollingSessione) clearInterval(pollingSessione);
                    caricaMaterie();
                    caricaCalendario();
                });
        }
    });
}
  function parseData(str) {
        // "01/09/2025, 14:30"
        const [dataPart, oraPart] = str.split(", ");
        const [giorno, mese, anno] = dataPart.split("/");
        const [ore, minuti] = oraPart.split(":");
        return new Date(anno, mese-1, giorno, ore, minuti);
    }

// 🔹 Inizializza e popola il calendario con le sessioni
async function caricaCalendario() {
    const res = await fetch(`${BASE_URL}/report`);
    const report = await res.json();

    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        events: report.map(s => {
            let [dataPart, oraPart] = s.data.split(", "); // ["01/09/2025", "14:30"]
            let [giorno, mese, anno] = dataPart.split("/");
            let [ore, minuti] = oraPart.split(":");
            let startDate = new Date(anno, mese-1, giorno, ore, minuti); // JS mesi da 0

            return {
                title: s.materia,
                start: parseData(s.data),
                color: selezionaColoreMateria(s.materia),
                extendedProps: {
                    minutiStudio: s.minutiStudio,
                    pauseBrevi: s.pauseBrevi,
                    note: s.note
                }
            };
        }),


        eventClick: function(info) {
            const props = info.event.extendedProps;
            Swal.fire({
                title: info.event.title,
                html: `
                    <b>Ora:</b> ${info.event.start.toLocaleString()}<br>
                    <b>Tempo totale studio:</b> ${formatDurata(props.minutiStudio || 0)}<br>
                    <b>Pause brevi:</b> ${props.pauseBrevi || 0}<br>
                    <b>Note:</b> ${props.note || 'Nessuna nota'}
                `,
                icon: 'info'
            });
        }
    });

    calendar.render();
}

// 🔹 Inizializza tutto al load
// 🔹 Inizializza tutto al load
document.addEventListener('DOMContentLoaded', () => {
    caricaMaterie();

    caricaCalendario();
});

