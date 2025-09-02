# FocusZoneWeb

## Descrizione
FocusZoneWeb è un'applicazione web pensata per aiutare gli studenti a monitorare e ottimizzare le sessioni di studio.
Rileva la presenza alla scrivania tramite un sensore di prossimità, gestisce automaticamente le pause e fornisce un report dettagliato della sessione.

## Funzionalità principali
- Avvio e monitoraggio delle **sessioni di studio**.  
- Rilevamento automatico delle **pause** tramite sensore di prossimità.  
- Generazione di **resoconti** con durata totale, numero e durata pause, materia e note.  
- **Salvataggio** delle sessioni per consultazioni future.  
- Interfaccia web semplice e intuitiva per gestione e visualizzazione delle sessioni.

## Installazione
1. Clonare il repository:
     https://github.com/Sil2564/FocusZoneWeb.git
2. Aprire il progetto su Intellij nella cartella principale.
3. Avviare il backend: runnare Main.java
4. Aprire index.html nel browser per usare l'app.

## Requisiti
- Node.js installato
- Browser moderno (Chrome, Edge, Firefox)

## Note
- Le sessioni possono essere avviate, messe in pausa o terminate manualmente. Altrimenti una sessione termina dopo 30 minuti di pausa in cui il sensore rileva "assente".
- I report vengono salvati localmente nel backend per consultazioni successive e suddivisi nella giusta materia selezionata.
- Possibilità di creare e cancellare materie
