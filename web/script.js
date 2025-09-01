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
        box.style.padding = "20px";
        box.style.margin = "10px 0";
        box.style.borderRadius = "8px";

        let titolo = document.createElement("h4");
        titolo.textContent = m.nome;
        titolo.style.color = m.colore;
        titolo.style.fontSize = "23px";
        titolo.style.margin = "0";
        box.appendChild(titolo);

        let totale = document.createElement("div");
        const totaleMinuti = report
            .filter(s => s.materia === m.nome)
            .reduce((sum, s) => sum + (s.minutiStudio || 0), 0);
        totale.textContent = `Totale studio: ${formatDurata(totaleMinuti)}`;
        totale.style.color = m.colore;
        totale.style.fontSize = "20px";
        totale.style.fontWeight = "bold";
        totale.style.marginTop = "4px";
        box.appendChild(totale);

        let lista = document.createElement("ul");
        report.filter(s => s.materia === m.nome).forEach(s => {
            let li = document.createElement("li");

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

            // ➤ Bottone Cancella
            let btnCancella = document.createElement("button");
            btnCancella.textContent = "Cancella";
            btnCancella.style.marginLeft = "10px";
            btnCancella.style.backgroundColor = "#3498db";
            btnCancella.style.color = "white";
            btnCancella.style.border = "none";
            btnCancella.style.borderRadius = "4px";
            btnCancella.style.padding = "2px 6px";
            btnCancella.style.cursor = "pointer";

            // Funzione per cancellare la sessione/report
            btnCancella.onclick = async () => {
                const conferma = await Swal.fire({
                    title: 'Vuoi davvero cancellare questa sessione?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sì, cancella',
                    cancelButtonText: 'Annulla'
                });

                if (conferma.isConfirmed) {
                    await fetch(`${BASE_URL}/report`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ materia: s.materia, data: s.data })
                    });
                    Swal.fire({
                        title: 'Sessione cancellata!',
                        icon: 'success',
                        timer: 1000,
                        showConfirmButton: false
                    });
                    caricaMaterie();
                    caricaCalendario();
                }
            };

            li.appendChild(btnCancella);
            lista.appendChild(li);
        });

        if (lista.children.length === 0) lista.innerHTML = "<li><i>Nessuna sessione ancora</i></li>";
        box.appendChild(lista);
        container.appendChild(box);
    });
}


// 🔹 Start session tramite API
async function startSessionAPI(materia, note) {
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
                caricaCalendario();
            }
        } catch (err) {
            console.error("Errore nel polling sessione:", err);
        }
    }, 1000);
}

// 🔹 SweetAlert: Nuova sessione
async function apriSweetAlertSessione() {
    const res = await fetch(`${BASE_URL}/materie`);
    const materie = await res.json();

    const { value: dati } = await Swal.fire({
        title: 'Nuova sessione',
        html: `
            <select id="swalMateriaSelect" class="swal2-select">
                <option value="">-- Seleziona materia --</option>
                ${materie.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('')}
            </select>
            <textarea id="swalNoteInput" class="swal2-textarea" placeholder="Note per la sessione"></textarea>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Inizia sessione',
        preConfirm: () => {
            const materia = document.getElementById('swalMateriaSelect').value;
            const note = document.getElementById('swalNoteInput').value;
            if (!materia) Swal.showValidationMessage("Seleziona una materia!");
            return { materia, note };
        }
    });

    if (dati) {
        startSessionAPI(dati.materia, dati.note);
    }
}

// 🔹 SweetAlert: Nuova materia
async function apriSweetAlertNuovaMateria() {
    const { value: formValues } = await Swal.fire({
        title: 'Nuova materia',
        html:
            '<input id="swalMateriaNome" class="swal2-input" placeholder="Nome materia">' +
            '<input type="color" id="swalMateriaColore" class="swal2-input" value="#3498db">',
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            const nome = document.getElementById('swalMateriaNome').value;
            const colore = document.getElementById('swalMateriaColore').value;
            if (!nome) Swal.showValidationMessage("Inserisci un nome!");
            return { nome, colore };
        }
    });

    if (formValues) {
        await fetch(`${BASE_URL}/materie`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: formValues.nome, colore: formValues.colore })
        });

        Swal.fire({
            icon: 'success',
            title: 'Materia aggiunta!',
            timer: 1200,
            showConfirmButton: false
        });

        caricaMaterie();
    }
}

// 🔹 Termina sessione
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

// 🔹 Parsing data string
function parseData(str) {
    const [dataPart, oraPart] = str.split(", ");
    const [giorno, mese, anno] = dataPart.split("/");
    const [ore, minuti] = oraPart.split(":");
    return new Date(anno, mese-1, giorno, ore, minuti);
}

// 🔹 Carica calendario
async function caricaCalendario() {
    const res = await fetch(`${BASE_URL}/report`);
    const report = await res.json();

    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
        eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        events: report.map(s => ({
            title: s.materia,
            start: parseData(s.data),
            color: selezionaColoreMateria(s.materia),
            textColor: selezionaColoreMateria(s.materia),
            extendedProps: {
                minutiStudio: s.minutiStudio,
                pauseBrevi: s.pauseBrevi,
                note: s.note
            }
        })),
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

// 🔹 Cancella sessione
async function cancellaSessione(id) {
    const conferma = await Swal.fire({
        title: 'Vuoi davvero cancellare questa sessione?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sì, cancella',
        cancelButtonText: 'Annulla'
    });

    if (conferma.isConfirmed) {
        await fetch(`${BASE_URL}/sessione/${id}`, { method: "DELETE" });
        Swal.fire({
            title: 'Sessione cancellata!',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false
        });
        caricaMaterie();
        caricaCalendario();
    }
}

// 🔹 Inizializza tutto al load
document.addEventListener('DOMContentLoaded', () => {
    caricaMaterie();
    caricaCalendario();

    // Bottone Nuova materia
    const btnNuovaMateria = document.getElementById("btnNuovaMateria");
    if (btnNuovaMateria) btnNuovaMateria.addEventListener("click", apriSweetAlertNuovaMateria);

    // H2 Avvia sessione
    const h2Sessione = document.getElementById("avviaSessione");
    if (h2Sessione) h2Sessione.addEventListener("click", apriSweetAlertSessione);
});
