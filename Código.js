// add custom menu
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('GitHub Stats')
      .addItem('📈 Ver estadísticas de tráfico', 'abrirDashboard')
      .addSeparator()
      .addItem('📥 Leer info repositorios', 'getUserRepos')
      .addItem('🔄 Recuperar tráfico', 'recuperarTrafico')
      .addItem('⏰ Configurar activador', 'abrirActivadorUI')
      .addSeparator()
      .addItem('🔑 Configurar credenciales', 'abrirCredencialesUI')
      .addItem('🚪 Cerrar sesión', 'abrirCerrarSesionUI')
      .addSeparator()
      .addItem('ℹ️ Acerca de...', 'abrirAcercaDe')
      .addToUi();
}

/**
 * Abre la interfaz de visualización de estadísticas (Dashboard).
 */
function abrirDashboard() {
  const html = HtmlService.createHtmlOutputFromFile('Dashboard')
      .setWidth(1000)
      .setHeight(850)
      .setTitle('Estadísticas de tráfico');
  SpreadsheetApp.getUi().showModalDialog(html, 'Estadísticas de tráfico');
}

/**
 * Abre la interfaz de configuración del activador.
 */
function abrirActivadorUI() {
  const html = HtmlService.createHtmlOutputFromFile('ActivadorUI')
      .setWidth(550)
      .setHeight(580)
      .setTitle('Configurar activador');
  SpreadsheetApp.getUi().showModalDialog(html, 'Configurar activador');
}

/**
 * Abre el diálogo de atribución/acerca de.
 */
function abrirAcercaDe() {
  const html = HtmlService.createHtmlOutputFromFile('acercaDe')
      .setWidth(450)
      .setHeight(480)
      .setTitle('Acerca de GitHub Stats');
  SpreadsheetApp.getUi().showModalDialog(html, 'Acerca de GitHub Stats');
}

/**
 * Abre la interfaz de configuración de credenciales OAuth de GitHub.
 */
function abrirCredencialesUI() {
  const html = HtmlService.createHtmlOutputFromFile('CredencialesUI')
      .setWidth(550)
      .setHeight(650)
      .setTitle('Configurar credenciales');
  SpreadsheetApp.getUi().showModalDialog(html, 'Configurar credenciales');
}

/**
 * Abre el diálogo HTML para iniciar la autorización.
 */
function abrirAutorizarUI() {
  const html = HtmlService.createHtmlOutputFromFile('AutorizarUI')
      .setWidth(450)
      .setHeight(280)
      .setTitle('Autorizar acceso a GitHub');
  SpreadsheetApp.getUi().showModalDialog(html, 'Autorizar acceso a GitHub');
}

/**
 * Abre el diálogo HTML para la confirmación de cierre de sesión.
 */
function abrirCerrarSesionUI() {
  const html = HtmlService.createHtmlOutputFromFile('CerrarSesionUI')
      .setWidth(450)
      .setHeight(370)
      .setTitle('Cerrar sesión de GitHub');
  SpreadsheetApp.getUi().showModalDialog(html, 'Cerrar sesión de GitHub');
}

/**
 * Comprueba si hay una sesión activa de GitHub autorizada.
 */
function comprobarSesionActiva() {
  return getGithubService().hasAccess();
}

/**
 * Ejecuta el cierre de sesión en el backend y devuelve mensaje de resultado.
 */
function cerrarSesionBackend() {
  try {
    const service = getGithubService();
    if (service.hasAccess()) {
      service.reset();
      return { estilo: 'green', mensaje: 'Sesión cerrada correctamente.' };
    }
    return { estilo: 'blue', mensaje: 'No había ninguna sesión activa.' };
  } catch (error) {
    return { estilo: 'red', mensaje: 'Error al cerrar sesión: ' + error.message };
  }
}

/**
 * Obtiene los datos de los repositorios y el histórico de tráfico para el dashboard.
 */
function obtenerDatosDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Obtener repositorios
  const sheetRepos = ss.getSheetByName('Repositorios');
  let repos = [];
  if (sheetRepos && sheetRepos.getLastRow() > 1) {
    repos = sheetRepos.getRange(2, 1, sheetRepos.getLastRow() - 1, 1).getValues().map(r => r[0]);
  }
  
  // Obtener tráfico histórico
  const sheetTrafico = ss.getSheetByName('Tráfico');
  const trafico = [];
  if (sheetTrafico && sheetTrafico.getLastRow() > 1) {
    const rawTrafico = sheetTrafico.getRange(2, 1, sheetTrafico.getLastRow() - 1, 4).getValues();
    rawTrafico.forEach(row => {
      // row[0]: repo, row[1]: fecha (Date o string), row[2]: views, row[3]: uniques
      let fechaStr = '';
      if (row[1] instanceof Date) {
        fechaStr = row[1].toISOString().substring(0, 10);
      } else {
        fechaStr = String(row[1]).substring(0, 10);
      }
      
      trafico.push({
        repo: row[0],
        fecha: fechaStr,
        views: Number(row[2]) || 0,
        uniques: Number(row[3]) || 0
      });
    });
  }
  
  return {
    repos: repos.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    trafico: trafico
  };
}



// Función vacía anterior conservada para retrocompatibilidad interna si hiciera falta
function cerrarSesion() {
  cerrarSesionBackend();
}

// Devuelve la fecha más reciente de la que se tienen datos de tráfico del
// repositorio o 1970-01-01 si no hay datos de tráfico

function ultimaFechaTrafico(repositorio) {
  
  let ultimaFecha = '1970-01-01'; // Si no hay datos de tráfico para el repo, asumir primera fecha JS  
  const ultimaFila = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tráfico').getLastRow() ;
  
  if (ultimaFila > 1) {
  
    // Obtener vector con nombres de repos ordenados por fecha de obtención de tráfico
    
    const datosTrafico = SpreadsheetApp.getActiveSpreadsheet().getRange('Tráfico!A2').offset(0, 0, ultimaFila - 1,1).getDisplayValues()
      .map(d => d[0]);
    
    Logger.log(datosTrafico);
    
    // Localizar última fila en la que se dispone de datos del repositorio
    
    const fila = datosTrafico.lastIndexOf(repositorio);
    
    Logger.log(repositorio + ' ' + fila);
    
    if (fila != -1) {
      ultimaFecha =  SpreadsheetApp.getActiveSpreadsheet().getRange('Tráfico!A2').offset(fila, 1, 1, 1).getDisplayValue();
    }    
  }
  
  return ultimaFecha;

}

