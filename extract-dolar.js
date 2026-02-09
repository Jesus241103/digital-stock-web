const { exec } = require('child_process');
const cheerio = require('cheerio');

(async () => {
  try {
    exec('curl -s https://www.bcv.org.ve/', (error, stdout, stderr) => {
      if (error) {
        console.error('Error al ejecutar curl:', error.message);
        console.log('dolar=', -1);
        return;
      }
      if (stderr) {
        console.error('Error en el comando curl:', stderr);
        console.log('dolar=', -1);
        return;
      }

      const $ = cheerio.load(stdout);

      const dolarElement = $('#dolar .col-sm-6.col-xs-6.centrado strong');
      const dolarValue = dolarElement.text().trim();

      if (dolarValue) {
        console.log('dolar=', dolarValue);
      } else {
        console.warn('No se encontró el valor del dólar. Retornando valor predeterminado: 0');
        console.log('dolar=', 0);
      }
    });
  } catch (error) {
    console.error('Error general:', error.message);
    console.log('dolar=', -1);
  }
})();
