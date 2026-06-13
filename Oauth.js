// Configuración de almacenamiento de credenciales
const OAUTH_PARAMS = {
  clientIdProp: 'github_stats_client_id',
  clientSecretProp: 'github_stats_client_secret'
};

// configure the service
function getGithubService() {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty(OAUTH_PARAMS.clientIdProp) || '';
  const clientSecret = props.getProperty(OAUTH_PARAMS.clientSecretProp) || '';

  return OAuth2.createService('GitHub')
    .setAuthorizationBaseUrl('https://github.com/login/oauth/authorize')
    .setTokenUrl('https://github.com/login/oauth/access_token')
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setScope('repo') // 'user' solo devuelve los repos públicos
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCache(CacheService.getUserCache());
}

/**
 * Obtiene la URI de redirección y las credenciales actualmente almacenadas.
 */
function obtenerAjustesCredenciales() {
  const service = getGithubService();
  const props = PropertiesService.getScriptProperties();
  const redirectUri = service.getRedirectUri();
  const scriptUri = redirectUri ? redirectUri.substring(0, redirectUri.lastIndexOf('/')) : '';
  return {
    redirectUri: redirectUri,
    scriptUri: scriptUri,
    clientId: props.getProperty(OAUTH_PARAMS.clientIdProp) || '',
    clientSecret: props.getProperty(OAUTH_PARAMS.clientSecretProp) || ''
  };
}

/**
 * Obtiene la URL de autorización para el diálogo HTML.
 */
function obtenerUrlAutorizacion() {
  return getGithubService().getAuthorizationUrl();
}

/**
 * Guarda las credenciales de GitHub en las propiedades del script.
 */
function guardarCredencialesOAuth(clientId, clientSecret) {
  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(OAUTH_PARAMS.clientIdProp, clientId);
    props.setProperty(OAUTH_PARAMS.clientSecretProp, clientSecret);
    return { estilo: 'green', mensaje: 'Credenciales guardadas con éxito.' };
  } catch (error) {
    return { estilo: 'red', mensaje: 'Error al guardar credenciales: ' + error.message };
  }
}

// handle the callback
function authCallback(request) {
  const githubService = getGithubService();
  const isAuthorized = githubService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet"><style>body{font-family:\'Outfit\',sans-serif;text-align:center;padding:50px;background:#f8fafc;}h1{color:#10b981;}p{color:#64748b;}</style></head><body><h1>¡Acceso concedido con éxito!</h1><p>Ya puedes cerrar esta pestaña y volver a tu hoja de cálculo.</p></body></html>');
  } else {
    return HtmlService.createHtmlOutput('<!DOCTYPE html><html><head><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet"><style>body{font-family:\'Outfit\',sans-serif;text-align:center;padding:50px;background:#f8fafc;}h1{color:#ef4444;}p{color:#64748b;}</style></head><body><h1>Acceso denegado</h1><p>Comprueba tus credenciales e inténtalo de nuevo.</p></body></html>');
  }
}