function recuperarTrafico() {
  
  // Corregir: si se ha borrado un respositorio pero no se ha actualizado la lista en la hoja 1 se producirá un error (no fatal)
  // Controlar este error (json = 'Not found') o actualizar siempre lista de repositorios antes de actualizarlos
 
  const service = getGithubService();

  if (service.hasAccess()) {
     
    Logger.log("App has access.");   
    
    // Obtener el nombre de usuario autenticado de la API de GitHub
    let username = "";
    try {
      const userHeaders = {
        "Authorization": "Bearer " + service.getAccessToken(),
        "Accept": "application/vnd.github.v3+json"
      };
      const userOptions = {
        "headers": userHeaders,
        "method": "GET",
        "muteHttpExceptions": true
      };
      const userResponse = UrlFetchApp.fetch("https://api.github.com/user", userOptions);
      if (userResponse.getResponseCode() === 200) {
        const userJson = JSON.parse(userResponse.getContentText());
        if (userJson && userJson.login) {
          username = userJson.login;
          Logger.log("Nombre de usuario obtenido de GitHub: " + username);
        }
      }
    } catch (e) {
      Logger.log("Error al obtener nombre de usuario de GitHub: " + e.message);
    }

    if (!username) {
      Logger.log("No se pudo obtener el nombre de usuario de GitHub. Abortando recuperarTrafico.");
      return;
    }
       
    // Obtener vector con nombres y propietarios de repositorios
    const sheetRepo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Repositorios');
    const lastRowRepo = sheetRepo.getLastRow();
    if (lastRowRepo <= 1) {
      Logger.log("No hay repositorios para procesar.");
      return;
    }
    // Leemos Nombre (Columna A) y Propietario (Columna B)
    const datosRepos = sheetRepo.getRange('A2:B' + lastRowRepo).getValues();
    
    const sheetTrafico = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tráfico');
    
    mostrarToast('Iniciando lectura de datos de tráfico para ' + datosRepos.length + ' repositorios...', 'Recuperar tráfico');
    
    // 1. Cargar TODOS los datos históricos de la hoja Tráfico una sola vez en memoria
    const lastRowTrafico = sheetTrafico.getLastRow();
    let valoresTrafico = [];
    if (lastRowTrafico > 1) {
      valoresTrafico = sheetTrafico.getRange(2, 1, lastRowTrafico - 1, 4).getValues();
    }
    
    // Crear un mapa para búsqueda rápida O(1) de filas existentes en memoria: "repo_fecha" -> fila_index
    const mapaTrafico = {};
    const tz = Session.getScriptTimeZone();
    valoresTrafico.forEach((row, index) => {
      const repo = row[0];
      const fecha = row[1];
      const fechaStr = fecha instanceof Date ? Utilities.formatDate(fecha, tz, "yyyy-MM-dd") : String(fecha).substring(0, 10);
      mapaTrafico[repo + "_" + fechaStr] = index;
    });

    const filasNuevas = [];
    let seHaModificadoTrafico = false;
    let procesados = 0;
    
    datosRepos.forEach(filaRepo => {
      const repo = filaRepo[0];
      const owner = filaRepo[1] || username; // Usamos su propietario, o el usuario autenticado como fallback
      
      procesados++;
      mostrarToast('Procesando (' + procesados + '/' + datosRepos.length + '): ' + repo, 'Recuperar tráfico');
    
      const api = "https://api.github.com/repos/" + owner + "/" + repo + "/traffic/views";

      const headers = {
        "Authorization": "Bearer " + getGithubService().getAccessToken(),
        "Accept": "application/vnd.github.v3+json"
      };
     
      const options = {
        "headers": headers,
        "method" : "GET",
        "muteHttpExceptions": true
      };
     
      const response = UrlFetchApp.fetch(api, options);
      const json = JSON.parse(response.getContentText());
    
      Logger.log (repo + ': ');
      Logger.log (json);
      
      if (json.views && json.views.length > 0) {
        json.views.forEach(r => {
          const fechaApi = r.timestamp.substring(0, 10);
          const visitas = r.count;
          const uniques = r.uniques;
          const clave = repo + "_" + fechaApi;

          if (mapaTrafico.hasOwnProperty(clave)) {
            const idx = mapaTrafico[clave];
            // Solo actualizamos si los valores de visitas o únicos han cambiado
            if (valoresTrafico[idx][2] !== visitas || valoresTrafico[idx][3] !== uniques) {
              valoresTrafico[idx][2] = visitas;
              valoresTrafico[idx][3] = uniques;
              seHaModificadoTrafico = true;
              Logger.log("Actualizado en memoria: " + repo + " | " + fechaApi + " | Visitas: " + visitas + " | Únicos: " + uniques);
            }
          } else {
            // Añadir nuevo registro preparado
            const nuevaFila = [repo, fechaApi, visitas, uniques];
            filasNuevas.push(nuevaFila);
            
            // Lo añadimos al array y mapa por si la API de GitHub trajera duplicados o consultáramos algo intersecado
            valoresTrafico.push(nuevaFila);
            mapaTrafico[clave] = valoresTrafico.length - 1;
            seHaModificadoTrafico = true;
            Logger.log("Nuevo registro preparado: " + repo + " | " + fechaApi);
          }
        });
      }
    });

    // 2. Escribir los datos modificados / insertados de forma masiva (Batch writes)
    if (seHaModificadoTrafico) {
      mostrarToast('Escribiendo cambios en la hoja...', 'Recuperar tráfico');
      
      // Actualizamos todo el bloque de datos existentes de una sola llamada
      if (valoresTrafico.length > 0) {
        // Redimensionar el rango para sobrescribir todo el bloque histórico consolidado (evita loops por cada celda)
        sheetTrafico.getRange(2, 1, valoresTrafico.length, 4).setValues(valoresTrafico);
      }
      Logger.log("Escritura por lotes completada en Tráfico.");
    }
    
    mostrarToast('Tráfico histórico actualizado con éxito para todos los repositorios.', 'Recuperar tráfico', 10);
  } else {
    Logger.log("App has no access yet.");
    abrirAutorizarUI();
  }  

}

