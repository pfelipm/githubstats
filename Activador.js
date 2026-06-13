const PARAMS = {
  clavePropActivador: 'github_stats_activador_config',
  mToast: {
    excepcion: 'red',
    exito: 'green',
    info: 'blue'
  }
};

/**
 * Obtiene los ajustes guardados del activador.
 */
function obtenerAjustesActivador() {
  const prop = PropertiesService.getScriptProperties().getProperty(PARAMS.clavePropActivador);
  return prop ? JSON.parse(prop) : null;
}

/**
 * Elimina todos los activadores existentes asociados a recuperarTrafico.
 * 
 * @param {boolean} limpiarPropiedades Si es verdadero, borra también el registro de propiedades del script.
 */
function eliminarActivador(limpiarPropiedades) {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'recuperarTrafico') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  if (limpiarPropiedades) {
    PropertiesService.getScriptProperties().deleteProperty(PARAMS.clavePropActivador);
  }
  return { estilo: PARAMS.mToast.exito, mensaje: 'Activador desactivado correctamente.' };
}

/**
 * Crea un activador (trigger) para ejecutar la recuperación automática
 * de estadísticas y tráfico de GitHub.
 * 
 * @param   {Object}  ajustes    Objeto: { cadaPeriodo, periodo ('hora' | 'dia' | 'semana' ), hora (núm 0-23) }
 * @returns {Object}  Respuesta con estilo y mensaje para M.toast()
 */
function crearActivador2(ajustes) {
  // Eliminar activadores previos
  eliminarActivador(false);

  try {
    const diasMapping = { 
      'Lunes': ScriptApp.WeekDay.MONDAY, 
      'Martes': ScriptApp.WeekDay.TUESDAY, 
      'Miércoles': ScriptApp.WeekDay.WEDNESDAY, 
      'Jueves': ScriptApp.WeekDay.THURSDAY, 
      'Viernes': ScriptApp.WeekDay.FRIDAY, 
      'Sábado': ScriptApp.WeekDay.SATURDAY, 
      'Domingo': ScriptApp.WeekDay.SUNDAY 
    };

    switch (ajustes.periodo) {
      case 'hora':
        ScriptApp.newTrigger('recuperarTrafico').timeBased().everyHours(Number(ajustes.cadaPeriodo)).create();
        break;
      case 'dia':
        ScriptApp.newTrigger('recuperarTrafico').timeBased().everyDays(Number(ajustes.cadaPeriodo)).atHour(Number(ajustes.hora)).create();
        break;
      case 'semana':
        const diasSeleccionados = Array.isArray(ajustes.cadaPeriodo) ? ajustes.cadaPeriodo : [ajustes.cadaPeriodo];
        if (diasSeleccionados.length === 0) throw new Error('Debes seleccionar al menos un día.');
        
        diasSeleccionados.forEach(dia => {
          ScriptApp.newTrigger('recuperarTrafico')
            .timeBased()
            .onWeekDay(diasMapping[dia])
            .atHour(Number(ajustes.hora))
            .create();
        });
        break;
      default:
        throw new Error('Periodo no válido');
    }

    PropertiesService.getScriptProperties().setProperty(PARAMS.clavePropActivador, JSON.stringify(ajustes));
    return { estilo: PARAMS.mToast.exito, mensaje: 'Activador configurado correctamente.' };
  } catch (error) {
    return { estilo: PARAMS.mToast.excepcion, mensaje: 'Error al configurar el activador: ' + error.message };
  }
}
