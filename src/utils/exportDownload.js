// Descarga en el navegador de un archivo exportado (Excel / PDF) recibido
// como blob del backend. Panel web (sin Capacitor): descarga estandar via
// enlace temporal. Funcion pura: el aviso al usuario lo maneja quien la llama.
export function downloadExport(data, baseName, ext) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${baseName}.${ext}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