/**
 * Get User Repos
 */
function getUserRepos() {
   const service = getGithubService();
 
   if (service.hasAccess()) {
     
     Logger.log("App has access.");
     
     let allRepos = [];
     // Se inicia la petición solicitando el máximo de elementos por página (100)
     let api = "https://api.github.com/user/repos?per_page=100";
 
     const headers = {
       "Authorization": "Bearer " + service.getAccessToken(),
       "Accept": "application/vnd.github.v3+json"
     };
     
     const options = {
       "headers": headers,
       "method" : "GET",
       "muteHttpExceptions": true
     };
     
     // Bucle para recorrer todas las páginas de resultados
     do {
       const response = UrlFetchApp.fetch(api, options);
       const jsonResponse = JSON.parse(response.getContentText());
       allRepos = allRepos.concat(jsonResponse); // Se añaden los repositorios de la página actual a la lista total
       
       // Se busca la URL de la siguiente página en la cabecera 'Link'
       const linkHeader = response.getAllHeaders()['Link'];
       let nextUrl = null;
       
       if (linkHeader) {
         // Se extrae la URL de 'next' usando una expresión regular
         const match = /<([^>]+)>;\s*rel="next"/.exec(linkHeader);
         if (match) {
           nextUrl = match[1];
         }
       }
       
       api = nextUrl; // Se actualiza la URL para la siguiente iteración
       
     } while (api); // El bucle continúa mientras haya una página siguiente
     
     Logger.log("Total de repositorios recuperados: " + allRepos.length);
     mostrarToast('Se han encontrado ' + allRepos.length + ' repositorios. Escribiendo datos...', 'Leer info repositorios');
     if (allRepos.length > 0) {
        
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Repositorios');
 
        // Se borra el contenido existente (excepto la cabecera)
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }

        // Ordenar alfabéticamente por nombre de repositorio (ignora mayúsculas/minúsculas)
        allRepos.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        
        // Se mapean todos los repositorios recuperados al formato deseado
        const reposDatos = allRepos.map(r => {
          const fechaCreacion = r.created_at ? r.created_at.substring(0, 10) : '';
          const fechaPush = r.pushed_at ? r.pushed_at.substring(0, 10) : '';
          const descripcion = r.description || '';
          const owner = r.owner ? r.owner.login : '';

          return [
            r.name,
            owner,
            r.private ? "Privado" : "Público",
            r.html_url, // Nota: Se usa html_url para que el enlace se pueda abrir en el navegador
            r.forks_count,
            r.stargazers_count,
            r.open_issues_count,
            descripcion,
            fechaCreacion,
            fechaPush
          ];
        });
        
        // Se escriben los nuevos datos en la hoja de cálculo
        sheet.getRange(2, 1, reposDatos.length, reposDatos[0].length).setValues(reposDatos); 
        mostrarToast('Información de repositorios actualizada correctamente.', 'Leer info repositorios', 10);
      }
     
   }
   else {
     Logger.log("App has no access yet.");
     abrirAutorizarUI();
   }
  }



/***************************************/
// Get User Repos (v0, ya no usada)
/***************************************/
function getUserRepos_v0() {
   var service = getGithubService();

   if (service.hasAccess()) {
     
     Logger.log("App has access.");
     
     var api = "https://api.github.com/user/repos";  // repositorios del usuario autenticado

     var headers = {
       "Authorization": "Bearer " + getGithubService().getAccessToken(),
       "Accept": "application/vnd.github.v3+json"
     };
     
     var options = {
       "headers": headers,
       "method" : "GET",
       "muteHttpExceptions": true
     };
     
     var response = UrlFetchApp.fetch(api, options);
     
     var json = JSON.parse(response.getContentText());
          
     // ¡Ojo, solo devuelve ¿30? https://developer.github.com/v3/guides/traversing-with-pagination/
     
     if (json.length != 0) {
       
       if (SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Repositorios').getLastRow() > 2) 
         {SpreadsheetApp.getActiveSheet().getRange('Repositorios!A2').offset(0, 0, SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Repositorios').getLastRow() - 1, SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Repositorios').getLastColumn()).clearContent();}
       
       var reposDatos = [];
       
       json.map(r => {reposDatos.push(
                [r.name
                ,r.private ? "Privado" : "Público"
                ,r.url
                ,r.forks_count
                ,r.stargazers_count
                ,r.open_issues_count
                ]
       );});
       
       Logger.log(reposDatos.length + ' ' + reposDatos[0].length);
       
       // Por hacer: borrar lista por si hay menos de los actuales
       
       SpreadsheetApp.getActiveSheet().getRange('Repositorios!A2').offset(0, 0, reposDatos.length, reposDatos[0].length).setValues(reposDatos); 
       
     }
     
   }
   else {
     Logger.log("App has no access yet.");
     
     // open this url to gain authorization from github
     var authorizationUrl = service.getAuthorizationUrl();
     SpreadsheetApp.getUi().alert('Concede acceso a tu cuenta de GitHub en este URL:\n\n' + authorizationUrl);
   }
 }

/***************************************/
// Get Rate limit
function getGitHubRateLimit() {
  // set up the service
  const service = getGithubService();
  
  if (service.hasAccess()) {
    Logger.log("App has access.");
    
    const api = "https://api.github.com/rate_limit";
    
    const headers = {
      "Authorization": "Bearer " + getGithubService().getAccessToken(),
      "Accept": "application/vnd.github.v3+json"
    };
    
    const options = {
      "headers": headers,
      "method" : "GET",
      "muteHttpExceptions": true
    };
    
    const response = UrlFetchApp.fetch(api, options);
    
    const json = JSON.parse(response.getContentText());
    const responseCode = response.getResponseCode();
    
    Logger.log(responseCode);
    
    Logger.log("You have " + json.rate.remaining + " requests left this hour.");
    
  }
  else {
    Logger.log("App has no access yet.");
    
    // open this url to gain authorization from github
    const authorizationUrl = service.getAuthorizationUrl();
    Logger.log("Open the following URL and re-run the script: %s",
        authorizationUrl);
  }
}

/**
 * Muestra un toast en la hoja de cálculo activa si la sesión es interactiva (abierta por un usuario).
 * @param {string} mensaje El mensaje a mostrar.
 * @param {string} titulo El título del toast.
 * @param {number} duracionSegundos Duración en segundos. Usa -1 para que no desaparezca por tiempo.
 */
function mostrarToast(mensaje, titulo, duracionSegundos) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      // Si no se especifica, por defecto usamos -1 para que no desaparezca por tiempo
      const duracion = (duracionSegundos !== undefined) ? duracionSegundos : -1;
      ss.toast(mensaje, titulo || 'GitHub Stats', duracion);
    }
  } catch (e) {
    // Silencioso en ejecuciones de trigger sin interfaz de usuario activa
  }
}
